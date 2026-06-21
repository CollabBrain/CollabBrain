import * as userRepo from "../../repositories/admin/user.repo";

export interface GetUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}

export interface UpdateUserData {
  name?: string;
  avatarUrl?: string;
  bio?: string;
}

export const getUsers = async (query: GetUsersQuery) => {
  const page = Math.max(1, parseInt(String(query.page || 1)));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || 10))));
  const search = query.search || "";
  const isActive = query.isActive === undefined ? undefined : query.isActive === "true";
  const sortBy = (query.sortBy as string) || "createdAt";
  const order = query.order === "asc" ? "asc" : "desc";

  const { users, total } = await userRepo.findUsers(
    { search, isActive, sortBy, order },
    { page, limit }
  );

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getUserById = async (id: string) => {
  const user = await userRepo.findUserById(id);
  if (!user) {
    throw new Error("Người dùng không tồn tại");
  }
  return user;
};

export const updateUser = async (id: string, data: UpdateUserData) => {
  const existingUser = await userRepo.findUserById(id);
  if (!existingUser) {
    throw new Error("Người dùng không tồn tại");
  }

  const updatedUser = await userRepo.updateUser(id, data);
  return updatedUser;
};

export const deleteUser = async (id: string) => {
  const existingUser = await userRepo.findUserById(id);
  if (!existingUser) {
    throw new Error("Người dùng không tồn tại");
  }

  return await userRepo.deleteUser(id);
};

export const toggleUserStatus = async (id: string) => {
  const existingUser = await userRepo.findUserById(id);
  if (!existingUser) {
    throw new Error("Người dùng không tồn tại");
  }

  const newStatus = !existingUser.isActive;
  return await userRepo.toggleUserStatus(id, newStatus);
};
