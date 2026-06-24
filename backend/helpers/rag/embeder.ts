import axios from "axios"
import dotenv from "dotenv"
dotenv.config()
const PYTHON_EMBED_URL = process.env.PYTHON_EMBED_URL!

export const getEmbeding = async (text: string, isQuery = false) => {
  const result = await axios.post(PYTHON_EMBED_URL, {
    text: text,
    is_query: isQuery
  });

  const embedding = result.data.embedding;
  if (!Array.isArray(embedding) || embedding.length != 384) {
    throw new Error(`Lỗi Vector: Mong muốn vector 384 chiều, nhưng nhận được ${embedding?.length}`)
  }
  return embedding

}