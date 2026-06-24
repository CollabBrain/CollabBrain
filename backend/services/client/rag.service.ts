import prisma from "../../config/prisma"
import { chunkText } from "../../helpers/rag/chunker"
import { getEmbeding } from "../../helpers/rag/embeder"
import { extractTextFromUrl } from "../../helpers/rag/extractors"
import { callLLM } from "../../helpers/rag/llm"
import { findDocumentById } from "../../repositories/client/document.repo"
import { searchSimilarChunks, updateChunkEmbedding, savedChunks } from "../../repositories/client/documentChunk.repo"
import * as crypto from "crypto"

export const ingestDocumentService = async (documentId: string) => {
  const doc = await findDocumentById(documentId);
  if (!doc) {
    throw new Error("Không tìm thấy tài liệu")
  }
  const text = await extractTextFromUrl(doc.url, doc.name);
  if (!text) {
    console.log(`[RAG Ingestion] Cảnh báo: Tài liệu rỗng hoặc không có text để đọc: ${doc.id}`);
    return
  }
  const rawChunks = chunkText(text);
  const chunkData = rawChunks.map((chunk) => {
    const hash = crypto
      .createHash("sha256")
      .update(`${doc.id}_${chunk.chunkIndex}_${chunk.content}`)
      .digest("hex");
    return {
      documentId: doc.id,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      contentHash: hash
    };
  });
  await savedChunks(doc.id, chunkData);
  
  const chunksToEmbed = await prisma.documentChunk.findMany({
    where: { documentId: doc.id, isEmbedded: false }
  });
  for (const chunk of chunksToEmbed) {
    try {
      const vector = await getEmbeding(chunk.content, false);
      await updateChunkEmbedding(chunk.id, vector);
    } catch (err: any) {
      console.error(`[RAG Ingestion] Lỗi tạo nhúng cho chunk ID ${chunk.id}:`, err.message);
    }
  }
  console.log(`[RAG Ingestion] Hoàn thành phân tích và tạo chỉ mục RAG cho file ${doc.name} thành công.`);
}
export const queryRAGService = async (userId: string, question: string, options: { groupId?: string }) => {
  const queryVector = await getEmbeding(question, true)
  const matchChunks = await searchSimilarChunks(queryVector, {
    limit: 5,
    userId,
    groupId: options.groupId
  })
  if (matchChunks.length === 0) {
    return {
      answer: "Không tìm thấy nội dung liên quan trong cơ sở dữ liệu tài liệu mà bạn có quyền truy cập.",
      sources: [],
    };
  }
  const context = matchChunks.map((c, i) => `[Tài liệu ${i + 1}: ${c.documentName}\nNội dung:\n${c.content}]`)
    .join("\n\n---\n\n")
  const prompt = `
    Dưới đây là một số thông tin tham khảo cho câu hỏi. Bạn tham sử dụng chúng để trả lời câu hỏi
    Ngữ cảnh: ${context}
    Câu hỏi: ${question}
    Trả lời: 
  `
  const answer = await callLLM(prompt)
  const sources = matchChunks.map((c) => ({
    documentName: c.documentName,
    documentUrl: c.documentUrl,
    chunkIndex: c.chunkIndex,
  }));
  return {
    answer,
    sources,
  };
}