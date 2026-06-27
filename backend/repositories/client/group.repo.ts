import { GroupInvitation, GroupRole, InvitationStatus, InvitationType } from "@prisma/client"
import prisma from "../../config/prisma"
import { groupTypeData } from "../../types/client/group.types"

export const findGroupByKeyword = async (keyword: string, myId: string) => {
  return prisma.group.findMany({
    where: {
      OR: [
        { name: { contains: keyword, mode: "insensitive" } },
        { description: { contains: keyword, mode: "insensitive" } }
      ],
      visibility: {
        in: ["PUBLIC", "PRIVATE"] // INVITE is hidden, PRIVATE is visible but cannot be joined easily
      },
      isActive: true,
      isDeleted: false
    },
    include: {
      _count: {
        select: { members: true }
      },
      members: {
        where: { userId: myId },
        select: { role: true }
      },
      invitations: {
        where: { userId: myId, status: "PENDING" },
        select: { type: true, status: true }
      }
    }
  })
}

export const createGroup = async (data: groupTypeData, ownerId: string) => {
  return prisma.group.create({
    data: {
      name: data.name,
      avatarUrl: data.avatarUrl,
      coverUrl: data.coverUrl,
      description: data.description,
      visibility: data.visibility ?? "PUBLIC",
      members: {
        create: {
          userId: ownerId,
          role: "OWNER",
        }
      }
    },

  })
}
export const getMyListGroup = async (myId: string, keyword?: string) => {
  return prisma.group.findMany({
    where: {
      members: {
        some: {
          userId: myId
        }
      },
      isActive: true,
      isDeleted: false,
      ...(keyword ?
        {
          OR: [
            { name: { contains: keyword, mode: "insensitive" } },
            { description: { contains: keyword, mode: "insensitive" } }
          ]
        } : {})
    },
    include: {
      _count: {
        select: { members: true }
      },
      members: {
        where: { userId: myId },
        select: { role: true }
      }
    }
  })
}


export const findGroupById = async (groupId: string, myId?: string) => {
  return prisma.group.findFirst({
    where: {
      id: groupId,
      isDeleted: false,
      isActive: true
    },
    include: {
      _count: {
        select: { members: true }
      },
      ...(myId ? {
        members: {
          where: { userId: myId },
          select: { role: true }
        }
      } : {})
    }
  })
}


export const findGroupMember = async (groupId: string, userId: string) => {
  return prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId
      }
    }
  })
}

export const isGroupOwner = async (userId: string, groupId: string) => {
  const member = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        userId,
        groupId
      }
    }
  })
  return member?.role === "OWNER"
}



export const getGroupMembers = async (groupId: string) => {
  return prisma.groupMember.findMany({
    where: {
      groupId: groupId
    }, include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          email: true,
          isActive: true,
          bio: true
        }
      }
    }, orderBy: {
      joinedAt: "asc"
    }
  })
}

export const addMemberGroup = async (groupId: string, userId: string, role: GroupRole = "MEMBER", invitedBy?: string) => {
  return prisma.groupMember.create({
    data: {
      userId: userId,
      groupId: groupId,
      role,
      invitedBy
    }
  })
}

export const removeGroupMember = async (groupId: string, userId: string) => {
  return prisma.groupMember.delete({
    where: {
      groupId_userId: {
        userId: userId,
        groupId: groupId
      }
    }
  })
}


export const updateGroupInfo = async (data: groupTypeData, groupId: string) => {
  return prisma.group.update({
    where: {
      id: groupId
    }, data: data
  })
}

export const softDeleteGroup = async (groupId: string) => {
  return prisma.group.update({
    where: {
      id: groupId
    }, data: {
      isDeleted: true
    }
  })
}


export const changeRoleMember = async (groupId: string, userId: string, role: GroupRole) => {
  return prisma.groupMember.update({
    where: {
      groupId_userId: {
        groupId,
        userId
      }
    }, data: {
      role
    }
  })
}


export const findRequestPendingInvitation = async (groupId: string, myId: string) => {
  return prisma.groupInvitation.findFirst({
    where: {
      groupId,
      userId: myId,
      type: "REQUEST",
      status: "PENDING"
    }
  })
}

export const findInvitationByGroupAndUser = async (groupId: string, userId: string) => {
  return prisma.groupInvitation.findFirst({
    where: {
      groupId,
      userId
    }
  })
}

export const createInvitation = async (groupId: string, userId: string, inviteId?: string, type: InvitationType = "REQUEST", status: InvitationStatus = "PENDING") => {
  return prisma.groupInvitation.create({
    data: {
      groupId,
      userId: userId,
      type: type,
      status: status,
      invitedBy: inviteId
    }
  })
}

export const getInvitationByStatusAndType = async (groupId: string, type: InvitationType = "REQUEST", status: InvitationStatus = "PENDING") => {
  return prisma.groupInvitation.findMany({
    where: {
      groupId: groupId,
      status,
      type
    },
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
  })
}

export const getInvitationByInviteId  = async(groupId: string,inviteId:string)=>{
  return prisma.groupInvitation.findFirst({
    where: {
      groupId:groupId,
      id: inviteId
    }
  }
  )
}

export const updateStatusInvitation = async(groupId: string, invitationId: string, status:InvitationStatus="ACCEPTED")=>{
  return prisma.groupInvitation.update({
    where:{
      id: invitationId
    },
    data:{
      status: status
    }
  })
}

export const upsertInvitation = async (groupId: string, userId: string, inviteId?: string, type: InvitationType = "REQUEST", status: InvitationStatus = "PENDING") => {
  return prisma.groupInvitation.upsert({
    where: {
      groupId_userId: {
        groupId,
        userId
      }
    },
    create: {
      groupId,
      userId,
      type,
      status,
      invitedBy: inviteId
    },
    update: {
      type,
      status,
      invitedBy: inviteId
    }
  })
}

export const getListInviteReceived = async(userId:string)=>{
  return prisma.groupInvitation.findMany({
    where:{
      userId:userId,
      type:"INVITE",
      status:"PENDING"
    },include:{
      group:{
        select:{
          id: true,
          avatarUrl:true,
          name: true,
          description: true,
        }
      },
      sender: {
        select: {
          id: true,
          name: true,
          avatarUrl: true
        }
      }
    }
  })
}

export const findInvitationById = async(id: string)=>{
  return prisma.groupInvitation.findFirst({
    where:{
      id
    }
  })
}

export const createMemberAndChangeStatus = async(groupId: string,myId: string,invitationId: string)=>{
  return prisma.$transaction([
    prisma.groupMember.create({
      data:{
        groupId,
        userId:myId,
        role:"MEMBER"
      }
    }),
    prisma.groupInvitation.update({
      where:{
        id: invitationId
      },
      data:{
        status:"ACCEPTED"
      }
    })
  ])
}

export const changeOwner = async(groupId: string,myId: string, newOwerId: string)=>{
  return prisma.$transaction([
    prisma.groupMember.update({
      where:{
        groupId_userId:{
          groupId,
          userId: myId
        }
      },
      data:{
        role:"MEMBER"
      }
    }),
    prisma.groupMember.update({
      where:{
        groupId_userId:{
          groupId,
          userId: newOwerId
        }
      },
      data:{
        role:"OWNER"
      }
    })
  ])
}
