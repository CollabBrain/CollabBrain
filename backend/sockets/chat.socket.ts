import {Server, Socket} from "socket.io"
import { sendMessageService } from "../services/client/chat.service"
export const chatSocket = (io: Server)=>{
  const onlineUsers = new Map<string, string>()
  io.on("connection",(socket: Socket)=>{
    const user = socket.data.user
    
    socket.join(user.id)

    onlineUsers.set(user.id,socket.id)
    socket.emit("online_users",Array.from(onlineUsers.keys()))
    socket.broadcast.emit("user_online",{userId: user.id})


    socket.on("send_message", async(data)=>{
      try {
        const {receiverId, content, type="TEXT"} = data
  
        const savedMessage = await sendMessageService(user.id,receiverId,content,type)
  
        io.to(receiverId).emit("new_message",savedMessage)
      } catch (error:any) {
        socket.emit("message_error",error.message)
      }
    
    
    })

    socket.on("typing_start",({toUserId}:{toUserId:string})=>{
      io.to(toUserId).emit("user_typing",{fromUserId: user.id})
    })

    socket.on("typing_stop",({toUserId}:{toUserId: string})=>{
      io.to(toUserId).emit("user_stop_typing",{fromUserId: user.id})
    })

    socket.on("mark_read",({fromUserId}:{fromUserId: string})=>{
      io.to(fromUserId).emit("messages_read",{byUserId: user.id})
    })

    socket.on("disconnect",()=>{
      onlineUsers.delete(user.id)
      socket.broadcast.emit("user_offline",{userId: user.id})
    })
  })

}