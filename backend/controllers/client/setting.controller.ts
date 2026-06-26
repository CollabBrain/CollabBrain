import { Request, Response } from "express";
import * as settingRepo from "../../repositories/client/setting.repo";

export const getSettings = async (req: Request, res: Response) => {
  try {
    const settingsList = await settingRepo.getAllSettings();
    const settingsMap: Record<string, string> = {};
    settingsList.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    const web_name = settingsMap["web_name"] || "Studifier";
    const footer = settingsMap["footer"] || `Studifier &copy; ${new Date().getFullYear()} &bull; AI Learning Ecosystem`;

    res.status(200).json({
      code: 200,
      message: "Lấy cấu hình hệ thống thành công",
      data: {
        web_name,
        footer
      }
    });
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message || "Lỗi khi lấy cấu hình hệ thống"
    });
  }
};
