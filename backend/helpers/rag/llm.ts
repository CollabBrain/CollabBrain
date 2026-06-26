import axios from "axios";

const GROQ_API_URL = process.env.GROQ_API_URL!

export const callLLM = async (prompt: string): Promise<string> => {
  const response = await axios.post(
    GROQ_API_URL,
    {
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "Bạn là một trợ lý AI thông minh. Hãy chỉ trả lời dựa vào phần thông tin ngữ cảnh được cung cấp. Nếu ngữ cảnh không có thông tin, hãy nói rõ là dữ liệu không hỗ trợ thay vì tự đoán câu trả lời.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.choices[0].message.content;
};
