import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Hàm bắt buộc của Shadcn UI — merge Tailwind class
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
