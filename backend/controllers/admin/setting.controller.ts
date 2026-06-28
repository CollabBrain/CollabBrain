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
      success: true,
      data: {
        web_name,
        footer
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Lỗi khi lấy cấu hình hệ thống"
    });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { web_name, footer } = req.body;

    if (web_name !== undefined) {
      await settingRepo.upsertSetting("web_name", String(web_name).trim());
    }
    if (footer !== undefined) {
      await settingRepo.upsertSetting("footer", String(footer).trim());
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật cấu hình hệ thống thành công"
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Lỗi khi cập nhật cấu hình hệ thống"
    });
  }
};
