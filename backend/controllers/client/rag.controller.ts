import { Request, Response } from "express"
import { queryRAGService } from "../../services/client/rag.service";
//[POST] /rag/query
export const queryRag = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { question, groupId, conversationId } = req.body;
    if (!question || typeof question !== "string") {
      return res.status(400).json({
        code: 400,
        message: "Định dạng câu hỏi không đúng"
      });
    }
    const ans = await queryRAGService(userId, question, { groupId, conversationId });
    return res.status(200).json({
      code: 200,
      message: "Truy vấn RAG thành công",
      data: ans
    });
  } catch (error: any) {
    console.error("Lỗi truy vấn RAG:", error);
    return res.status(500).json({
      code: 500,
      message: `Lỗi hệ thống RAG: ${error.message}`
    });
  }
};