import { Server, Socket } from "socket.io"
import { createMessage, findMessageById, createGroupMessage } from "../repositories/client/chat.repo"
import prisma from "../config/prisma"
import { queryRAGService } from "../services/client/rag.service"

const ensureAIBotUser = async () => {
  try {
    await prisma.user.upsert({
      where: { id: "ai-assistant-bot-uuid" },
      update: {},
      create: {
        id: "ai-assistant-bot-uuid",
        name: "AI Assistant",
        email: "ai.assistant@collabbrain.com",
        passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz0123456789",
        avatarUrl: null,
        isActive: true,
      }
    });
  } catch (error) {
    console.error("[Socket] Lỗi khởi tạo AI Bot User:", error);
  }
};

export const chatSocket = (io: Server) => {
  const onlineUsers = new Map<string, string>()
  const activeCalls = new Map<string, string>()

  ensureAIBotUser();

  io.on("connection", async (socket: Socket) => {
    const user = socket.data.user

    socket.join(user.id)
    onlineUsers.set(user.id, socket.id)

    try {
      const memberships = await prisma.groupMember.findMany({
        where: { userId: user.id },
        select: { groupId: true }
      })
      memberships.forEach(({ groupId }) => {
        socket.join(`group:${groupId}`)
      })
    } catch (e) {
      console.error("[Socket] Lỗi join group rooms:", e)
    }

    // Gửi danh sách online hiện tại CHỈ cho user vừa connect (không broadcast)
    socket.emit("user:initial_online", { onlineUserIds: Array.from(onlineUsers.keys()) })

    // Thông báo user online cho tất cả (ngoại trừ bản thân)
    socket.broadcast.emit("user:online_status", { userId: user.id, isOnline: true })

    // ——— CHAT 1-1 ———
    socket.on("chat:send_message", async (data) => {
      try {
        const { conversationId, content, type = "text", replyToId } = data
        const savedMessage = await createMessage(user.id, conversationId, content, type.toUpperCase() as any, replyToId)

        // Broadcast cho người nhận
        io.to(conversationId).emit("chat:new_message", { 
          message: { 
            ...savedMessage, 
            conversationId: user.id,
            type: savedMessage.type.toLowerCase() 
          } 
        })
        
        // Gửi lại cho người gửi (để tất cả các tab của người gửi đều update)
        io.to(user.id).emit("chat:new_message", { 
          message: { 
            ...savedMessage, 
            conversationId: conversationId, 
            type: savedMessage.type.toLowerCase() 
          } 
        })
      } catch (error: any) {
        socket.emit("chat:error", { message: error.message })
      }
    })

    socket.on("chat:typing", ({ conversationId, isTyping }: { conversationId: string; isTyping: boolean }) => {
      socket.to(conversationId).emit("chat:typing", {
        conversationId: user.id,
        userId: user.id,
        isTyping
      })
    })

    // ================================================================
    // ——— WEBRTC SIGNALING (CHAT 1-1) ———
    // ================================================================

    /**
     * BƯỚC 1: Caller yêu cầu gọi tới Callee
     */
    socket.on("call:request", ({ targetUserId, callType, callerInfo }: {
      targetUserId: string,
      callType: 'audio' | 'video',
      callerInfo: { name: string, avatarUrl?: string }
    }) => {
      if (!onlineUsers.has(targetUserId)) {
        socket.emit("call:error", { code: "USER_OFFLINE", message: "Người dùng không online" })
        return
      }

      console.log(`[Call] ${user.id} → ${targetUserId} [${callType}]`)

      io.to(targetUserId).emit("call:incoming", {
        callerId: user.id,
        callType,
        callerInfo: {
          name: callerInfo.name || "Người dùng",
          avatarUrl: callerInfo.avatarUrl || null
        }
      })
    })

    /**
     * BƯỚC 2A: Callee đồng ý cuộc gọi
     */
    socket.on("call:accept", ({ callerId }: { callerId: string }) => {
      console.log(`[Call] ${user.id} accepted call from ${callerId}`)
      activeCalls.set(user.id, callerId)
      activeCalls.set(callerId, user.id)
      io.to(callerId).emit("call:accepted", { calleeId: user.id })
    })

    /**
     * BƯỚC 2B: Callee từ chối cuộc gọi
     */
    socket.on("call:reject", ({ callerId, reason }: { callerId: string, reason?: string }) => {
      console.log(`[Call] ${user.id} rejected call from ${callerId}`)
      io.to(callerId).emit("call:rejected", {
        calleeId: user.id,
        reason: reason || "declined"
      })
    })

    /**
     * BƯỚC 3: Caller gửi WebRTC Offer SDP
     */
    socket.on("call:offer", ({ targetUserId, offer }: {
      targetUserId: string,
      offer: RTCSessionDescriptionInit
    }) => {
      io.to(targetUserId).emit("call:offer", {
        callerId: user.id,
        offer
      })
    })

    /**
     * BƯỚC 4: Callee gửi WebRTC Answer SDP
     */
    socket.on("call:answer", ({ targetUserId, answer }: {
      targetUserId: string,
      answer: RTCSessionDescriptionInit
    }) => {
      io.to(targetUserId).emit("call:answer", {
        calleeId: user.id,
        answer
      })
    })

    /**
     * BƯỚC 5: ICE Candidate
     */
    socket.on("call:ice-candidate", ({ targetUserId, candidate }: {
      targetUserId: string,
      candidate: RTCIceCandidateInit
    }) => {
      io.to(targetUserId).emit("call:ice-candidate", {
        senderId: user.id,
        candidate
      })
    })

    /**
     * Kết thúc cuộc gọi
     */
    socket.on("call:end", ({ targetUserId }: { targetUserId: string }) => {
      console.log(`[Call] ${user.id} ended call with ${targetUserId}`)
      activeCalls.delete(user.id)
      activeCalls.delete(targetUserId)
      io.to(targetUserId).emit("call:ended", { byUserId: user.id })
    })

    /**
     * Ghi nhận lịch sử cuộc gọi
     */
    socket.on("call:log", async ({ targetUserId, callType, status, duration }: { targetUserId: string, callType: string, status: string, duration?: string }) => {
      try {
        const content = `[CALL:${callType}:${status}${duration ? `:${duration}` : ''}]`
        const savedMessage = await createMessage(user.id, targetUserId, content, "TEXT")

        io.to(targetUserId).emit("chat:new_message", { 
          message: { 
            ...savedMessage, 
            conversationId: user.id, 
            type: "text" 
          } 
        })
        
        io.to(user.id).emit("chat:new_message", { 
          message: { 
            ...savedMessage, 
            conversationId: targetUserId, 
            type: "text" 
          } 
        })
      } catch (e) {
        console.error("[Socket] call:log error:", e)
      }
    })

    // ================================================================
    // ——— GROUP CHAT ———
    // ================================================================

    socket.on("group:join", ({ groupId }: { groupId: string }) => {
      if (groupId) {
        socket.join(`group:${groupId}`)
      }
    })

    socket.on("group:leave", ({ groupId }: { groupId: string }) => {
      if (groupId) {
        socket.leave(`group:${groupId}`)
      }
    })

    socket.on("group:send_message", async (data) => {
      try {
        const { groupId, content, type = "text", replyToId, mentionIds } = data
        if (!groupId || !content) return

        const member = await prisma.groupMember.findUnique({
          where: { groupId_userId: { groupId, userId: user.id } }
        })
        if (!member) {
          socket.emit("group:error", { message: "Bạn không phải thành viên nhóm này" })
          return
        }
        if (member.role === "VIEWER") {
          socket.emit("group:error", { message: "VIEWER không được phép gửi tin nhắn" })
          return
        }

        // Loại bỏ ID trùng lặp trong mentionIds
        const uniqueMentionIds = mentionIds && mentionIds.length > 0
          ? Array.from(new Set(mentionIds)) as string[]
          : undefined;

        const savedMessage = await createGroupMessage(
          user.id,
          groupId,
          content,
          type.toUpperCase() as any,
          replyToId,
          uniqueMentionIds
        )

        io.to(`group:${groupId}`).emit("group:new_message", {
          groupId,
          message: savedMessage
        })

        // Xử lý AI Assistant nếu được mention
        const AI_BOT_ID = "ai-assistant-bot-uuid";
        const hasBotMention = (mentionIds && mentionIds.includes(AI_BOT_ID)) ||
          (content && (content.includes("@AI Assistant") || content.includes("@AI")));

        if (hasBotMention) {
          let seconds = 0;
          let botStatus = "Đang kiểm tra tài liệu...";
          
          // Gửi typing indicator của Bot ngay lập tức
          io.to(`group:${groupId}`).emit("group:typing", {
            groupId,
            userId: AI_BOT_ID,
            userName: `AI Assistant (${botStatus} 0s)`,
            isTyping: true
          });

          // Cập nhật đếm giây mỗi giây một lần
          const typingInterval = setInterval(() => {
            seconds += 1;
            io.to(`group:${groupId}`).emit("group:typing", {
              groupId,
              userId: AI_BOT_ID,
              userName: `AI Assistant (${botStatus} ${seconds}s)`,
              isTyping: true
            });
          }, 1000);

          // Chạy RAG truy vấn tài liệu bất đồng bộ
          (async () => {
            try {
              await ensureAIBotUser();

              let question = content.replace(/@AI Assistant/g, "").replace(/@AI/g, "").trim();
              if (!question) {
                question = "Xin chào! Bạn cần tôi giúp gì về tài liệu của nhóm?";
              }

              // Kiểm tra và chờ các tài liệu đang phân tích trong nhóm (chỉ các định dạng văn bản hỗ trợ RAG)
              const checkPendingDocs = async () => {
                const pendingCount = await prisma.document.count({
                  where: { 
                    groupId, 
                    isDeleted: false, 
                    isEmbedded: false,
                    type: { in: ["PDF", "DOCX", "PPTX", "XLSX"] }
                  }
                });
                return pendingCount > 0;
              };

              let hasPending = await checkPendingDocs();
              let checkCount = 0;
              if (hasPending) {
                botStatus = "Đang phân tích tài liệu...";
                while (hasPending && checkCount < 10) { // Chờ tối đa 20 giây (10 * 2s)
                  await new Promise((resolve) => setTimeout(resolve, 2000));
                  hasPending = await checkPendingDocs();
                  checkCount++;
                }
              }

              botStatus = "Đang suy nghĩ...";

              // Gọi RAG Service truy vấn tài liệu thuộc nhóm
              const result = await queryRAGService(user.id, question, { groupId });

              let botResponseContent = result.answer;
              if (result.sources && result.sources.length > 0) {
                const uniqueSources = Array.from(new Set(result.sources.map(s => s.documentName)));
                botResponseContent += "\n\n📎 Nguồn tài liệu tham khảo:\n" + uniqueSources.map(name => `- ${name}`).join("\n");
              }

              const botMessage = await createGroupMessage(
                AI_BOT_ID,
                groupId,
                botResponseContent,
                "TEXT"
              );

              // Xóa interval đếm giây
              clearInterval(typingInterval);

              // Tắt typing indicator của Bot
              io.to(`group:${groupId}`).emit("group:typing", {
                groupId,
                userId: AI_BOT_ID,
                userName: "AI Assistant",
                isTyping: false
              });

              io.to(`group:${groupId}`).emit("group:new_message", {
                groupId,
                message: botMessage
              });

            } catch (err: any) {
              console.error("[Socket RAG Bot Error]", err);
              // Xóa interval đếm giây
              clearInterval(typingInterval);

              // Tắt typing indicator
              io.to(`group:${groupId}`).emit("group:typing", {
                groupId,
                userId: AI_BOT_ID,
                userName: "AI Assistant",
                isTyping: false
              });

              const botErrorMessage = await createGroupMessage(
                AI_BOT_ID,
                groupId,
                "Xin lỗi, đã xảy ra lỗi trong quá trình xử lý câu hỏi của bạn. Vui lòng thử lại sau.",
                "TEXT"
              );
              io.to(`group:${groupId}`).emit("group:new_message", {
                groupId,
                message: botErrorMessage
              });
            }
          })();
        }
      } catch (error: any) {
        console.error("[Socket group:send_message]", error.message)
        socket.emit("group:error", { message: error.message })
      }
    })

    socket.on("group:typing", ({ groupId, isTyping }: { groupId: string; isTyping: boolean }) => {
      socket.to(`group:${groupId}`).emit("group:typing", {
        groupId,
        userId: user.id,
        userName: user.name || user.email || "Ai đó",
        isTyping
      })
    })

    socket.on("group:recall_message", async ({ groupId, messageId }: { groupId: string; messageId: string }) => {
      try {
        const msg = await findMessageById(messageId)
        if (!msg) {
          socket.emit("group:error", { message: "Không tìm thấy tin nhắn" })
          return
        }
        if (msg.groupId !== groupId) {
          socket.emit("group:error", { message: "Tin nhắn không thuộc nhóm này" })
          return
        }
        if (msg.senderId !== user.id) {
          socket.emit("group:error", { message: "Bạn không có quyền thu hồi tin nhắn này" })
          return
        }

        const recalled = await prisma.message.update({
          where: { id: messageId },
          data: {
            content: "🚫 Tin nhắn đã được thu hồi",
            type: "TEXT"
          },
          include: {
            sender: { select: { id: true, name: true, avatarUrl: true, email: true } }
          }
        })
        io.to(`group:${groupId}`).emit("group:message_recalled", {
          groupId,
          messageId,
          message: recalled
        })
      } catch (error: any) {
        console.error("[Socket group:recall_message]", error.message)
        socket.emit("group:error", { message: error.message })
      }
    })

    // ——— Ngắt kết nối ———
    socket.on("disconnect", () => {
      onlineUsers.delete(user.id)
      socket.broadcast.emit("user:online_status", { userId: user.id, isOnline: false })

      // Sửa lỗi treo màn hình khi mất kết nối đột ngột
      if (activeCalls.has(user.id)) {
        const peerUserId = activeCalls.get(user.id)
        if (peerUserId) {
          io.to(peerUserId).emit("call:ended", { byUserId: user.id })
          activeCalls.delete(peerUserId)
        }
        activeCalls.delete(user.id)
      }
    })
  })
}
