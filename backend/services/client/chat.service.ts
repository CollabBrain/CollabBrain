import { MessageType } from "@prisma/client";
import { findFriendship } from "../../repositories/client/friend.repo";
import { createMessage, findMessageById, getMessageBetweenUsers, markMessageAsRead, softDelete } from "../../repositories/client/chat.repo";
import { uploadToSupabase } from "../../helpers/upload";
import prisma from "../../config/prisma";

// ============================================================
// ——— CHAT 1-1 (giữ nguyên) ———
// ============================================================

export const sendMessageService = async (senderId: string, receiverId: string, content: string, type: MessageType = "TEXT") => {
  const existing = await findFriendship(senderId, receiverId)
  const reverse = await findFriendship(receiverId, senderId)
  const friendShip = existing || reverse
  if (!friendShip || friendShip?.status !== "ACCEPTED") {
    throw new Error("Không thể gửi tin nhắn. Hai người chưa là bạn bè")
  }
  const newMessage = await createMessage(senderId, receiverId, content, type)
  return {
    message: "Gửi tin nhắn thành công",
    data: newMessage
  }
}

export const getChatHistoryService = async (myId: string, targetId: string) => {
  const existing = await findFriendship(myId, targetId)
  const reverse = await findFriendship(targetId, myId)
  const friendShip = existing || reverse
  if (!friendShip || friendShip?.status !== "ACCEPTED") {
    throw new Error("Không thể xem tin nhắn. Hai người chưa là bạn bè")
  }
  const messages = await getMessageBetweenUsers(myId, targetId)
  return {
    data: messages,
    message: "Lấy lịch sử chat thành công"
  }
}

export const markReadService = async (myId: string, targetId: string) => {
  const result = await markMessageAsRead(targetId, myId);
  return {
    data: result,
    message: "Đã đánh dấu tin nhắn là đã đọc"
  }
}

export const deleteMessageService = async (myId: string, messageId: string) => {
  const message = await findMessageById(messageId)
  if (!message) throw new Error("Không tồn tại tin nhắn")
  if (message.senderId === myId)
    await softDelete(messageId, "deletedBySender")
  else if (message.receiverId === myId)
    await softDelete(messageId, "deletedByReceiver")
  else
    throw new Error("Bạn không có quyền xóa tin nhắn này")
  return {
    message: "Xóa tin nhắn thành công"
  }
}

export const recallMessageService = async (myId: string, messageId: string) => {
  const message = await findMessageById(messageId);
  if (!message) throw new Error("Không tồn tại tin nhắn");
  if (message.senderId !== myId) {
    throw new Error("Bạn không có quyền thu hồi tin nhắn này");
  }
  const updatedMessage = await prisma.message.update({
    where: { id: messageId },
    data: {
      content: "🚫 Tin nhắn đã được thu hồi",
      type: "TEXT"
    },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } }
    }
  });
  return {
    message: "Thu hồi tin nhắn thành công",
    data: updatedMessage
  };
}

export const uploadToSupabasePostService = async (file: Express.Multer.File, path: string, bucket?: string) => {
  if (!file) throw new Error("Không có file")
  const result = await uploadToSupabase(file, path, bucket)
  return {
    data: result,
    message: "Upload thành công"
  }
}

// ============================================================
// ——— GROUP CHAT (placeholder - cần cập nhật schema) ———
// ============================================================

export const sendGroupMessageService = async (
  senderId: string,
  groupId: string,
  content: string,
  type: MessageType = "TEXT"
) => {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: senderId } }
  });
  if (!member) throw new Error("Bạn không phải thành viên của nhóm này");
  if (member.role === "VIEWER") throw new Error("VIEWER không được phép gửi tin nhắn");

  const newMessage = await prisma.message.create({
    data: {
      senderId,
      groupId,
      content,
      type
    },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true, email: true } }
    }
  });
  return { message: "Gửi tin nhắn thành công", data: newMessage };
};

export const getGroupHistoryService = async (groupId: string, userId: string, page = 1, limit = 30) => {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } }
  });
  if (!member) throw new Error("Bạn không phải thành viên của nhóm này");

  const messages = await prisma.message.findMany({
    where: { groupId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true, email: true } }
    }
  });

  return { data: messages.reverse(), message: "Lấy lịch sử tin nhắn nhóm thành công" };
};

export const togglePinMessageService = async (groupId: string, messageId: string, userId: string) => {
  throw new Error("Tính năng ghim tin nhắn đang được phát triển");
};

export const getPinnedMessagesService = async (groupId: string, userId: string) => {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } }
  });
  if (!member) throw new Error("Bạn không phải thành viên của nhóm này");
  return { data: [], message: "Lấy danh sách tin nhắn đã ghim thành công" };
};

export const recallGroupMessageService = async (groupId: string, messageId: string, userId: string) => {
  const msg = await findMessageById(messageId);
  if (!msg) throw new Error("Không tìm thấy tin nhắn");
  if (msg.groupId !== groupId) throw new Error("Tin nhắn không thuộc nhóm này");
  if (msg.senderId !== userId) throw new Error("Bạn không có quyền thu hồi tin nhắn này");

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: {
      content: "🚫 Tin nhắn đã được thu hồi",
      type: "TEXT"
    },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true, email: true } }
    }
  });
  return { message: "Thu hồi tin nhắn thành công", data: updated };
};

export const uploadGroupChatFileService = async (
  file: Express.Multer.File,
  groupId: string,
  uploaderId: string
) => {
  if (!file) throw new Error("Không có file");

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: uploaderId } }
  });
  if (!member) throw new Error("Bạn không phải thành viên của nhóm này");
  if (member.role === "VIEWER") throw new Error("VIEWER không được phép gửi file");

  const uploadResult = await uploadToSupabase(file, `groups/${groupId}`, "documents");

  const ext = file.originalname.split(".").pop()?.toUpperCase() || "";
  const typeMap: Record<string, string> = {
    PDF: "PDF", DOCX: "DOCX", DOC: "DOCX",
    PPTX: "PPTX", PPT: "PPTX",
    XLSX: "XLSX", XLS: "XLSX"
  };
  const isImage = file.mimetype.startsWith("image/");
  const docType = isImage ? "IMAGE" : (typeMap[ext] || "PDF");

  const doc = await prisma.document.create({
    data: {
      name: file.originalname,
      type: docType as any,
      url: uploadResult.url,
      size: file.size,
      mimeType: file.mimetype,
      groupId,
      uploadedBy: uploaderId
    }
  });

  return {
    data: {
      document: doc,
      url: uploadResult.url,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size
    },
    message: "Upload file thành công"
  };
};
