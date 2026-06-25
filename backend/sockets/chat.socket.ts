import { Server, Socket } from "socket.io"
import { createMessage, findMessageById } from "../repositories/client/chat.repo"
import prisma from "../config/prisma"

export const chatSocket = (io: Server) => {
  const onlineUsers = new Map<string, string>()

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

    socket.broadcast.emit("user:online_status", { userId: user.id, isOnline: true })

    // ——— CHAT 1-1 ———
    socket.on("chat:send_message", async (data) => {
      try {
        const { conversationId, content, type = "text" } = data
        const savedMessage = await createMessage(user.id, conversationId, content, type.toUpperCase() as any)

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

    // ——— GROUP CHAT (basic) ———
    socket.on("group:send_message", async (data) => {
      try {
        const { groupId, content, type = "text" } = data
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

        const savedMessage = await prisma.message.create({
          data: {
            senderId: user.id,
            groupId,
            content,
            type: type.toUpperCase() as any
          },
          include: {
            sender: { select: { id: true, name: true, avatarUrl: true, email: true } }
          }
        })

        io.to(`group:${groupId}`).emit("group:new_message", {
          groupId,
          message: savedMessage
        })
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
    })
  })
}
