import prisma from "../../config/prisma";

export interface GroupFilters {
  search?: string;
  isPublic?: boolean;
  sortBy?: string;
  order?: "asc" | "desc";
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export const findGroups = async (
  filters: GroupFilters,
  pagination: PaginationParams
) => {
  const { search, isPublic, sortBy = "createdAt", order = "desc" } = filters;
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } }
    ];
  }

  if (typeof isPublic === "boolean") {
    where.isPublic = isPublic;
  }

  const [groups, total] = await Promise.all([
    prisma.group.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            posts: true,
            members: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: {
        [sortBy]: order
      }
    }),
    prisma.group.count({ where })
  ]);

  return { groups, total };
};

export const findGroupById = async (id: string) => {
  return prisma.group.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      isPublic: true,
      createdAt: true,
      updatedAt: true,
      posts: {
        select: {
          id: true,
          content: true,
          createdAt: true
        },
        take: 5,
        orderBy: { createdAt: "desc" }
      },
      _count: {
        select: {
          posts: true,
          members: true
        }
      }
    }
  });
};

export const deleteGroup = async (id: string) => {
  return prisma.group.delete({
    where: { id },
    select: {
      id: true,
      name: true,
      deletedAt: true
    }
  });
};

export const countGroups = async (filters: GroupFilters) => {
  const { search, isPublic } = filters;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } }
    ];
  }

  if (typeof isPublic === "boolean") {
    where.isPublic = isPublic;
  }

  return prisma.group.count({ where });
};
