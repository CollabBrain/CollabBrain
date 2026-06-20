import * as groupRepo from "../../repositories/admin/group.repo";

export interface GetGroupsQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: string;
}

export const getGroups = async (query: GetGroupsQuery) => {
  const page = Math.max(1, parseInt(String(query.page || 1)));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || 10))));
  const search = query.search || "";
  const isActive = query.isActive === undefined ? undefined : query.isActive === "true";

  const { groups, total } = await groupRepo.findGroups(
    { search, isActive },
    { page, limit }
  );

  return {
    data: groups.map(g => ({
      id: g.id,
      name: g.name,
      description: g.description,
      avatarUrl: g.avatarUrl,
      visibility: g.visibility,
      isActive: g.isActive,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      memberCount: g._count.members,
      documentCount: g._count.documents
    })),
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
  return group;
};

export const toggleGroupStatus = async (id: string) => {
  const existingGroup = await groupRepo.findGroupById(id);
  if (!existingGroup) {
    throw new Error("Nhóm không tồn tại");
  }

  const newStatus = !existingGroup.isActive;
  return await groupRepo.toggleGroupStatus(id, newStatus);
};

export const deleteGroup = async (id: string) => {
  const existingGroup = await groupRepo.findGroupById(id);
  if (!existingGroup) {
    throw new Error("Nhóm không tồn tại");
  }

  return await groupRepo.deleteGroup(id);
};
