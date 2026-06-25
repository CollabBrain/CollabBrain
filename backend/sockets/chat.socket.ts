import { Server, Socket } from "socket.io"
import { createMessage, createGroupMessage, findGroupMessageById, recallGroupMessage } from "../repositories/client/chat.repo"
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
        passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz0123456789", // dummy hash
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

  // Đảm bảo AI Bot user tồn tại trong DB
  ensureAIBotUser();

  io.on("connection", async (socket: Socket) => {
    const user = socket.data.user

    socket.join(user.id)
    onlineUsers.set(user.id, socket.id)

    // ——— Tự động join tất cả group rooms của user ———
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

    // Thông báo user online cho tất cả
    socket.broadcast.emit("user:online_status", { userId: user.id, isOnline: true })

    // ================================================================
    // ——— CHAT 1-1 ———
    // ================================================================

    socket.on("chat:send_message", async (data) => {
      try {
        const { conversationId, content, type = "text", replyToId } = data
        const savedMessage = await createMessage(user.id, conversationId, content, type.toUpperCase() as any, replyToId)

        const formattedMessage = {
          ...savedMessage,
          conversationId,
          type: savedMessage.type.toLowerCase()
        }

        io.to(conversationId).emit("chat:new_message", { message: formattedMessage })
        socket.emit("chat:new_message", { message: formattedMessage })
      } catch (error: any) {
        socket.emit("chat:error", { message: error.message })
      }
    })

    socket.on("chat:typing", ({ conversationId, isTyping }: { conversationId: string; isTyping: boolean }) => {
      io.to(conversationId).emit("chat:typing", {
        conversationId,
        userId: user.id,
        isTyping
      })
    })

    // ================================================================
    // ——— GROUP CHAT ———
    // ================================================================

    // --- group:send_message ---
    socket.on("group:send_message", async (data) => {
      try {
        const { groupId, content, type = "text", replyToId, mentionIds } = data
        if (!groupId || !content) return

        // Kiểm tra quyền thành viên
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

        // Kiểm tra replyToId hợp lệ (nếu có)
        if (replyToId) {
          const replyMsg = await prisma.message.findFirst({ where: { id: replyToId, groupId } })
          if (!replyMsg) {
            socket.emit("group:error", { message: "Tin nhắn reply không tồn tại" })
            return
          }
        }

        // Loại bỏ ID trùng lặp trong mentionIds nhằm tránh lỗi Unique Constraint của cơ sở dữ liệu
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

        // Broadcast cho tất cả member trong group room (kể cả sender)
        io.to(`group:${groupId}`).emit("group:new_message", {
          groupId,
          message: savedMessage
        })

        // --- Xử lý câu trả lời từ AI Assistant (nếu được mention) ---
        const AI_BOT_ID = "ai-assistant-bot-uuid";
        const hasBotMention = (mentionIds && mentionIds.includes(AI_BOT_ID)) ||
          (content && (content.includes("@AI Assistant") || content.includes("@AI")));

        if (hasBotMention) {
          // Gửi typing indicator của Bot ngay lập tức
          io.to(`group:${groupId}`).emit("group:typing", {
            groupId,
            userId: AI_BOT_ID,
            userName: "AI Assistant",
            isTyping: true
          });

          // Chạy RAG truy vấn tài liệu bất đồng bộ
          (async () => {
            try {
              // Đảm bảo AI Bot User tồn tại trong DB
              await ensureAIBotUser();

              // Làm sạch câu hỏi (loại bỏ phần mention)
              let question = content.replace(/@AI Assistant/g, "").replace(/@AI/g, "").trim();
              if (!question) {
                question = "Xin chào! Bạn cần tôi giúp gì về tài liệu của nhóm?";
              }

              // Gọi RAG Service truy vấn tài liệu thuộc nhóm
              const result = await queryRAGService(user.id, question, { groupId });

              // Định dạng nội dung tin nhắn bot trả về
              let botResponseContent = result.answer;
              if (result.sources && result.sources.length > 0) {
                const uniqueSources = Array.from(new Set(result.sources.map(s => s.documentName)));
                botResponseContent += "\n\n📎 Nguồn tài liệu tham khảo:\n" + uniqueSources.map(name => `- ${name}`).join("\n");
              }

              // Lưu tin nhắn của Bot vào database
              const botMessage = await createGroupMessage(
                AI_BOT_ID,
                groupId,
                botResponseContent,
                "TEXT"
              );

              // Tắt typing indicator của Bot
              io.to(`group:${groupId}`).emit("group:typing", {
                groupId,
                userId: AI_BOT_ID,
                userName: "AI Assistant",
                isTyping: false
              });

              // Broadcast tin nhắn trả lời của Bot
              io.to(`group:${groupId}`).emit("group:new_message", {
                groupId,
                message: botMessage
              });

            } catch (err: any) {
              console.error("[Socket RAG Bot Error]", err);
              // Tắt typing indicator
              io.to(`group:${groupId}`).emit("group:typing", {
                groupId,
                userId: AI_BOT_ID,
                userName: "AI Assistant",
                isTyping: false
              });

              // Gửi tin nhắn báo lỗi từ Bot
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

    // --- group:typing ---
    socket.on("group:typing", ({ groupId, isTyping }: { groupId: string; isTyping: boolean }) => {
      // Broadcast tới các thành viên khác trong room (không gửi lại cho chính sender)
      socket.to(`group:${groupId}`).emit("group:typing", {
        groupId,
        userId: user.id,
        userName: user.name || user.email || "Ai đó",
        isTyping
      })
    })

    // --- group:recall_message ---
    socket.on("group:recall_message", async ({ groupId, messageId }: { groupId: string; messageId: string }) => {
      try {
        const msg = await findGroupMessageById(messageId)
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
        if (msg.isRecalled) {
          socket.emit("group:error", { message: "Tin nhắn đã được thu hồi trước đó" })
          return
        }

        const recalled = await recallGroupMessage(messageId)
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

    // ================================================================
    // ——— Ngắt kết nối ———
    // ================================================================
    socket.on("disconnect", () => {
      onlineUsers.delete(user.id)
      socket.broadcast.emit("user:online_status", { userId: user.id, isOnline: false })
    })
  })
}