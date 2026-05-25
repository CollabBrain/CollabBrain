import { Request, Response } from "express";
import { deleteMessageService, getChatHistoryService, markReadService, uploadToSupabasePostService } from "../../services/client/chat.service";
//[GET] /chat/history/:userId
export const getHistory = async (req: Request, res: Response) => {
    try {
      const myId = (req as any).user.id;
      const targetId = req.params.userId as string 
      const result = await getChatHistoryService(myId, targetId);
      return res.status(200).json({
        code: 200,
        message: result.message,
        data: result.data
      })
        
    } catch (error: any) {
        res.status(400).json({
          code: 400,
          message: `Lỗi: ${error.message}`
        })
    }

}


//[PATCH] /chat/read/:userId
export const markedReadPatch = async (req: Request, res: Response)=>{
  try {
    const myId = (req as any).user.id;
    const targetId = req.params.userId as string;
    const result = await markReadService(myId,targetId)
    return res.status(200).json({
      code: 200,
      message: result.message,
      data: result.data
    })
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    })
  }
}

//[PATCH] /chat/delete/:messageId
export const deleteMessagePatch = async (req: Request, res: Response)=>{
  try {
    const myId = (req as any).user.id;
    const messageId = req.params.messageId as string;
    const result = await deleteMessageService(myId,messageId)
    return res.status(200).json({
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

//[POST] /chat/upload
export const uploadFilePost = async(req: Request, res: Response)=>{
  try {
    const myId = (req as any).user.id
    const pathUpload = `chat/${myId}`
    const result = await uploadToSupabasePostService(req.file!,pathUpload)
    res.status(200).json({
      code: 200,
      data: result.data,
      message: result.message
    }
    )
  } catch (error) {
    res.status(400).json({
      code: 400,
      message:"Upload thất bại"
    })
  }
}
