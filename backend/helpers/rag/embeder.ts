import axios from "axios"
import dotenv from "dotenv"
dotenv.config()
const PYTHON_EMBED_URL = process.env.PYTHON_EMBED_URL!
const PYTHON_EMBED_BATCH_URL = process.env.PYTHON_EMBED_BATCH_URL!

export const getEmbeding = async (text: string, isQuery = false) => {
  const result = await axios.post(PYTHON_EMBED_URL, {
    text: text,
    is_query: isQuery
  });

  const embedding = result.data.embedding;
  if (!Array.isArray(embedding) || embedding.length != 384) {
    throw new Error(`Lỗi Vector: Mong muốn vector 384 chiều, nhưng nhận được ${embedding?.length}`)
  }
  return embedding;
};


export const getBatchEmbeddings= async(texts:string[], isQuery = false)=>{
  const result = await axios.post(PYTHON_EMBED_BATCH_URL,{
    texts: texts,
    is_query: isQuery
  })
  const embeddings = result.data.embeddings;
  if(!Array.isArray(embeddings)){
    throw new Error("Lỗi")
  }
  return embeddings;
};

export const callReranker = async (query: string, passages: string[]): Promise<number[]> => {
  if (passages.length === 0) return [];
  const url = PYTHON_EMBED_URL.replace("/embed", "/rerank");
  const result = await axios.post(url, {
    query: query,
    passages: passages
  });
  const scores = result.data.scores;
  if (!Array.isArray(scores)) {
    throw new Error("Lỗi Reranker: Không nhận được danh sách điểm số");
  }
  return scores;
};