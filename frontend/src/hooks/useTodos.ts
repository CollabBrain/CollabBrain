import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../services/axiosInstance";

export interface TodoAttachment {
  name: string;
  url: string;
}

export interface TodoItem {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  isCompleted: boolean;
  isNotify: boolean;
  attachments: string | null; // JSON string of TodoAttachment[]
  createdAt: string;
  updatedAt: string;
}

interface BackendResponse<T> {
  code: number;
  data: T;
  message: string;
}

export const parseTodoAttachments = (attachments: string | null): TodoAttachment[] => {
  if (!attachments) return [];
  try {
    return JSON.parse(attachments) as TodoAttachment[];
  } catch {
    return [];
  }
};

export const useTodos = () => {
  return useQuery<TodoItem[]>({
    queryKey: ["todos"],
    queryFn: async () => {
      const response = await axiosInstance.get<BackendResponse<TodoItem[]>>("/todos");
      return response.data.data;
    }
  });
};

export const useCreateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      dueDate?: string | null;
      isNotify?: boolean;
      attachments?: string | null;
    }) => {
      const response = await axiosInstance.post<BackendResponse<TodoItem>>("/todos", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    }
  });
};

export const useUpdateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      title?: string;
      description?: string | null;
      dueDate?: string | null;
      isCompleted?: boolean;
      isNotify?: boolean;
      attachments?: string | null;
    }) => {
      const response = await axiosInstance.patch<BackendResponse<TodoItem>>(`/todos/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    }
  });
};

export const useDeleteTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.delete<BackendResponse<void>>(`/todos/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    }
  });
};
