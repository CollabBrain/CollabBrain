export interface User {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  bio?: string | null;
  status?: string | null;
  friendshipStatus?: "PENDING" | "ACCEPTED" | "BLOCKED" | null;
  isSender?: boolean;
  createdAt?: string;
  friendsCount?: number;
  publicDecks?: Array<{
    id: string;
    name: string;
    description: string | null;
    color: string;
    icon: string | null;
    createdAt: string;
    _count: { cards: number };
  }>;
  joinedGroups?: Array<{
    id: string;
    name: string;
    description: string | null;
    avatarUrl: string | null;
    coverUrl: string | null;
    visibility: string;
    _count: { members: number };
    role: string;
  }>;
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
