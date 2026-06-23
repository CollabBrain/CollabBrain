import prisma from "../../config/prisma";
import { MessageType } from "@prisma/client";

// ============================================================
// ——— CHAT 1-1 (giữ nguyên) ———
// ============================================================

export const createMessage = async (senderId: string, receiverId: string, content: string, type: MessageType = "TEXT") => {
  return prisma.message.create({
    data: {
      senderId,
      receiverId,
      content,
      type
    }
  })
}

export const getMessageBetweenUsers = async (user1Id: string, user2Id: string) => {
  return prisma.message.findMany({
    where: {
      OR: [
        { senderId: user1Id, receiverId: user2Id, deletedBySender: false },
        { senderId: user2Id, receiverId: user1Id, deletedByReceiver: false }
      ]
    },
    orderBy: {
      createdAt: "asc"
    }
  })
}

export const markMessageAsRead = async (senderId: string, receiverId: string) => {
  return prisma.message.updateMany({
    where: {
      senderId,
      receiverId,
      isRead: false
    },
    data: {
      isRead: true
    }
  })
}

export const softDelete = async (messageId: string, field: "deletedBySender" | "deletedByReceiver") => {
  return prisma.message.update({
    where: {
      id: messageId,
    },
    data: {
      [field]: true
    }
  })
}

export const findMessageById = async (id: string) => {
  return prisma.message.findFirst({
    where: {
      id: id
    }
  })
}

// ============================================================
// ——— GROUP CHAT ———
// ============================================================

/** Include chuẩn cho tin nhắn nhóm: sender, replyTo, mentions */
const GROUP_MESSAGE_INCLUDE = {
  sender: {
    select: { id: true, name: true, avatarUrl: true, email: true }
  },
  replyTo: {
    select: {
      id: true,
      content: true,
      isRecalled: true,
      type: true,
      sender: { select: { id: true, name: true } }
    }
  },
  mentions: {
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } }
    }
  }
} as const;

/**
 * Tạo tin nhắn group, kèm mentions (nếu có)
 */
export const createGroupMessage = async (
  senderId: string,
  groupId: string,
  content: string,
  type: MessageType = "TEXT",
  replyToId?: string,
  mentionIds?: string[]
) => {
  return prisma.message.create({
    data: {
      senderId,
      groupId,
      content,
      type,
      replyToId: replyToId || null,
      ...(mentionIds && mentionIds.length > 0
        ? {
            mentions: {
              create: mentionIds.map(userId => ({ userId }))
            }
          }
        : {})
    },
    include: GROUP_MESSAGE_INCLUDE
  });
};

/**
 * Lấy lịch sử tin nhắn group (phân trang từ mới → cũ)
 */
export const getGroupMessages = async (groupId: string, page = 1, limit = 30) => {
  const skip = (page - 1) * limit;
  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { groupId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: GROUP_MESSAGE_INCLUDE
    }),
    prisma.message.count({ where: { groupId } })
  ]);
  // Trả về theo thứ tự tăng dần để UI render đúng
  return { messages: messages.reverse(), total };
};

/**
 * Pin một tin nhắn trong group (chỉ OWNER gọi từ service)
 */
export const pinGroupMessage = async (messageId: string, pinnedByUserId: string) => {
  return prisma.message.update({
    where: { id: messageId },
    data: {
      isPinned: true,
      pinnedBy: pinnedByUserId,
      pinnedAt: new Date()
    },
    include: GROUP_MESSAGE_INCLUDE
  });
};

/**
 * Unpin một tin nhắn trong group
 */
export const unpinGroupMessage = async (messageId: string) => {
  return prisma.message.update({
    where: { id: messageId },
    data: {
      isPinned: false,
      pinnedBy: null,
      pinnedAt: null
    },
    include: GROUP_MESSAGE_INCLUDE
  });
};

/**
 * Lấy tất cả tin nhắn đã pin trong group
 */
export const getPinnedMessages = async (groupId: string) => {
  return prisma.message.findMany({
    where: { groupId, isPinned: true },
    orderBy: { pinnedAt: "desc" },
    include: GROUP_MESSAGE_INCLUDE
  });
};

/**
 * Tìm tin nhắn group theo id (để recall, delete, pin)
 */
export const findGroupMessageById = async (messageId: string) => {
  return prisma.message.findFirst({
    where: { id: messageId },
    include: GROUP_MESSAGE_INCLUDE
  });
};

/**
 * Thu hồi tin nhắn trong group (đổi content, đánh dấu isRecalled)
 */
export const recallGroupMessage = async (messageId: string) => {
  return prisma.message.update({
    where: { id: messageId },
    data: {
      content: "🚫 Tin nhắn đã được thu hồi",
      type: "TEXT",
      isRecalled: true
    },
    include: GROUP_MESSAGE_INCLUDE
  });
};

/**
 * Lấy tin nhắn cuối cùng của một group (dùng cho danh sách groups)
 */
export const getLastGroupMessage = async (groupId: string) => {
  return prisma.message.findFirst({
    where: { groupId },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true } }
    }
  });
};