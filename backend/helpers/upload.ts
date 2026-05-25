import {v4 as uuidv4} from "uuid"
import { supabase } from "../config/supabase"
// folder:
//   Chat:        uploadToSupabase(file, "chat/userId-123")
//   RAG cá nhân: uploadToSupabase(file, "personal/userId-123", "documents")
//   RAG nhóm:    uploadToSupabase(file, "groups/groupId-456", "documents")
export const uploadToSupabase = async (
  file: Express.Multer.File,
  folder: string,
  bucket: string = "chat-files"
) => {
  const typeFile = file.originalname.split(".").pop()
  const fileName = `${uuidv4()}.${typeFile}`
  const filePath = `${folder}/${fileName}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file.buffer, { contentType: file.mimetype })

  if (error) throw new Error("Upload thất bại: " + error.message)

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)

  return {
    url: urlData.publicUrl,
    fileName: file.originalname
  }



}