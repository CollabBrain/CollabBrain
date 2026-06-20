import React, { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import axiosInstance from "../../services/axiosInstance";

interface AvatarUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  nameInitial?: string;
  className?: string;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  value,
  onChange,
  nameInitial = "U",
  className = "h-24 w-24",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.value ? e.target.files : null;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Chỉ chấp nhận tệp định dạng ảnh
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn một tệp hình ảnh hợp lệ.");
      return;
    }

    // Giới hạn dung lượng ảnh là 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError("Kích thước ảnh không được vượt quá 10MB.");
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      // Gọi API upload qua axiosInstance (tự đính kèm token và quản lý auth)
      // Sử dụng đường dẫn tuyệt đối để axiosInstance gọi đến /upload/image thay vì /user/upload/image
      const response = await axiosInstance.post<{ url: string }>(
        "http://localhost:3000/upload/image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data && response.data.url) {
        onChange(response.data.url);
      } else {
        throw new Error("Không nhận được URL ảnh từ server");
      }
    } catch (err: any) {
      console.error("Lỗi upload avatar:", err);
      setError(err?.response?.data?.message || err.message || "Tải ảnh lên thất bại");
    } finally {
      setIsUploading(false);
      // Reset input value để có thể chọn lại cùng một file sau đó
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        onClick={handleClick}
        className={`relative rounded-full overflow-hidden cursor-pointer group shadow-md transition-all duration-300 hover:shadow-lg border-2 border-border hover:border-indigo-500 bg-slate-100 dark:bg-slate-800 ${className}`}
      >
        {/* Render Avatar Image */}
        {value ? (
          <img
            src={value}
            alt="Avatar"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-indigo-600 text-white font-bold text-2xl uppercase tracking-wider">
            {nameInitial.slice(0, 2)}
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Camera className="h-6 w-6 text-white animate-pulse" />
        </div>

        {/* Loading Spinner */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {error && <span className="text-xs text-red-500 mt-1 max-w-[200px] text-center">{error}</span>}
    </div>
  );
};
export default AvatarUpload;
