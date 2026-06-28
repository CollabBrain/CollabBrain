import prisma from "../../config/prisma"

export interface CreateChunkData {
  documentId: string,
  chunkIndex: number,
  content: string,
  contentHash?: string
}
export const savedChunks = async (documentId: string, chunks: CreateChunkData[]) => {
  await prisma.documentChunk.deleteMany({
    where: {
      documentId
    }
  })
  return prisma.documentChunk.createMany({
    data: chunks
  })
}


export const getPendingChunks = async()=>{
  return prisma.documentChunk.findMany({
    where: {
      isEmbedded: false,
    },
  });
}

export const updateChunkEmbedding = async(chunkId: string, embedding: number[])=>{
  const vectorStr = `[${embedding.join(",")}]`;
  await prisma.$executeRawUnsafe(
    `
    UPDATE document_chunks SET embedding = $1::vector, "isEmbedded" = true WHERE id = $2
    `,
    vectorStr,
    chunkId
  )
}
export const searchSimilarChunks = async (
  vector: number[],
  options: {
    limit: number;
    userId: string;
    groupId?: string;
    conversationId?: string;
    textQuery?: string;
  }
) => {
  const { limit, userId, groupId, conversationId, textQuery } = options;
  const vectorStr = `[${vector.join(",")}]`;

  // 1. Chạy Vector Search (Dense retrieval) - Lấy nhiều hơn (20) để RRF xếp hạng
  let vectorQuery = "";
  let vectorParams: any[] = [];

  if (groupId) {
    vectorQuery = `
      SELECT dc.id, dc.content, dc.chunk_index as "chunkIndex", d.name as "documentName", d.url as "documentUrl"
      FROM document_chunks dc
      JOIN documents d ON dc.document_id = d.id
      WHERE dc.embedding IS NOT NULL 
        AND d.group_id = $1 
        AND d.is_deleted = false
      ORDER BY dc.embedding <-> $2::vector
      LIMIT $3
    `;
    vectorParams = [groupId, vectorStr, 20];
  } else if (conversationId) {
    vectorQuery = `
      SELECT dc.id, dc.content, dc.chunk_index as "chunkIndex", d.name as "documentName", d.url as "documentUrl"
      FROM document_chunks dc
      JOIN documents d ON dc.document_id = d.id
      WHERE dc.embedding IS NOT NULL 
        AND d.uploaded_by = $1 
        AND (d.conversation_id = $2 OR (d.conversation_id IS NULL AND d.group_id IS NULL))
        AND d.is_deleted = false
      ORDER BY dc.embedding <-> $3::vector
      LIMIT $4
    `;
    vectorParams = [userId, conversationId, vectorStr, 20];
  } else {
    vectorQuery = `
      SELECT dc.id, dc.content, dc.chunk_index as "chunkIndex", d.name as "documentName", d.url as "documentUrl"
      FROM document_chunks dc
      JOIN documents d ON dc.document_id = d.id
      WHERE dc.embedding IS NOT NULL 
        AND d.uploaded_by = $1 
        AND d.group_id IS NULL
        AND d.conversation_id IS NULL
        AND d.is_deleted = false
      ORDER BY dc.embedding <-> $2::vector
      LIMIT $3
    `;
    vectorParams = [userId, vectorStr, 20];
  }

  const vectorResults = await prisma.$queryRawUnsafe<any[]>(vectorQuery, ...vectorParams);

  if (!textQuery) {
    return vectorResults.slice(0, limit);
  }

  // 2. Chạy Keyword Search (FTS + ILIKE) - Lấy tối đa 20 kết quả
  let keywordQuery = "";
  let keywordParams: any[] = [];

  if (groupId) {
    keywordQuery = `
      SELECT dc.id, dc.content, dc.chunk_index as "chunkIndex", d.name as "documentName", d.url as "documentUrl"
      FROM document_chunks dc
      JOIN documents d ON dc.document_id = d.id
      WHERE dc.embedding IS NOT NULL 
        AND d.group_id = $1 
        AND d.is_deleted = false
        AND (
          to_tsvector('simple', dc.content) @@ plainto_tsquery('simple', $2)
          OR dc.content ILIKE $3
        )
      LIMIT $4
    `;
    keywordParams = [groupId, textQuery, `%${textQuery}%`, 20];
  } else if (conversationId) {
    keywordQuery = `
      SELECT dc.id, dc.content, dc.chunk_index as "chunkIndex", d.name as "documentName", d.url as "documentUrl"
      FROM document_chunks dc
      JOIN documents d ON dc.document_id = d.id
      WHERE dc.embedding IS NOT NULL 
        AND d.uploaded_by = $1 
        AND (d.conversation_id = $2 OR (d.conversation_id IS NULL AND d.group_id IS NULL))
        AND d.is_deleted = false
        AND (
          to_tsvector('simple', dc.content) @@ plainto_tsquery('simple', $3)
          OR dc.content ILIKE $4
        )
      LIMIT $5
    `;
    keywordParams = [userId, conversationId, textQuery, `%${textQuery}%`, 20];
  } else {
    keywordQuery = `
      SELECT dc.id, dc.content, dc.chunk_index as "chunkIndex", d.name as "documentName", d.url as "documentUrl"
      FROM document_chunks dc
      JOIN documents d ON dc.document_id = d.id
      WHERE dc.embedding IS NOT NULL 
        AND d.uploaded_by = $1 
        AND d.group_id IS NULL
        AND d.conversation_id IS NULL
        AND d.is_deleted = false
        AND (
          to_tsvector('simple', dc.content) @@ plainto_tsquery('simple', $2)
          OR dc.content ILIKE $3
        )
      LIMIT $4
    `;
    keywordParams = [userId, textQuery, `%${textQuery}%`, 20];
  }

  let keywordResults: any[] = [];
  try {
    keywordResults = await prisma.$queryRawUnsafe<any[]>(keywordQuery, ...keywordParams);
  } catch (err) {
    console.error("Lỗi khi chạy Full-Text Search, bỏ qua và dùng Vector Search:", err);
  }

  // 3. Ghép kết quả bằng giải thuật RRF (Reciprocal Rank Fusion)
  const rrfMap = new Map<string, { chunk: any; score: number }>();
  const k = 60;

  // Điểm Vector
  vectorResults.forEach((chunk, index) => {
    const rank = index + 1;
    const score = 1 / (k + rank);
    rrfMap.set(chunk.id, { chunk, score });
  });

  // Điểm Keyword
  keywordResults.forEach((chunk, index) => {
    const rank = index + 1;
    const score = 1 / (k + rank);
    if (rrfMap.has(chunk.id)) {
      rrfMap.get(chunk.id)!.score += score;
    } else {
      rrfMap.set(chunk.id, { chunk, score });
    }
  });

  // Sắp xếp các chunk theo điểm RRF giảm dần
  const sortedRrf = Array.from(rrfMap.values())
    .sort((a, b) => b.score - a.score)
    .map(item => item.chunk);

  return sortedRrf.slice(0, limit);
};