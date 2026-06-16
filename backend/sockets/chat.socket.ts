import {Server, Socket} from "socket.io"
import { createMessage } from "../repositories/client/chat.repo"

export const chatSocket = (io: Server) => {
  const onlineUsers = new Map<string, string>()

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user

    socket.join(user.id)
    onlineUsers.set(user.id, socket.id)

    // Thông báo user online cho tất cả
    socket.broadcast.emit("user:online_status", { userId: user.id, isOnline: true })

    // ——— Gửi tin nhắn ———
    socket.on("chat:send_message", async (data) => {
      try {
        const { conversationId, content, type = "text" } = data
        // conversationId = receiverId trong hệ thống này
        const savedMessage = await createMessage(user.id, conversationId, content, type.toUpperCase() as any)

        const formattedMessage = {
          ...savedMessage,
          conversationId,
          type: savedMessage.type.toLowerCase()
        }

        // Gửi cho người nhận
        io.to(conversationId).emit("chat:new_message", { message: formattedMessage })
        // Gửi lại cho người gửi để xác nhận
        socket.emit("chat:new_message", { message: formattedMessage })
      } catch (error: any) {
        socket.emit("chat:error", { message: error.message })
      }
    })

    // ——— Đang nhập ———
    socket.on("chat:typing", ({ conversationId, isTyping }: { conversationId: string; isTyping: boolean }) => {
      io.to(conversationId).emit("chat:typing", {
        conversationId,
        userId: user.id,
        isTyping
      })
    })

    // ——— Ngắt kết nối ———
    socket.on("disconnect", () => {
      onlineUsers.delete(user.id)
      socket.broadcast.emit("user:online_status", { userId: user.id, isOnline: false })
    })
  })
}