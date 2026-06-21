import React, { useRef, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { Loader2 } from "lucide-react";
import axiosInstance from "../../services/axiosInstance";

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  height = 350,
}) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const editorRef = useRef<any>(null);

  // API Key công khai của TinyMCE đã được lưu trong backend .env
  const TINYMCE_API_KEY = "cduhz73g0qtq9ufwh0mqc8u2hf1ksrwomn9e1bd0tij45fp5";

  // Hàm xử lý upload ảnh tùy chỉnh tích hợp trực tiếp với Cloudinary API
  const handleImageUpload = (blobInfo: any, progress: (percent: number) => void): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const formData = new FormData();
        formData.append("image", blobInfo.blob(), blobInfo.filename());

        // Gửi request upload thông qua axiosInstance để tự động kèm token
        const response = await axiosInstance.post<{ url: string }>(
          "http://localhost:3000/upload/image",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                progress(percentCompleted);
              }
            },
          }
        );

        if (response.data && response.data.url) {
          resolve(response.data.url);
        } else {
          reject("Không tìm thấy đường dẫn ảnh trong phản hồi");
        }
      } catch (err: any) {
        console.error("Lỗi upload ảnh TinyMCE:", err);
        reject(
          err?.response?.data?.message ||
            err.message ||
            "Lỗi khi kết nối với máy chủ upload"
        );
      }
    });
  };

  return (
    <div className="relative border border-input rounded-md overflow-hidden bg-background">
      {/* Loading overlay khi TinyMCE đang được tải */}
      {isInitializing && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50/80 dark:bg-slate-900/80 min-h-[350px]">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-2" />
          <span className="text-sm text-muted-foreground font-medium">
            Đang tải trình soạn thảo...
          </span>
        </div>
      )}

      <Editor
        apiKey={TINYMCE_API_KEY}
        onInit={(evt, editor) => {
          editorRef.current = editor;
          setIsInitializing(false);
        }}
        value={value}
        onEditorChange={onChange}
        init={{
          height: height,
          menubar: false,
          placeholder: placeholder,
          plugins: [
            "advlist",
            "autolink",
            "lists",
            "link",
            "image",
            "charmap",
            "preview",
            "anchor",
            "searchreplace",
            "visualblocks",
            "code",
            "fullscreen",
            "insertdatetime",
            "media",
            "table",
            "code",
            "help",
            "wordcount",
          ],
          toolbar:
            "undo redo | blocks | " +
            "bold italic forecolor | alignleft aligncenter " +
            "alignright alignjustify | bullist numlist outdent indent | " +
            "removeformat | link image media | code fullscreen",
          content_style:
            "body { font-family:Inter,Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height: 1.6; color: #334155; } " +
            "img { max-width: 100%; height: auto; border-radius: 6px; margin: 8px 0; }",
          // Tích hợp trình upload ảnh tự thiết kế
          images_upload_handler: handleImageUpload,
          branding: false,
          promotion: false,
          statusbar: true,
        }}
      />
    </div>
  );
};

export default RichTextEditor;
