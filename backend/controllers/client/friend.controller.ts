import { Request, Response } from "express"
import { acceptFriendPostService, blockFriendPatchService, getListFriendService, rejectFriendPostService, requestFriendPostService } from "../../services/client/friend.service"

export const friendList = async (req: Request, res: Response) => {
  try {
    const id = (req as any).user.id
    const result = await getListFriendService(id)
    res.status(200).json({
      data: result.data,
      code: 200,
      message: result.message
    })
  } catch (error) {
    res.status(400).json({
      code: 400,
      message: "Có lỗi xảy ra vui lòng thử lại"
    })
  }
}

export const acceptFriendPost = async (req: Request, res: Response) => {
  try {

    const myId = (req as any).user.id
    const senderId: string = req.params.userId as string
    const result = await acceptFriendPostService(senderId, myId, "ACCEPTED")
    const io = req.app.get("io")
    // Người gửi là: myId, người nhận là: senderId
    io.to(senderId).emit("accept_friend_request", {
      message: "Lời mời kết bạn của bạn đã được chấp nhận",
      senderId: myId
    })
    res.status(200).json({
      data: result.data,
      code: 200,
      message: result.message
    })
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    })
  }
}
//[DELETE] /friend/reject/:userId
export const rejectFriendPost = async (req: Request, res: Response) => {
  try {
    const myId = (req as any).user.id
    const senderId: string = req.params.userId as string
    await rejectFriendPostService(senderId, myId)
    res.status(200).json({
      code: 200,
      message: "Xóa thành công"
    })
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    })
  }
}
//[DELETE] /friend/request/:userId
export const requestFriendPost = async (req: Request, res: Response) => {
  try {
    const myId = (req as any).user.id
    const receiverId: string = req.params.userId as string
    const result = await requestFriendPostService(myId, receiverId)
    // người gửi là myId, người nhận là receiverId
    const io = req.app.get("io")
    io.to(receiverId).emit("new_request_friend", {
      message:"Bạn có một lời mời kết bạn mới",
      senderId: myId
    })
    res.status(200).json({
      code: 200,
      message: "Gửi lời mời thành công",
      data: result.data
    })
  } catch (error: any) {

    res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    })
  }

}

//[PATCH] /friend/block/:userId
export const blockFriendPatch = async (req: Request, res: Response) => {
  try {
    const myId = (req as any).user.id
    const targetId: string = req.params.userId as string
    const result = await blockFriendPatchService(myId, targetId)
    res.status(200).json({
      code: 200,
      message: "Chặn thành công",
      data: result.data
    })
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    })
  }
}