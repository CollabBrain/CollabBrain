import prisma from "../../config/prisma";

export interface NotificationSettingsInput {
  enableAll?: boolean;
  enableChat?: boolean;
  enableFriend?: boolean;
  enableGroup?: boolean;
  enableSystem?: boolean;
  enableSound?: boolean;
  enableVibrate?: boolean;
  chatPriority?: string;
}

export const getNotificationSettings = async (userId: string) => {
  let settings = await prisma.userNotificationSettings.findUnique({
    where: { userId }
  });

  if (!settings) {
    settings = await prisma.userNotificationSettings.create({
      data: { userId }
    });
  }

  return settings;
};

export const updateNotificationSettings = async (
  userId: string,
  data: NotificationSettingsInput
) => {
  return prisma.userNotificationSettings.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data }
  });
};
