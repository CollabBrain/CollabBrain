import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../services/axiosInstance";

// =======================
// Types — match backend response shapes
// =======================

/** Bạn bè đã ACCEPTED (from getListFriend raw query) */
export interface FriendUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
}

/** Lời mời kết bạn (from getRequestedFriend/getSentFriend) */
export interface FriendRequestItem {
  senderId: string;
  receiverId: string;
  status: "PENDING" | "ACCEPTED" | "BLOCKED";
  createdAt: string;
  updatedAt: string;
  sender?: FriendUser;
  receiver?: FriendUser;
}

/** Gợi ý kết bạn (from getSuggestFriend raw query) */
export interface FriendSuggestionItem {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
}

/** Kết quả tìm kiếm người lạ để kết bạn */
export interface SearchStrangerItem {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  friendship: {
    status: "PENDING" | "ACCEPTED" | "BLOCKED";
    senderId: string;
    receiverId: string;
  } | null;
}

// Backend API response wrapper
interface BackendResponse<T> {
  code: number;
  data: T;
  message: string;
}

// =======================
// Helper — backend routes are mounted at /friends/* 
// and axiosInstance baseURL is /user, so we need to use absolute paths
// Since baseURL = "http://localhost:3000/user", we need ../friends/
// OR better: create requests with full URL override
// =======================

// The axiosInstance has baseURL = API_BASE_URL = "http://localhost:3000/user"
// Backend mounts friend routes at "/friends/*" (no /user prefix)
// So we need to call the API with the correct path relative to the server root
const FRIENDS_BASE = import.meta.env.VITE_API_BASE_URL_ROOT || 'http://localhost:3000';

const friendApi = {
  getList: (keyword?: string) => {
    const params = keyword ? { keyword } : {};
    return axiosInstance.get<BackendResponse<FriendUser[]>>(`${FRIENDS_BASE}/friends/list`, { params });
  },
  getRequestsReceived: () =>
    axiosInstance.get<BackendResponse<FriendRequestItem[]>>(`${FRIENDS_BASE}/friends/requests/receive`),
  getRequestsSent: () =>
    axiosInstance.get<BackendResponse<FriendRequestItem[]>>(`${FRIENDS_BASE}/friends/requests/sent`),
  getSuggestions: () =>
    axiosInstance.get<BackendResponse<FriendSuggestionItem[]>>(`${FRIENDS_BASE}/friends/suggestions`),
  acceptRequest: (userId: string) =>
    axiosInstance.patch(`${FRIENDS_BASE}/friends/accept/${userId}`),
  rejectRequest: (userId: string) =>
    axiosInstance.delete(`${FRIENDS_BASE}/friends/reject/${userId}`),
  sendRequest: (userId: string) =>
    axiosInstance.post(`${FRIENDS_BASE}/friends/request/${userId}`),
  unfriend: (userId: string) =>
    axiosInstance.delete(`${FRIENDS_BASE}/friends/unfriend/${userId}`),
  unrequest: (userId: string) =>
    axiosInstance.delete(`${FRIENDS_BASE}/friends/unrequest/${userId}`),
  block: (userId: string) =>
    axiosInstance.patch(`${FRIENDS_BASE}/friends/block/${userId}`),
  unblock: (userId: string) =>
    axiosInstance.patch(`${FRIENDS_BASE}/friends/unblock/${userId}`),
  getBlocked: () =>
    axiosInstance.get<BackendResponse<FriendUser[]>>(`${FRIENDS_BASE}/friends/blocked`),
};

// =======================
// Queries
// =======================

export const useFriends = (keyword?: string) => {
  return useQuery({
    queryKey: ['friends', keyword ?? ''],
    queryFn: async (): Promise<FriendUser[]> => {
      const response = await friendApi.getList(keyword);
      return response.data.data ?? [];
    },
  });
};

export const useFriendRequests = (type: 'received' | 'sent') => {
  return useQuery({
    queryKey: ['friend-requests', type],
    queryFn: async (): Promise<FriendRequestItem[]> => {
      const response = type === 'received'
        ? await friendApi.getRequestsReceived()
        : await friendApi.getRequestsSent();
      return response.data.data ?? [];
    },
  });
};

export const useFriendSuggestions = () => {
  return useQuery({
    queryKey: ['friend-suggestions'],
    queryFn: async (): Promise<FriendSuggestionItem[]> => {
      const response = await friendApi.getSuggestions();
      return response.data.data ?? [];
    },
  });
};

export const useBlockList = () => {
  return useQuery({
    queryKey: ['blocked-users'],
    queryFn: async (): Promise<FriendUser[]> => {
      const response = await friendApi.getBlocked();
      return response.data.data ?? [];
    },
  });
};

// =======================
// Mutations
// =======================

export const useAcceptRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => friendApi.acceptRequest(userId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests', 'received'] });
      queryClient.invalidateQueries({ queryKey: ['search-strangers'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};

export const useRejectRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => friendApi.rejectRequest(userId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests', 'received'] });
      queryClient.invalidateQueries({ queryKey: ['search-strangers'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};

export const useSendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => friendApi.sendRequest(userId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests', 'sent'] });
      queryClient.invalidateQueries({ queryKey: ['search-strangers'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};

export const useUnrequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => friendApi.unrequest(userId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests', 'sent'] });
      queryClient.invalidateQueries({ queryKey: ['search-strangers'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};

export const useUnfriend = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => friendApi.unfriend(userId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['search-strangers'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};

export const useBlockUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => friendApi.block(userId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};

export const useSearchStrangers = (keyword: string) => {
  return useQuery({
    queryKey: ['search-strangers', keyword],
    enabled: keyword.trim().length >= 2,
    queryFn: async (): Promise<SearchStrangerItem[]> => {
      const response = await friendApi.getList(keyword);
      return (response.data.data as any) ?? [];
    },
  });
};
