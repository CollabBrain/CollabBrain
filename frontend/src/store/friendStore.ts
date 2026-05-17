import { create } from "zustand";
import type { User } from "../types/friend";

interface FriendStoreState {
  friendsList: User[];
  pendingRequestsCount: number;
  setFriendsList: (friends: User[]) => void;
  setPendingRequestsCount: (count: number) => void;
  incrementPendingRequests: () => void;
  decrementPendingRequests: () => void;
  removeFriend: (userId: string) => void;
}

export const useFriendStore = create<FriendStoreState>((set) => ({
  friendsList: [],
  pendingRequestsCount: 0,
  
  setFriendsList: (friends) => set({ friendsList: friends }),
  
  setPendingRequestsCount: (count) => set({ pendingRequestsCount: count }),
  
  incrementPendingRequests: () => 
    set((state) => ({ pendingRequestsCount: state.pendingRequestsCount + 1 })),
    
  decrementPendingRequests: () => 
    set((state) => ({ pendingRequestsCount: Math.max(0, state.pendingRequestsCount - 1) })),
    
  removeFriend: (userId) => 
    set((state) => ({ 
      friendsList: state.friendsList.filter(f => f.id !== userId) 
    })),
}));
