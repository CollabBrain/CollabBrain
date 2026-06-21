/** User object — matches backend getListFriend / getSuggestFriend raw SQL output */
export interface User {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  status?: "online" | "offline" | "busy";
  friendshipStatus?: "PENDING" | "ACCEPTED" | "BLOCKED" | null;
  isSender?: boolean;
}

/** Friend request — matches backend getRequestedFriend / getSentFriend Prisma output */
export interface FriendRequest {
  id: string; // composite key, use senderId for actions
  senderId: string;
  receiverId: string;
  sender: User;
  receiver: User;
  status: "pending" | "accepted" | "rejected" | "PENDING" | "ACCEPTED" | "BLOCKED";
  createdAt: string;
  updatedAt?: string;
}

/** Friend suggestion — matches backend getSuggestFriend raw SQL output */
export interface FriendSuggestion {
  id: string;
  user: User;
  mutualFriendsCount: number;
}
