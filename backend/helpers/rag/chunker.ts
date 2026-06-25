import { TextChunk } from "../../types/client/documentChunk.types";

export const chunkText = (text: string, chunkSize = 1000, overlap = 150) => {
  const chunks: TextChunk[] = [];
  const cleanTextStr = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();

  // Tách câu sử dụng lookbehind để giữ lại dấu câu chấm/hỏi/cảm
  const sentences = cleanTextStr.split(/(?<=[.!?])\s+|\n+/);
  
  let currentChunk: string[] = [];
  let currentLength = 0;
  let chunkIndex = 0;

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    // Xử lý câu đơn lẻ quá dài (lớn hơn chunkSize)
    if (trimmedSentence.length >= chunkSize) {
      if (currentChunk.length > 0) {
        chunks.push({
          chunkIndex,
          content: currentChunk.join(" ")
        });
        chunkIndex++;
        currentChunk = [];
        currentLength = 0;
      }
      
      let start = 0;
      while (start < trimmedSentence.length) {
        const end = Math.min(start + chunkSize, trimmedSentence.length);
        chunks.push({
          chunkIndex,
          content: trimmedSentence.slice(start, end).trim()
        });
        chunkIndex++;
        start += (chunkSize - overlap);
      }
      continue;
    }

    // Đóng chunk hiện tại khi độ dài vượt ngưỡng
    if (currentLength + trimmedSentence.length > chunkSize) {
      chunks.push({
        chunkIndex,
        content: currentChunk.join(" ")
      });
      chunkIndex++;

      // Tạo phần overlap dựa trên câu
      const overlapChunk: string[] = [];
      let overlapLen = 0;
      for (let i = currentChunk.length - 1; i >= 0; i--) {
        const s = currentChunk[i];
        if (overlapLen + s.length > overlap) break;
        overlapChunk.unshift(s);
        overlapLen += s.length;
      }

      currentChunk = [...overlapChunk, trimmedSentence];
      currentLength = currentChunk.join(" ").length;
    } else {
      currentChunk.push(trimmedSentence);
      currentLength = currentChunk.join(" ").length;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push({
      chunkIndex,
      content: currentChunk.join(" ")
    });
  }

  return chunks;
};
