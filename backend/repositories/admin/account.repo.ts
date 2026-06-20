import prisma from "../../config/prisma";

export interface AccountFilters {
  search?: string;
  role?: string;
  isActive?: boolean;
  sortBy?: string;
  order?: "asc" | "desc";
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export const findAccounts = async (
  filters: AccountFilters,
  pagination: PaginationParams
) => {
  const { search, role, isActive, sortBy = "createdAt", order = "desc" } = filters;
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const where: any = {
    isDeleted: false
  };

  if (search) {
    where.OR = [
      { username: { contains: search, mode: "insensitive" } }
    ];
  }

  if (role) {
    where.role = role;
  }

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  const [accounts, total] = await Promise.all([
    prisma.account.findMany({
      where,
      select: {
        id: true,
        username: true,
        role: true,
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
    prisma.account.count({ where })
  ]);

  return { accounts, total };
};

export const findAccountById = async (id: string) => {
  return prisma.account.findFirst({
    where: {
      id,
      isDeleted: false
    },
    select: {
      id: true,
      username: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });
};

export const countAccounts = async (filters: AccountFilters) => {
  const { search, role, isActive } = filters;

  const where: any = {
    isDeleted: false
  };

  if (search) {
    where.OR = [
      { username: { contains: search, mode: "insensitive" } }
    ];
  }

  if (role) {
    where.role = role;
  }

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  return prisma.account.count({ where });
};

export const updateAccount = async (
  id: string,
  data: { username?: string; role?: string }
) => {
  return prisma.account.update({
    where: { id },
    data,
    select: {
      id: true,
      username: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });
};

export const deleteAccount = async (id: string) => {
  return prisma.account.update({
    where: { id },
    data: { isDeleted: true },
    select: {
      id: true,
      username: true,
      role: true,
      isDeleted: true
    }
  });
};

export const createAccount = async (data: {
  username: string;
  passwordHash: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
}) => {
  return prisma.account.create({
    data: {
      username: data.username,
      passwordHash: data.passwordHash,
      role: data.role
    },
    select: {
      id: true,
      username: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });
};

export const toggleAccountStatus = async (id: string, isActive: boolean) => {
  return prisma.account.update({
    where: { id },
    data: { isActive },
    select: {
      id: true,
      username: true,
      role: true,
      isActive: true
    }
  });
};
