import { MessageType } from "@prisma/client";
import { findFriendship } from "../../repositories/client/friend.repo";
import { createMessage, findMessageById, getMessageBetweenUsers, markMessageAsRead, softDelete } from "../../repositories/client/chat.repo";
import { uploadToSupabase } from "../../helpers/upload";
import prisma from "../../config/prisma";
import {
  createGroupMessage,
  getGroupMessages,
  pinGroupMessage,
  unpinGroupMessage,
  getPinnedMessages,
  findGroupMessageById,
  recallGroupMessage
} from "../../repositories/client/chat.repo";

// ============================================================
// ——— CHAT 1-1 (giữ nguyên) ———
// ============================================================

export const sendMessageService = async (senderId: string, receiverId: string, content: string, type: MessageType = "TEXT", replyToId?: string) => {
  const existing = await findFriendship(senderId, receiverId)
  const reverse = await findFriendship(receiverId, senderId)
  const friendShip = existing || reverse
  if (!friendShip || friendShip?.status !== "ACCEPTED") {
    throw new Error("Không thể gửi tin nhắn. Hai người chưa là bạn bè")
  }
  const newMessage = await createMessage(senderId, receiverId, content, type, replyToId)
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
      type: "TEXT",
      isRecalled: true
    },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
      replyTo: { include: { sender: { select: { id: true, name: true, avatarUrl: true } } } }
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

/**
 * Toggle pin tin nhắn chat 1-1
 */
export const togglePinChatMessageService = async (messageId: string, userId: string) => {
  const msg = await findMessageById(messageId);
  if (!msg) throw new Error("Không tìm thấy tin nhắn");

  // Kiểm tra quyền (phải là ng gửi hoặc ng nhận)
  if (msg.senderId !== userId && msg.receiverId !== userId) {
    throw new Error("Tin nhắn không thuộc cuộc trò chuyện của bạn");
  }

  if (msg.isPinned) {
    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { isPinned: false, pinnedBy: null, pinnedAt: null },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        replyTo: { include: { sender: { select: { id: true, name: true, avatarUrl: true } } } }
      }
    });
    return { message: "Đã bỏ ghim tin nhắn", data: updated, isPinned: false };
  } else {
    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { isPinned: true, pinnedBy: userId, pinnedAt: new Date() },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        replyTo: { include: { sender: { select: { id: true, name: true, avatarUrl: true } } } }
      }
    });
    return { message: "Đã ghim tin nhắn", data: updated, isPinned: true };
  }
};

/**
 * Lấy danh sách tin nhắn ghim chat 1-1
 */
export const getPinnedChatMessagesService = async (myId: string, targetId: string) => {
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: myId, receiverId: targetId },
        { senderId: targetId, receiverId: myId }
      ],
      isPinned: true
    },
    orderBy: { pinnedAt: "desc" },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
      replyTo: { include: { sender: { select: { id: true, name: true, avatarUrl: true } } } }
    }
  });

  return {
    data: messages,
    message: "Lấy danh sách tin nhắn ghim thành công"
  };
};

// ============================================================
// ——— GROUP CHAT ———
// ============================================================

/** Kiểm tra user có phải thành viên group và có quyền gửi tin không */
const assertGroupMemberCanChat = async (groupId: string, userId: string) => {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } }
  });
  if (!member) throw new Error("Bạn không phải thành viên của nhóm này");
  if (member.role === "VIEWER") throw new Error("VIEWER không được phép gửi tin nhắn");
  return member;
};

/** Kiểm tra user có phải OWNER của group không */
const assertGroupOwner = async (groupId: string, userId: string) => {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } }
  });
  if (!member) throw new Error("Bạn không phải thành viên của nhóm này");
  if (member.role !== "OWNER") throw new Error("Chỉ chủ nhóm mới có quyền thực hiện hành động này");
  return member;
};

/**
 * Gửi tin nhắn vào group
 * VIEWER bị chặn, phải là MEMBER hoặc OWNER
 */
