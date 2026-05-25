import { MessageType } from "@prisma/client";
import { findFriendship } from "../../repositories/client/friend.repo";
import { createMessage, findMessageById, getMessageBetweenUsers, markMessageAsRead, softDelete } from "../../repositories/client/chat.repo";
import { uploadToSupabase } from "../../helpers/upload";


export const sendMessageService = async(senderId: string, receiverId: string, content: string, type: MessageType="TEXT")=>{
  const existing = await findFriendship(senderId,receiverId)
  const reverse = await findFriendship(receiverId, senderId)
  const friendShip = existing || reverse
  if(!friendShip || friendShip?.status !== "ACCEPTED") {
    throw new Error("Không thể gửi tin nhắn. Hai người chưa là bạn bè")
  }
  const newMessage = await createMessage(senderId, receiverId,content,type)

  return {
    message: "Gửi tin nhắn thành công",
    data: newMessage
  }


}
export const getChatHistoryService = async(myId: string, targetId: string)=>{
  const existing = await findFriendship(myId,targetId)
  const reverse = await findFriendship(targetId, myId)
  const friendShip = existing || reverse
  if(!friendShip || friendShip?.status !== "ACCEPTED") {
    throw new Error("Không thể xem tin nhắn. Hai người chưa là bạn bè")
  }
  const messages = await getMessageBetweenUsers(myId,targetId)
  return {
    data: messages,
    message: "Lấy lịch sử chat thành công"
  }
}

export const markReadService = async(myId:string, targetId: string) => {
  const result = await markMessageAsRead(targetId,myId);
  return {
    data: result,
    message: "Đã đánh dấu tin nhắn là đã đọc"
  }
  
}

export const deleteMessageService = async(myId: string, messageId: string)=>{
  const message = await findMessageById(messageId)
  if(!message) throw new Error("Không tồn tại tin nhắn")
  if(message.senderId === myId)
    await softDelete(messageId,"deletedBySender")
  else if(message.receiverId === myId)
    await softDelete(messageId,"deletedByReceiver")
  else
    throw new Error("Bạn không có quyền xóa tin nhắn này")
  return{
    message: "Xóa tin nhắn thành công"
  }
}


export const uploadToSupabasePostService = async(file: Express.Multer.File, path: string,bucket?:string)=>{
  if(!file) throw new Error("Không có file")
  const result = await uploadToSupabase(file,path,bucket)
  return {
    data: result,
    message: "Upload thành công"
  }
}