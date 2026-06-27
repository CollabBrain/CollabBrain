import prisma from "../../config/prisma"
import { chunkText } from "../../helpers/rag/chunker"
import { getEmbeding, getBatchEmbeddings, callReranker } from "../../helpers/rag/embeder"
import { extractTextFromUrl } from "../../helpers/rag/extractors"
import { callLLM } from "../../helpers/rag/llm"
import { findDocumentById } from "../../repositories/client/document.repo"
import { searchSimilarChunks, updateChunkEmbedding, savedChunks } from "../../repositories/client/documentChunk.repo"
import * as crypto from "crypto"

export const ingestDocumentService = async (documentId: string) => {
  try {
    const doc = await findDocumentById(documentId);
    if (!doc) {
      throw new Error("Không tìm thấy tài liệu")
    }
    const text = await extractTextFromUrl(doc.url, doc.name);
    if (!text) {
      console.log(`[RAG Ingestion] Cảnh báo: Tài liệu rỗng hoặc không có text để đọc: ${doc.id}`);
      await prisma.document.update({
        where: { id: doc.id },
        data: { isEmbedded: true }
      });
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

    if (chunksToEmbed.length > 0) {
      const contents = chunksToEmbed.map(c => c.content);
      const vectors = await getBatchEmbeddings(contents, false);

      await Promise.all(
        chunksToEmbed.map((chunk, index) =>
          updateChunkEmbedding(chunk.id, vectors[index])
        )
      );
    }

    await prisma.document.update({
      where: { id: doc.id },
      data: { isEmbedded: true }
    });
    console.log(`\n[RAG Ingestion SUCCESS] Đã tạo embedding và cập nhật database thành công cho file: "${doc.name}" (ID: ${doc.id}) với ${chunksToEmbed.length} chunks.\n`);
  } catch (err: any) {
    console.error(`[RAG Ingestion] Lỗi xử lý tài liệu ${documentId}:`, err.message);
    throw err;
  }
}
export const queryRAGService = async (userId: string, question: string, options: { groupId?: string, conversationId?: string }) => {
  const queryVector = await getEmbeding(question, true)
  const matchChunks = await searchSimilarChunks(queryVector, {
    limit: 5, // Giảm xuống 5 để tối ưu hóa hiệu năng CPU chạy Reranker cục bộ
    userId,
    groupId: options.groupId,
    conversationId: options.conversationId,
    textQuery: question
  })

  if (matchChunks.length === 0) {
    return {
      answer: "Không tìm thấy nội dung liên quan trong cơ sở dữ liệu tài liệu mà bạn có quyền truy cập.",
      sources: [],
    };
  }

  // 2. Chạy Reranker để xếp hạng lại
  let finalChunks = matchChunks;
  try {
    const scores = await callReranker(question, matchChunks.map(c => c.content));
    const chunksWithScores = matchChunks.map((chunk, index) => ({
      ...chunk,
      rerankScore: scores[index] ?? -99
    }));
    // Sắp xếp theo điểm rerank giảm dần và lấy 5 đoạn tốt nhất
    chunksWithScores.sort((a, b) => b.rerankScore - a.rerankScore);
    finalChunks = chunksWithScores.slice(0, 5);
  } catch (err) {
    console.error("Lỗi Reranker, tự động fallback lấy 5 kết quả đầu của Hybrid Search:", err);
    finalChunks = matchChunks.slice(0, 5);
  }

  const context = finalChunks.map((c, i) => `[Tài liệu ${i + 1}: ${c.documentName}\nNội dung:\n${c.content}]`)
    .join("\n\n---\n\n")
  const prompt = `
    Dưới đây là một số thông tin tham khảo cho câu hỏi. Bạn tham sử dụng chúng để trả lời câu hỏi
    Ngữ cảnh: ${context}
    Câu hỏi: ${question}
    Trả lời: 
  `
  const answer = await callLLM(prompt)
  const sources = finalChunks.map((c) => ({
    documentName: c.documentName,
    documentUrl: c.documentUrl,
    chunkIndex: c.chunkIndex,
  }));
  return {
    answer,
    sources,
  };
}