export const sendGroupMessageService = async (
  senderId: string,
  groupId: string,
  content: string,
  type: MessageType = "TEXT",
  replyToId?: string,
  mentionIds?: string[]
) => {
  await assertGroupMemberCanChat(groupId, senderId);

  // Kiểm tra replyToId hợp lệ (nếu có)
  if (replyToId) {
    const replyMsg = await prisma.message.findFirst({ where: { id: replyToId, groupId } });
    if (!replyMsg) throw new Error("Tin nhắn được reply không tồn tại trong nhóm này");
  }

  const newMessage = await createGroupMessage(senderId, groupId, content, type, replyToId, mentionIds);
  return {
    message: "Gửi tin nhắn thành công",
    data: newMessage
  };
};

/**
 * Lấy lịch sử tin nhắn group (có phân trang)
 */
export const getGroupHistoryService = async (groupId: string, userId: string, page = 1, limit = 30) => {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } }
  });
  if (!member) throw new Error("Bạn không phải thành viên của nhóm này");
  const result = await getGroupMessages(groupId, page, limit);
  return {
    data: result,
    message: "Lấy lịch sử tin nhắn nhóm thành công"
  };
};

/**
 * Toggle pin tin nhắn (chỉ OWNER)
 */
export const togglePinMessageService = async (groupId: string, messageId: string, userId: string) => {
  await assertGroupOwner(groupId, userId);
  const msg = await findGroupMessageById(messageId);
  if (!msg) throw new Error("Không tìm thấy tin nhắn");
  if (msg.groupId !== groupId) throw new Error("Tin nhắn không thuộc nhóm này");

  if (msg.isPinned) {
    const updated = await unpinGroupMessage(messageId);
    return { message: "Đã bỏ ghim tin nhắn", data: updated, isPinned: false };
  } else {
    const updated = await pinGroupMessage(messageId, userId);
    return { message: "Đã ghim tin nhắn", data: updated, isPinned: true };
  }
};

/**
 * Lấy tất cả tin nhắn đã ghim trong group
 */
export const getPinnedMessagesService = async (groupId: string, userId: string) => {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } }
  });
  if (!member) throw new Error("Bạn không phải thành viên của nhóm này");
  const messages = await getPinnedMessages(groupId);
  return {
    data: messages,
    message: "Lấy danh sách tin nhắn đã ghim thành công"
  };
};

/**
 * Thu hồi tin nhắn trong group (chỉ người gửi)
 */
export const recallGroupMessageService = async (groupId: string, messageId: string, userId: string) => {
  const msg = await findGroupMessageById(messageId);
  if (!msg) throw new Error("Không tìm thấy tin nhắn");
  if (msg.groupId !== groupId) throw new Error("Tin nhắn không thuộc nhóm này");
  if (msg.senderId !== userId) throw new Error("Bạn không có quyền thu hồi tin nhắn này");
  if (msg.isRecalled) throw new Error("Tin nhắn đã được thu hồi trước đó");

  const updated = await recallGroupMessage(messageId);
  return { message: "Thu hồi tin nhắn thành công", data: updated };
};

/**
 * Upload file vào group chat và tự động thêm vào tài liệu nhóm + My Documents
 * Trả về Document record để client hiển thị thẻ file trong chat
 */
export const uploadGroupChatFileService = async (
  file: Express.Multer.File,
  groupId: string,
  uploaderId: string
) => {
  if (!file) throw new Error("Không có file");

  // Kiểm tra quyền gửi (không phải VIEWER)
  await assertGroupMemberCanChat(groupId, uploaderId);

  // Upload lên Supabase bucket "documents"
  const uploadResult = await uploadToSupabase(file, `groups/${groupId}`, "documents");

  // Xác định DocumentType từ extension
  const ext = file.originalname.split(".").pop()?.toUpperCase() || "";
  const typeMap: Record<string, string> = {
    PDF: "PDF", DOCX: "DOCX", DOC: "DOCX",
    PPTX: "PPTX", PPT: "PPTX",
    XLSX: "XLSX", XLS: "XLSX"
  };
  const isImage = file.mimetype.startsWith("image/");
  const docType = isImage ? "IMAGE" : (typeMap[ext] || "PDF");

  // Tạo Document record (tự động link vào group + uploader)
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