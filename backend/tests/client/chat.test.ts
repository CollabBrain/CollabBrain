import { describe, it, expect } from 'vitest';
import {
  createMessage,
  getMessageBetweenUsers,
  markMessageAsRead,
  softDelete,
  findMessageById,
  createGroupMessage,
} from '../../repositories/client/chat.repo';
import { prismaMock } from '../setup';
import { MessageType } from '@prisma/client';

describe('chat.repo', () => {
  const senderId = 'user-1';
  const receiverId = 'user-2';
  const messageId = 'msg-123';
  const groupId = 'group-456';

  describe('createMessage', () => {
    it('nên tạo tin nhắn thường chat 1-1 thành công', async () => {
      const mockResult = {
        id: messageId,
        senderId,
        receiverId,
        content: 'Hello',
        type: MessageType.TEXT,
        sender: { id: senderId, name: 'User 1', avatarUrl: null },
      };

      prismaMock.message.create.mockResolvedValue(mockResult as any);

      const result = await createMessage(senderId, receiverId, 'Hello');

      expect(prismaMock.message.create).toHaveBeenCalledWith({
        data: {
          senderId,
          receiverId,
          content: 'Hello',
          type: MessageType.TEXT,
        },
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } },
        },
      });
      expect(result).toEqual(mockResult);
    });

    it('nên tạo tin nhắn reply thành công', async () => {
      prismaMock.message.create.mockResolvedValue({ id: messageId } as any);

      await createMessage(senderId, receiverId, 'Reply content', MessageType.TEXT, 'reply-id');

      expect(prismaMock.message.create).toHaveBeenCalledWith({
        data: {
          senderId,
          receiverId,
          content: 'Reply content',
          type: MessageType.TEXT,
          replyToId: 'reply-id',
        },
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } },
        },
      });
    });
  });

  describe('getMessageBetweenUsers', () => {
    it('nên lấy các tin nhắn chưa bị xóa giữa hai người dùng', async () => {
      const mockMessages = [
        { id: '1', senderId, receiverId, content: 'Hi', createdAt: new Date() },
        { id: '2', senderId: receiverId, receiverId: senderId, content: 'Hello', createdAt: new Date() },
      ];

      prismaMock.message.findMany.mockResolvedValue(mockMessages as any);

      const result = await getMessageBetweenUsers(senderId, receiverId);

      expect(prismaMock.message.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { senderId, receiverId, deletedBySender: false },
            { senderId: receiverId, receiverId: senderId, deletedByReceiver: false },
          ],
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
      expect(result).toEqual(mockMessages);
    });
  });

  describe('markMessageAsRead', () => {
    it('nên cập nhật trạng thái đã đọc cho các tin nhắn chưa đọc', async () => {
      prismaMock.message.updateMany.mockResolvedValue({ count: 5 });

      const result = await markMessageAsRead(senderId, receiverId);

      expect(prismaMock.message.updateMany).toHaveBeenCalledWith({
        where: {
          senderId,
          receiverId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
      expect(result.count).toBe(5);
    });
  });

  describe('softDelete', () => {
    it('nên cập nhật soft delete cho phía người gửi', async () => {
      prismaMock.message.update.mockResolvedValue({ id: messageId, deletedBySender: true } as any);

      const result = await softDelete(messageId, 'deletedBySender');

      expect(prismaMock.message.update).toHaveBeenCalledWith({
        where: { id: messageId },
        data: { deletedBySender: true },
      });
      expect(result.deletedBySender).toBe(true);
    });
  });

  describe('findMessageById', () => {
    it('nên tìm tin nhắn bằng id', async () => {
      prismaMock.message.findFirst.mockResolvedValue({ id: messageId } as any);

      const result = await findMessageById(messageId);

      expect(prismaMock.message.findFirst).toHaveBeenCalledWith({
        where: { id: messageId },
      });
      expect(result?.id).toBe(messageId);
    });
  });

  describe('createGroupMessage', () => {
    it('nên tạo tin nhắn nhóm thành công', async () => {
      prismaMock.message.create.mockResolvedValue({ id: 'msg-group-1' } as any);

      await createGroupMessage(senderId, groupId, 'Hello Group');

      expect(prismaMock.message.create).toHaveBeenCalledWith({
        data: {
          senderId,
          groupId,
          content: 'Hello Group',
          type: MessageType.TEXT,
        },
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true, email: true } },
        },
      });
    });

    it('nên tạo tin nhắn nhóm kèm theo mention các thành viên', async () => {
      prismaMock.message.create.mockResolvedValue({ id: 'msg-group-2' } as any);

      await createGroupMessage(senderId, groupId, 'Hey @User', MessageType.TEXT, undefined, ['user-a', 'user-b']);

      expect(prismaMock.message.create).toHaveBeenCalledWith({
        data: {
          senderId,
          groupId,
          content: 'Hey @User',
          type: MessageType.TEXT,
          mentions: {
            create: [
              { userId: 'user-a' },
              { userId: 'user-b' },
            ],
          },
        },
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true, email: true } },
        },
      });
    });
  });
});
