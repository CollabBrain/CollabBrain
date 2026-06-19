import * as groupRepo from "../../repositories/admin/group.repo";

export interface GetGroupsQuery {
  page?: number;
  limit?: number;
  search?: string;
  isPublic?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}

export const getGroups = async (query: GetGroupsQuery) => {
  const page = Math.max(1, parseInt(String(query.page || 1)));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || 10))));
  const search = query.search || "";
  const isPublic = query.isPublic === undefined ? undefined : query.isPublic === "true";
  const sortBy = (query.sortBy as string) || "createdAt";
  const order = query.order === "asc" ? "asc" : "desc";

  const { groups, total } = await groupRepo.findGroups(
    { search, isPublic, sortBy, order },
    { page, limit }
  );

  const groupsWithStats = groups.map(group => ({
    ...group,
    postCount: group._count.posts,
    memberCount: group._count.members,
    _count: undefined
  }));

  return {
    data: groupsWithStats,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getGroupById = async (id: string) => {
  const group = await groupRepo.findGroupById(id);
  if (!group) {
    throw new Error("Nhóm không tồn tại");
  }

  return {
    ...group,
    postCount: group._count.posts,
    memberCount: group._count.members,
    recentPosts: group.posts,
    posts: undefined,
    _count: undefined
  };
};

export const deleteGroup = async (id: string) => {
  const existingGroup = await groupRepo.findGroupById(id);
  if (!existingGroup) {
    throw new Error("Nhóm không tồn tại");
  }

  return await groupRepo.deleteGroup(id);
};
