import axios from "axios";
import * as path from "path";
import { supabase } from "../../config/supabase";

// Disabling check for untyped imports
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");
const XLSX = require("xlsx");

export const cleanText = (text: string): string => {
  return text
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
};

export const getBucketAndPathFromUrl = (url: string) => {
  // Trích xuất bucket và filePath từ Supabase Public URL
  // Cấu trúc URL: https://[project-id].supabase.co/storage/v1/object/public/[bucket]/[filePath]
  const parts = url.split("/storage/v1/object/public/");
  if (parts.length < 2) {
    throw new Error("Không thể phân tích định dạng URL Supabase");
  }
  const remaining = parts[1];
  const firstSlashIdx = remaining.indexOf("/");
  const bucket = remaining.substring(0, firstSlashIdx);
  const filePath = decodeURIComponent(remaining.substring(firstSlashIdx + 1));
  return { bucket, filePath };
};

export const extractTextFromUrl = async (url: string, filename: string): Promise<string> => {
  const { bucket, filePath } = getBucketAndPathFromUrl(url);

  // Tải trực tiếp buffer từ Supabase Storage thông qua supabase client
  const { data, error } = await supabase.storage.from(bucket).download(filePath);
  if (error) {
    throw new Error("Lỗi tải file từ Supabase: " + error.message);
  }

  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = path.extname(filename).toLowerCase();
  let text = "";

  if (ext === ".pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      text = result.text;
    } finally {
      await parser.destroy();
    }
  } else if (ext === ".docx") {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else if (ext === ".xlsx" || ext === ".xls") {
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const parts: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet["!ref"]) continue;

      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
        raw: false,
        blankrows: false,
      });

      const sheetLines: string[] = [];
      for (const row of rows) {
        if (!Array.isArray(row)) continue;
        let rowText = "";
        for (const rawCell of row) {
          const cell = String(rawCell).trim();
          if (!cell) continue;
          rowText += rowText ? ` | ${cell}` : cell;
        }
        if (rowText) sheetLines.push(rowText);
      }

      if (sheetLines.length === 0) continue;
      parts.push(`## Sheet: ${sheetName}`, ...sheetLines);
    }
    text = parts.join("\n");
  } else {
    throw new Error(`Định dạng file không được hỗ trợ: ${ext}`);
  }

  return cleanText(text);
};