import { Server, Socket } from "socket.io"
import { createMessage, createGroupMessage, findGroupMessageById, recallGroupMessage } from "../repositories/client/chat.repo"
import prisma from "../config/prisma"

export const chatSocket = (io: Server) => {
  const onlineUsers = new Map<string, string>()

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

    // Gửi danh sách online hiện tại CHỈ cho user vừa connect (không broadcast)
    socket.emit("user:initial_online", { onlineUserIds: Array.from(onlineUsers.keys()) })

    // Thông báo user online cho tất cả (ngoại trừ bản thân)
    socket.broadcast.emit("user:online_status", { userId: user.id, isOnline: true })

    // ================================================================
    // ——— CHAT 1-1 ———
    // ================================================================

    socket.on("chat:send_message", async (data) => {
      try {
        const { conversationId, content, type = "text", replyToId } = data
        // Trong chat 1-1, conversationId chính là id của người nhận (receiverId)
        const savedMessage = await createMessage(user.id, conversationId, content, type.toUpperCase() as any, replyToId)

        // Broadcast cho người nhận
        io.to(conversationId).emit("chat:new_message", { 
          message: { 
            ...savedMessage, 
            conversationId: user.id, // Đối với người nhận, conversation là với người gửi
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
      // Chỉ broadcast cho người nhận (receiverId)
      socket.to(conversationId).emit("chat:typing", {
        conversationId: user.id, // THE FRONTEND USES conversationId TO KNOW WHICH CHAT IS TYPING
        userId: user.id,
        isTyping
      })
    })

    // ================================================================
    // ——— WEBRTC SIGNALING (CHAT 1-1) ———
    // ================================================================

    /**
     * BƯỚC 1: Caller yêu cầu gọi tới Callee
     * Payload: { targetUserId, callType: 'audio' | 'video', callerInfo: { name, avatarUrl } }
     */
    socket.on("call:request", ({ targetUserId, callType, callerInfo }: {
      targetUserId: string,
      callType: 'audio' | 'video',
      callerInfo: { name: string, avatarUrl?: string }
    }) => {
      // Kiểm tra người nhận có online không
      if (!onlineUsers.has(targetUserId)) {
        socket.emit("call:error", { code: "USER_OFFLINE", message: "Người dùng không online" })
        return
      }

      console.log(`[Call] ${user.id} → ${targetUserId} [${callType}]`)

      // Forward tín hiệu gọi đến Callee
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
     * BƯỚC 2A: Callee đồng ý cuộc gọi → báo lại cho Caller
     * Payload: { callerId }
     */
    socket.on("call:accept", ({ callerId }: { callerId: string }) => {
      console.log(`[Call] ${user.id} accepted call from ${callerId}`)
      io.to(callerId).emit("call:accepted", { calleeId: user.id })
    })

    /**
     * BƯỚC 2B: Callee từ chối cuộc gọi → báo lại Caller
     * Payload: { callerId, reason?: string }
     */
    socket.on("call:reject", ({ callerId, reason }: { callerId: string, reason?: string }) => {
      console.log(`[Call] ${user.id} rejected call from ${callerId}`)
      io.to(callerId).emit("call:rejected", {
        calleeId: user.id,
        reason: reason || "declined"
      })
    })

    /**
     * BƯỚC 3: Caller gửi WebRTC Offer SDP cho Callee
     * Payload: { targetUserId, offer: RTCSessionDescriptionInit }
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
     * BƯỚC 4: Callee gửi WebRTC Answer SDP cho Caller
     * Payload: { targetUserId, answer: RTCSessionDescriptionInit }
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
     * BƯỚC 5 (song song): Gửi ICE Candidate (trao đổi liên tục giữa 2 bên)
     * Payload: { targetUserId, candidate: RTCIceCandidateInit }
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
     * Kết thúc / huỷ cuộc gọi — gửi tới cả 2 phía
     * Payload: { targetUserId }
     */
    socket.on("call:end", ({ targetUserId }: { targetUserId: string }) => {
      console.log(`[Call] ${user.id} ended call with ${targetUserId}`)
      io.to(targetUserId).emit("call:ended", { byUserId: user.id })
    })

    /**
     * Ghi nhận lịch sử cuộc gọi vào cửa sổ chat
     * Payload: { targetUserId, callType: 'audio'|'video', status: 'missed'|'rejected'|'ended', duration?: string }
     */
    socket.on("call:log", async ({ targetUserId, callType, status, duration }: { targetUserId: string, callType: string, status: string, duration?: string }) => {
      try {
        const content = `[CALL:${callType}:${status}${duration ? `:${duration}` : ''}]`
        const savedMessage = await createMessage(user.id, targetUserId, content, "TEXT")

        // Broadcast cho người nhận
        io.to(targetUserId).emit("chat:new_message", { 
          message: { 
            ...savedMessage, 
            conversationId: user.id, 
            type: "text" 
          } 
        })
        
        // Gửi lại cho người gửi
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

        const savedMessage = await createGroupMessage(
          user.id,
          groupId,
          content,
          type.toUpperCase() as any,
          replyToId,
          mentionIds
        )

        // Broadcast cho tất cả member trong group room (kể cả sender)
        io.to(`group:${groupId}`).emit("group:new_message", {
          groupId,
          message: savedMessage
        })
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