import { describe, it, expect } from 'vitest';
import {
  getListFriend,
  updateFriendShipStatus,
  findFriendship,
  deleteRowFriendShip,
  createFriendShip,
  getRequestedFriend,
  getSentFriend,
  getSuggestFriend,
  getSearchSuggestions,
  getListBlockedUser,
} from '../../repositories/client/friend.repo';
import { prismaMock } from '../setup';
import { FriendshipStatus } from '@prisma/client';

describe('friend.repo', () => {
  const myId = 'my-id-123';
  const friendId = 'friend-id-456';

  describe('getListFriend', () => {
    it('nên gọi raw SQL query lấy danh sách bạn bè', async () => {
      const mockFriends = [
        { id: friendId, name: 'Friend 1', email: 'friend@test.com', avatarUrl: null },
      ];

      prismaMock.$queryRaw.mockResolvedValue(mockFriends);

      const result = await getListFriend(myId);

      expect(prismaMock.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual(mockFriends);
    });
  });

  describe('updateFriendShipStatus', () => {
    it('nên cập nhật trạng thái bạn bè', async () => {
      prismaMock.friendship.update.mockResolvedValue({
        senderId: myId,
        receiverId: friendId,
        status: FriendshipStatus.ACCEPTED,
      } as any);

      const result = await updateFriendShipStatus(myId, friendId, FriendshipStatus.ACCEPTED);

      expect(prismaMock.friendship.update).toHaveBeenCalledWith({
        where: {
          senderId_receiverId: {
            senderId: myId,
            receiverId: friendId,
          },
        },
        data: {
          status: FriendshipStatus.ACCEPTED,
        },
      });
      expect(result.status).toBe(FriendshipStatus.ACCEPTED);
    });
  });

  describe('findFriendship', () => {
    it('nên tìm quan hệ bạn bè giữa 2 user', async () => {
      prismaMock.friendship.findFirst.mockResolvedValue({
        senderId: myId,
        receiverId: friendId,
        status: FriendshipStatus.PENDING,
      } as any);

      const result = await findFriendship(myId, friendId);

      expect(prismaMock.friendship.findFirst).toHaveBeenCalledWith({
        where: {
          senderId: myId,
          receiverId: friendId,
        },
      });
      expect(result?.status).toBe(FriendshipStatus.PENDING);
    });
  });

  describe('deleteRowFriendShip', () => {
    it('nên xóa quan hệ bạn bè', async () => {
      prismaMock.friendship.delete.mockResolvedValue({ senderId: myId, receiverId: friendId } as any);

      const result = await deleteRowFriendShip(myId, friendId);

      expect(prismaMock.friendship.delete).toHaveBeenCalledWith({
        where: {
          senderId_receiverId: {
            senderId: myId,
            receiverId: friendId,
          },
        },
      });
      expect(result.senderId).toBe(myId);
    });
  });

  describe('createFriendShip', () => {
    it('nên tạo quan hệ bạn bè mới', async () => {
      prismaMock.friendship.create.mockResolvedValue({
        senderId: myId,
        receiverId: friendId,
        status: FriendshipStatus.PENDING,
      } as any);

      const result = await createFriendShip(myId, friendId);

      expect(prismaMock.friendship.create).toHaveBeenCalledWith({
        data: {
          senderId: myId,
          receiverId: friendId,
        },
      });
      expect(result.status).toBe(FriendshipStatus.PENDING);
    });
  });

  describe('getRequestedFriend', () => {
    it('nên lấy các lời mời kết bạn đã nhận ở trạng thái PENDING', async () => {
      const mockFriendships = [
        {
          senderId: friendId,
          receiverId: myId,
          status: FriendshipStatus.PENDING,
          sender: { id: friendId, name: 'Friend', email: 'friend@mail.com', bio: null, avatarUrl: null },
        },
      ];

      prismaMock.friendship.findMany.mockResolvedValue(mockFriendships as any);

      const result = await getRequestedFriend(myId);

      expect(prismaMock.friendship.findMany).toHaveBeenCalledWith({
        where: {
          receiverId: myId,
          status: 'PENDING',
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              email: true,
              bio: true,
            },
          },
        },
      });
      expect(result).toEqual(mockFriendships);
    });
  });

  describe('getSentFriend', () => {
    it('nên lấy các lời mời kết bạn đã gửi ở trạng thái PENDING', async () => {
      const mockFriendships = [
        {
          senderId: myId,
          receiverId: friendId,
          status: FriendshipStatus.PENDING,
          receiver: { id: friendId, name: 'Friend', email: 'friend@mail.com', bio: null, avatarUrl: null },
        },
      ];

      prismaMock.friendship.findMany.mockResolvedValue(mockFriendships as any);

      const result = await getSentFriend(myId);

      expect(prismaMock.friendship.findMany).toHaveBeenCalledWith({
        where: {
          senderId: myId,
          status: 'PENDING',
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          receiver: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              email: true,
              bio: true,
            },
          },
        },
      });
      expect(result).toEqual(mockFriendships);
    });
  });

  describe('getSuggestFriend', () => {
    it('nên gọi raw SQL gợi ý kết bạn', async () => {
      const mockSuggestions = [{ id: 'user-x', name: 'User X', email: 'x@test.com', avatarUrl: null, bio: null }];

      prismaMock.$queryRaw.mockResolvedValue(mockSuggestions);

      const result = await getSuggestFriend(myId, 5);

      expect(prismaMock.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual(mockSuggestions);
    });
  });

  describe('getSearchSuggestions', () => {
    it('nên trả về mảng rỗng nếu keyword rỗng', async () => {
      const result = await getSearchSuggestions(myId, '   ');
      expect(result).toEqual([]);
      expect(prismaMock.user.findMany).not.toHaveBeenCalled();
    });

    it('nên tìm kiếm người dùng theo keyword và định dạng lại quan hệ bạn bè', async () => {
      const mockUsers = [
        {
          id: 'user-y',
          name: 'User Y',
          email: 'y@test.com',
          avatarUrl: null,
          bio: null,
          sentFriendships: [{ status: FriendshipStatus.ACCEPTED, senderId: 'user-y', receiverId: myId }],
          receivedFriendships: [],
        },
      ];

      prismaMock.user.findMany.mockResolvedValue(mockUsers as any);

      const result = await getSearchSuggestions(myId, 'User Y');

      expect(prismaMock.user.findMany).toHaveBeenCalled();
      expect(result).toEqual([
        {
          id: 'user-y',
          name: 'User Y',
          email: 'y@test.com',
          avatarUrl: null,
          bio: null,
          friendship: {
            status: FriendshipStatus.ACCEPTED,
            senderId: 'user-y',
            receiverId: myId,
          },
        },
      ]);
    });
  });

  describe('getListBlockedUser', () => {
    it('nên gọi raw SQL lấy danh sách user bị chặn', async () => {
      const mockBlocked = [{ id: 'blocked-id', name: 'Blocked User', email: 'b@test.com', avatarUrl: null, bio: null }];

      prismaMock.$queryRaw.mockResolvedValue(mockBlocked);

      const result = await getListBlockedUser(myId);

      expect(prismaMock.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual(mockBlocked);
    });
  });
});
