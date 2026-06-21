import prisma from "../../config/prisma";

export interface UserFilters {
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  order?: "asc" | "desc";
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export const findUsers = async (
  filters: UserFilters,
  pagination: PaginationParams
) => {
  const { search, isActive, sortBy = "createdAt", order = "desc" } = filters;
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const where: any = {
    isDeleted: false
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } }
    ];
  }

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        bio: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      skip,
      take: limit,
      orderBy: {
        [sortBy]: order
      }
    }),
    prisma.user.count({ where })
  ]);

  return { users, total };
};

export const findUserById = async (id: string) => {
  return prisma.user.findFirst({
    where: {
      id,
      isDeleted: false
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      bio: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });
};

export const countUsers = async (filters: UserFilters) => {
  const { search, isActive } = filters;

  const where: any = {
    isDeleted: false
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } }
    ];
  }

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  return prisma.user.count({ where });
};

export const updateUser = async (id: string, data: { name?: string; avatarUrl?: string; bio?: string }) => {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      bio: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });
};

export const deleteUser = async (id: string) => {
  return prisma.user.update({
    where: { id },
    data: { isDeleted: true },
    select: {
      id: true,
      email: true,
      name: true,
      isDeleted: true
    }
  });
};

export const toggleUserStatus = async (id: string, isActive: boolean) => {
  return prisma.user.update({
    where: { id },
    data: { isActive },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true
    }
  });
};
