import { Request, Response } from "express";
import { deleteMessageService, getChatHistoryService, markReadService, uploadToSupabasePostService } from "../../services/client/chat.service";
import prisma from "../../config/prisma";
import { getListFriend } from "../../repositories/client/friend.repo";
import { getMessageBetweenUsers, markMessageAsRead } from "../../repositories/client/chat.repo";

//[GET] /chat/history/:userId
export const getHistory = async (req: Request, res: Response) => {
    try {
      const myId = (req as any).user.id;
      const targetId = req.params.userId as string;
      const result = await getChatHistoryService(myId, targetId);
      return res.status(200).json({
        code: 200,
        message: result.message,
        data: result.data
      });
    } catch (error: any) {
        res.status(400).json({
          code: 400,
          message: `Lỗi: ${error.message}`
        });
    }
};

//[PATCH] /chat/read/:userId
export const markedReadPatch = async (req: Request, res: Response) => {
  try {
    const myId = (req as any).user.id;
    const targetId = req.params.userId as string;
    const result = await markReadService(myId, targetId);
    return res.status(200).json({
      code: 200,
      message: result.message,
      data: result.data
    });
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

//[PATCH] /chat/delete/:messageId
export const deleteMessagePatch = async (req: Request, res: Response) => {
  try {
    const myId = (req as any).user.id;
    const messageId = req.params.messageId as string;
    const result = await deleteMessageService(myId, messageId);
    return res.status(200).json({
      code: 200,
      message: result.message
    });
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

//[POST] /chat/upload
export const uploadFilePost = async (req: Request, res: Response) => {
  try {
    const myId = (req as any).user.id;
    const pathUpload = `chat/${myId}`;
    const result = await uploadToSupabasePostService(req.file!, pathUpload);
    res.status(200).json({
      code: 200,
      data: result.data,
      message: result.message
    });
  } catch (error) {
    res.status(400).json({
      code: 400,
      message: "Upload thất bại"
    });
  }
};

//[GET] /chat/conversations
export const getConversations = async (req: Request, res: Response) => {
  try {
    const myId = (req as any).user.id;
    const currentUser = (req as any).user;

    // Lấy danh sách bạn bè đã ACCEPTED
    const friends: any = await getListFriend(myId);
    const conversations = [];

    for (const friend of friends) {
      // Lấy tin nhắn cuối cùng giữa 2 người
      const lastMessage = await prisma.message.findFirst({
        where: {
          OR: [
            { senderId: myId, receiverId: friend.id },
            { senderId: friend.id, receiverId: myId }
          ]
        },
        orderBy: { createdAt: "desc" }
      });

      // Đếm tin nhắn chưa đọc đối phương gửi cho mình
      const unreadCount = await prisma.message.count({
        where: {
          senderId: friend.id,
          receiverId: myId,
          isRead: false
        }
      });

      // Định dạng thông tin participants
      const participants = [
        {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          avatarUrl: currentUser.avatarUrl,
        },
        {
          id: friend.id,
          name: friend.name,
          email: friend.email,
          avatarUrl: friend.avatarUrl,
        }
      ];

      conversations.push({
        id: friend.id, // Coi conversationId chính là ID của bạn bè
        participants,
        lastMessage: lastMessage ? {
          ...lastMessage,
          conversationId: friend.id,
          type: lastMessage.type.toLowerCase() as any
        } : null,
        unreadCount,
        updatedAt: lastMessage ? lastMessage.createdAt : (friend.createdAt || new Date()),
        createdAt: friend.createdAt || new Date()
      });
    }

    // Sắp xếp hội thoại theo updatedAt mới nhất
    conversations.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return res.status(200).json({
      code: 200,
      message: "Lấy danh sách cuộc trò chuyện thành công",
      data: { conversations }
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

//[POST] /chat/conversations
export const createConversation = async (req: Request, res: Response) => {
  try {
    const myId = (req as any).user.id;
    const currentUser = (req as any).user;
    const targetUserId = req.body.targetUserId as string;

    if (!targetUserId) {
      return res.status(400).json({
        code: 400,
        message: "Không tìm thấy targetUserId"
      });
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId, isDeleted: false }
    });

    if (!targetUser) {
      return res.status(404).json({
        code: 404,
        message: "Không tìm thấy người dùng này"
      });
    }

    const lastMessage = await prisma.message.findFirst({
      where: {
        OR: [
          { senderId: myId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: myId }
        ]
      },
      orderBy: { createdAt: "desc" }
    });

    const unreadCount = await prisma.message.count({
      where: {
        senderId: targetUserId,
        receiverId: myId,
        isRead: false
      }
    });

    const conversation = {
      id: targetUserId,
      participants: [
        {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          avatarUrl: currentUser.avatarUrl,
        },
        {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          avatarUrl: targetUser.avatarUrl,
        }
      ],
      lastMessage: lastMessage ? {
        ...lastMessage,
        conversationId: targetUserId,
        type: lastMessage.type.toLowerCase() as any
      } : null,
      unreadCount,
      updatedAt: lastMessage ? lastMessage.createdAt : new Date(),
      createdAt: new Date()
    };

    return res.status(200).json({
      code: 200,
      message: "Tạo hội thoại thành công",
      data: conversation
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

//[GET] /chat/conversations/:conversationId
export const getConversationById = async (req: Request, res: Response) => {
  try {
    const myId = (req as any).user.id;
    const currentUser = (req as any).user;
    const conversationId = req.params.conversationId as string;

    const targetUser = await prisma.user.findFirst({
      where: { id: conversationId, isDeleted: false }
    });

    if (!targetUser) {
      return res.status(404).json({
        code: 404,
        message: "Không tìm thấy cuộc trò chuyện"
      });
    }

    const lastMessage = await prisma.message.findFirst({
      where: {
        OR: [
          { senderId: myId, receiverId: conversationId },
          { senderId: conversationId, receiverId: myId }
        ]
      },
      orderBy: { createdAt: "desc" }
    });

    const unreadCount = await prisma.message.count({
      where: {
        senderId: conversationId,
        receiverId: myId,
        isRead: false
      }
    });

    const conversation = {
      id: conversationId,
      participants: [
        {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          avatarUrl: currentUser.avatarUrl,
        },
        {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          avatarUrl: targetUser.avatarUrl,
        }
      ],
      lastMessage: lastMessage ? {
        ...lastMessage,
        conversationId: conversationId,
        type: lastMessage.type.toLowerCase() as any
      } : null,
      unreadCount,
      updatedAt: lastMessage ? lastMessage.createdAt : new Date(),
      createdAt: new Date()
    };

    return res.status(200).json({
      code: 200,
      message: "Lấy thông tin hội thoại thành công",
      data: conversation
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

//[GET] /chat/conversations/:conversationId/messages
export const getConversationMessages = async (req: Request, res: Response) => {
  try {
    const myId = (req as any).user.id;
    const conversationId = req.params.conversationId as string;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 30));

    const messages = await getMessageBetweenUsers(myId, conversationId);

    const formattedMessages = messages.map(m => ({
      ...m,
      conversationId: m.senderId === myId ? (m.receiverId as string) : m.senderId,
      type: m.type.toLowerCase() as any
    }));

    const total = formattedMessages.length;
    // Trả trang từ cuối: page=1 = tin mới nhất (30 tin gần nhất)
    const start = Math.max(0, total - page * limit);
    const end = Math.max(0, total - (page - 1) * limit);
    const pageMessages = formattedMessages.slice(start, end);
    const hasMore = start > 0;

    return res.status(200).json({
      code: 200,
      message: "Lấy tin nhắn thành công",
      data: {
        messages: pageMessages,
        total,
        page,
        hasMore
      }
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

//[PATCH] /chat/conversations/:conversationId/read
export const markConversationRead = async (req: Request, res: Response) => {
  try {
    const myId = (req as any).user.id;
    const conversationId = req.params.conversationId as string;

    await markMessageAsRead(conversationId, myId);

    return res.status(200).json({
      code: 200,
      message: "Đánh dấu tất cả tin nhắn đã đọc thành công",
      data: null
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

//[GET] /chat/users/search?q=
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const myId = (req as any).user.id;
    const q = (req.query.q as string || '').trim();

    if (q.length < 2) {
      return res.status(200).json({
        code: 200,
        message: "Kết quả tìm kiếm",
        data: { users: [] }
      });
    }

    const users = await prisma.user.findMany({
      where: {
        isDeleted: false,
        id: { not: myId },
        OR: [
          { name: { contains: q } },
          { email: { contains: q } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
      take: 20
    });

    return res.status(200).json({
      code: 200,
      message: "Tìm kiếm người dùng thành công",
      data: {
        users: users.map(u => ({
          ...u,
          isOnline: false,
        }))
      }
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};

//[POST] /chat/messages — gửi tin nhắn qua REST (fallback khi socket lỗi)
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const myId = (req as any).user.id;
    const { conversationId, content, type = 'text' } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({
        code: 400,
        message: "Thiếu conversationId hoặc content"
      });
    }

    const message = await prisma.message.create({
      data: {
        senderId: myId,
        receiverId: conversationId,
        content,
        type: (type as string).toUpperCase() as any,
      }
    });

    return res.status(200).json({
      code: 200,
      message: "Gửi tin nhắn thành công",
      data: {
        ...message,
        conversationId,
        type: message.type.toLowerCase() as any,
      }
    });
  } catch (error: any) {
    return res.status(400).json({
      code: 400,
      message: `Lỗi: ${error.message}`
    });
  }
};
