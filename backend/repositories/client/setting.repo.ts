import prisma from "../../config/prisma";

export const getSettingByKey = async (key: string) => {
  return prisma.siteSetting.findUnique({
    where: { key }
  });
};

export const getAllSettings = async () => {
  return prisma.siteSetting.findMany();
};

export const upsertSetting = async (key: string, value: string) => {
  return prisma.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });
};
