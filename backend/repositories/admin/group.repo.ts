import prisma from "../../config/prisma";

export interface GroupFilters {
  search?: string;
  isActive?: boolean;
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
  const { search, isActive, isPublic, sortBy = "createdAt", order = "desc" } = filters;
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const where: any = {
    isDeleted: false
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } }
    ];
  }

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
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
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            posts: true,
            members: true,
            documents: true
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
  return prisma.group.findFirst({
    where: {
      id,
      isDeleted: false
    },
    select: {
      id: true,
      name: true,
      description: true,
      isPublic: true,
      isActive: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true
            }
          }
        }
      },
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
          members: true,
          documents: true
        }
      }
    }
  });
};

export const toggleGroupStatus = async (id: string, isActive: boolean) => {
  return prisma.group.update({
    where: { id },
    data: { isActive },
    select: {
      id: true,
      name: true,
      isActive: true
    }
  });
};

export const deleteGroup = async (id: string) => {
  return prisma.group.update({
    where: { id },
    data: { isDeleted: true },
    select: {
      id: true,
      name: true,
      isDeleted: true
    }
  });
};
