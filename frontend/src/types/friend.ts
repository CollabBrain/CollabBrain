export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  status?: "online" | "offline" | "busy";
}

export interface FriendRequest {
  id: string;
  sender: User;
  receiver: User;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface FriendSuggestion {
  id: string; // The user's ID
  user: User;
  mutualFriendsCount: number;
}
