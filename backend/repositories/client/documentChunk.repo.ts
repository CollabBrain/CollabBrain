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
  }
) => {
  const { limit, userId, groupId } = options;
  const vectorStr = `[${vector.join(",")}]`;
  if (groupId) {
    return prisma.$queryRawUnsafe<any[]>(
      `
      SELECT dc.id, dc.content, dc.chunk_index as "chunkIndex", d.name as "documentName", d.url as "documentUrl"
      FROM document_chunks dc
      JOIN documents d ON dc.document_id = d.id
      WHERE dc.embedding IS NOT NULL 
        AND d.group_id = $1 
        AND d.is_deleted = false
      ORDER BY dc.embedding <-> $2::vector
      LIMIT $3
      `,
      groupId,
      vectorStr,
      limit
    );
  } else {
    return prisma.$queryRawUnsafe<any[]>(
      `
      SELECT dc.id, dc.content, dc.chunk_index as "chunkIndex", d.name as "documentName", d.url as "documentUrl"
      FROM document_chunks dc
      JOIN documents d ON dc.document_id = d.id
      WHERE dc.embedding IS NOT NULL 
        AND d.uploaded_by = $1 
        AND d.group_id IS NULL
        AND d.is_deleted = false
      ORDER BY dc.embedding <-> $2::vector
      LIMIT $3
      `,
      userId,
      vectorStr,
      limit
    );
  }
};