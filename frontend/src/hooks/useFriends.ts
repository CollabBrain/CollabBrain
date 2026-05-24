import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";
import type { User, FriendRequest, FriendSuggestion } from "../types/friend";

// Define the response shape as per API contract
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: any;
}

// =======================
// Queries
// =======================

export const useFriends = () => {
  return useQuery({
    queryKey: ['friends'],
    queryFn: async (): Promise<User[]> => {
      const response = await axiosInstance.get<any, ApiResponse<User[]>>('/friends/list');
      return response.data;
    },
  });
};

export const useFriendRequests = (type: 'received' | 'sent') => {
  return useQuery({
    queryKey: ['friend-requests', type],
    queryFn: async (): Promise<FriendRequest[]> => {
      const response = await axiosInstance.get<any, ApiResponse<FriendRequest[]>>(`/friends/requests/${type}`);
      return response.data;
    },
  });
};

export const useFriendSuggestions = () => {
  return useQuery({
    queryKey: ['friend-suggestions'],
    queryFn: async (): Promise<FriendSuggestion[]> => {
      const response = await axiosInstance.get<any, ApiResponse<FriendSuggestion[]>>('/friends/suggest');
      return response.data;
    },
  });
};

export const useBlockList = () => {
  return useQuery({
    queryKey: ['blocked-users'],
    queryFn: async (): Promise<User[]> => {
      const response = await axiosInstance.get<any, ApiResponse<User[]>>('/friends/blocked');
      return response.data;
    },
  });
};

// =======================
// Mutations (with Optimistic Updates)
// =======================

export const useSendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await axiosInstance.post<any, ApiResponse<any>>('/friends/request', { userId });
      return response.data;
    },
    // Optimistic Update example
    onMutate: async (userId) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['friend-suggestions'] });

      // Snapshot the previous value
      const previousSuggestions = queryClient.getQueryData<FriendSuggestion[]>(['friend-suggestions']);

      // Optimistically update to the new value (remove the suggested user from the list)
      if (previousSuggestions) {
        queryClient.setQueryData<FriendSuggestion[]>(
          ['friend-suggestions'],
          previousSuggestions.filter((s) => s.user.id !== userId)
        );
      }

      // Return a context object with the snapshotted value
      return { previousSuggestions };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, _userId, context) => {
      if (context?.previousSuggestions) {
        queryClient.setQueryData(['friend-suggestions'], context.previousSuggestions);
      }
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests', 'sent'] });
      queryClient.invalidateQueries({ queryKey: ['friend-suggestions'] });
    },
  });
};

export const useAcceptRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await axiosInstance.put<any, ApiResponse<any>>(`/friends/accept`, { requestId });
      return response.data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests', 'received'] });
    },
  });
};

export const useRejectRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await axiosInstance.put<any, ApiResponse<any>>(`/friends/reject`, { requestId });
      return response.data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests', 'received'] });
    },
  });
};

export const useUnfriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await axiosInstance.delete<any, ApiResponse<any>>(`/friends/${userId}`);
      return response.data;
    },
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ['friends'] });
      const previousFriends = queryClient.getQueryData<User[]>(['friends']);
      
      if (previousFriends) {
        queryClient.setQueryData<User[]>(
          ['friends'],
          previousFriends.filter((friend) => friend.id !== userId)
        );
      }
      return { previousFriends };
    },
    onError: (_err, _userId, context) => {
      if (context?.previousFriends) {
        queryClient.setQueryData(['friends'], context.previousFriends);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
};

export const useBlockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await axiosInstance.post<any, ApiResponse<any>>(`/friends/block`, { userId });
      return response.data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      queryClient.invalidateQueries({ queryKey: ['friend-suggestions'] });
    },
  });
};
