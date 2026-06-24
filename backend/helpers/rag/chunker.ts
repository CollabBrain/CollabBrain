import { TextChunk } from "../../types/client/documentChunk.types";

export const chunkText = (text: string, chunkSize = 1000, overlap = 150) => {
  const chunks: TextChunk[] = []
  const cleanTextStr = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();

  let start = 0;
  let chunkIndex = 0;
  while (start < cleanTextStr.length) {
    const end = Math.min(start + chunkSize, cleanTextStr.length);
    const content = cleanTextStr.slice(start, end).trim();
    if (content.length > 0) {
      chunks.push({
        chunkIndex,
        content: content
      });
      chunkIndex++;
    }
    start += (chunkSize - overlap);
  }
  return chunks;
}
