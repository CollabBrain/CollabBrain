import prisma from "../../config/prisma";

export const findTodosByUserId = async (userId: string) => {
  return prisma.todo.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
};

export const findTodoById = async (id: string) => {
  return prisma.todo.findUnique({
    where: { id }
  });
};

export const createTodo = async (data: {
  userId: string;
  title: string;
  description?: string;
  dueDate?: Date | null;
  isNotify?: boolean;
  attachments?: string | null;
}) => {
  return prisma.todo.create({
    data
  });
};

export const updateTodo = async (
  id: string,
  data: {
    title?: string;
    description?: string;
    dueDate?: Date | null;
    isCompleted?: boolean;
    isNotify?: boolean;
    attachments?: string | null;
  }
) => {
  return prisma.todo.update({
    where: { id },
    data
  });
};

export const deleteTodo = async (id: string) => {
  return prisma.todo.delete({
    where: { id }
  });
};
