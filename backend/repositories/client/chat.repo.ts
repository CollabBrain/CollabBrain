import prisma from "../../config/prisma";
import { MessageType } from "@prisma/client";

// ============================================================
// ——— CHAT 1-1 ———
// ============================================================

export const createMessage = async (senderId: string, receiverId: string, content: string, type: MessageType = "TEXT", replyToId?: string) => {
  return prisma.message.create({
    data: {
      senderId,
      receiverId,
      content,
      type,
      ...(replyToId && { replyToId }),
    },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
      replyTo: {
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } }
        }
      }
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
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
      replyTo: {
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } }
        }
      }
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

export const createGroupMessage = async (
  senderId: string,
  groupId: string,
  content: string,
  type: MessageType = "TEXT",
  replyToId?: string,
  mentionIds?: string[]
) => {
  const data: any = {
    senderId,
    groupId,
    content,
    type
  };
  if (replyToId) data.replyToId = replyToId;
  if (mentionIds && mentionIds.length > 0) {
    data.mentions = {
      create: mentionIds.map((userId) => ({ userId }))
    };
  }
  return prisma.message.create({
    data,
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true, email: true } },
      replyTo: {
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true, email: true } }
        }
      }
    }
  });
};
