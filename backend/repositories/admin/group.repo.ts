import prisma from "../../config/prisma";

export interface GroupFilters {
  search?: string;
  isActive?: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export const findGroups = async (
  filters: GroupFilters,
  pagination: PaginationParams
) => {
  const { search, isActive } = filters;
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const where: any = {
    isDeleted: false
  };

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  const [groups, total] = await Promise.all([
    prisma.group.findMany({
      where,
      include: {
        _count: {
          select: {
            members: true,
            documents: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc"
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
    include: {
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
      _count: {
        select: {
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
