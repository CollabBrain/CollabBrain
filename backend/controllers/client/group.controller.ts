import { Request, Response } from "express"
import { groupTypeData } from "../../types/client/group.types"
import { acceptInvitationPatchService, acceptMemberPatchService, addMemberPostService, changeRoleUserPatchService, creatGroupPostService, deleteMemberDeleteService, findGroupGetService, groupInfoGetService, inviteMemberPostService, joinRequestPostService, leaveGroupPostService, listInvitationGetService, listRequestGetService, memberGroupGetService, myGroupGetService, rejectInvitationPatchService, rejectMemberPatchService, removeGroupDeleteService, transferOwnerPatchService, updateGroupPatchService } from "../../services/client/group.service"
import { GroupRole } from "@prisma/client"

//[POST] /groups
export const createGroupPost = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    let dataGroup: groupTypeData = {
      name: req.body.name,
      avatarUrl: req.body.avatarUrl,
      coverUrl: req.body.coverUrl,
      description: req.body.description,
      visibility: req.body.visibility
    }
    const result = await creatGroupPostService(dataGroup, userId);
    res.status(200).json({
      code: 200,
      message: result.message,
      data: result.data
    })
  } catch (error: any) {
    res.status(400).json({
      message: `Lỗi: ${error.message}`
    })
  }
}


//[GET] /groups/list
export const myGroupGet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const keyword = req.query.keyword as string
    const result = await myGroupGetService(userId, keyword)
    res.status(200).json({
      code: 200,
      message: result.message,
      data: result.data
    })
  } catch (error: any) {
    res.status(400).json({
      message: `Lỗi: ${error.message}`
    })
  }
}

//[GET] /groups/search
export const findGroupGet = async (req: Request, res: Response) => {
  try {
    const keyword = req.query.keyword as string || ""
    const result = await findGroupGetService(keyword)
    res.status(200).json({
      code: 200,
      message: result.message,
      data: result.data
    })
  } catch (error: any) {
    res.status(400).json({
      message: `Lỗi: ${error.message}`
    })
  }
}


//[GET] /groups/:groupId
export const groupInfoGet = async (req: Request, res: Response) => {
  try {
    const id = req.params.groupId as string;
    const myId = (req as any).user.id
    const result = await groupInfoGetService(id, myId);
    res.status(200).json({
      code: 200,
      data: result.data,
      message: result.message
    })
  } catch (error: any) {
    res.status(400).json({
      message: `Lỗi ${error.message}`
    })
  }
}

//[GET] /groups/:groupId/members
export const memberGroupGet = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.groupId as string;
    const myId = (req as any).user.id
    const result = await memberGroupGetService(groupId, myId)
    res.status(200).json({
      code: 200,
      message: result.message,
      data: result.data
    })
  } catch (error: any) {
    res.status(400).json({
      message: `Lỗi: ${error.message}`
    }
    )
  }
}

//[POST] /groups/:groupId/members
export const addMemberPost = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.groupId as string;
    const myId = (req as any).user.id
    const userId = req.body.userId as string
    const result = await addMemberPostService(groupId, myId, userId)
    res.status(200).json({
      data: result.data,
      message: result.message,
      code: 200
    })
  } catch (error: any) {
    res.status(400).json({
      message: `Lỗi: ${error.message}`
    })
  }
}

//[DELETE] /groups/:groupId/members
export const deleteMemberDelete = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.groupId as string;
    const myId = (req as any).user.id
    const userId = req.params.userId as string
    const result = await deleteMemberDeleteService(groupId, myId, userId)
    res.status(200).json({
      data: result.data,
      message: result.message,
      code: 200
    })
  } catch (error: any) {
    res.status(400).json({
      message: `Lỗi: ${error.message}`
    })
  }
}

// [POST] /groups/:groupId/leave
export const leaveGroupPost = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.groupId as string;
    const myId = (req as any).user.id
    const result = await leaveGroupPostService(groupId, myId)
    res.status(200).json({
      data: result.data,
      message: result.message,
      code: 200
    })
  } catch (error: any) {
    res.status(400).json({
      message: `Lỗi: ${error.message}`
    })
  }
}


//[PATCH] /groups/:groupId
export const updateGroupPatch = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.groupId as string
    const data: groupTypeData = {
      name: req.body.name,
      avatarUrl: req.body.avatarUrl,
      coverUrl: req.body.coverUrl,
      description: req.body.description,
      visibility: req.body.visibility
    }
    const myId = (req as any).user.id
    const result = await updateGroupPatchService(groupId, data, myId);
    res.status(200).json({
      data: result.data,
      message: result.message,
      code: 200
    })
  } catch (error: any) {
    res.status(400).json({
      message: `Lỗi: ${error.message}`
    })
  }
}

//[DELETE] /groups/:groupId
export const removeGroupDelete = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.groupId as string
    const myId = (req as any).user.id
    const result = await removeGroupDeleteService(groupId, myId)
    res.status(200).json({
      data: result.data,
      message: result.message,
      code: 200
    })
  } catch (error: any) {
    res.status(400).json({
      message: `Lỗi: ${error.message}`
    })
  }

}

//[PATCH] /groups/:groupId/members/:userId/role
export const changeRoleUserPatch = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.groupId as string;
    const myId = (req as any).user.id
    const userId = req.params.userId as string
    const role: GroupRole = req.body.role
    const result = await changeRoleUserPatchService(groupId, myId, userId, role)
    res.status(200).json({
      data: result.data,
      message: result.message,
      code: 200
    })
  } catch (error: any) {
    res.status(400).json({
      message: `Lỗi: ${error.message}`
    })
  }
}

//[POST] /:groupId/join-request
export const joinRequestPost = async (req: Request, res: Response) => {
  try {
    const groupId: string = req.params.groupId as string
    const myId = (req as any).user.id
    const result = await joinRequestPostService(groupId, myId)
    res.status(200).json({
      data: result.data,
      message: result.message,
      code: 200
    })
  } catch (error: any) {
    res.status(400).json({
      message: `Lỗi: ${error.message}`
    })
  }
}
//[GET] /groups/:groupId/join-requests
export const listRequestGet = async (req: Request, res: Response) => {
  try {
    const myId = (req as any).user.id
    const groupId = req.params.groupId as string
    const result = await listRequestGetService(groupId, myId)
    res.status(200).json({
      data: result.data,
      message: result.message,
      code: 200
    })
  } catch (error: any) {
    res.status(400).json({
      message: `Lỗi: ${error.message}`
    })
  }
}
//[PATCH] /groups/invitations/:invitationId/accept
export const acceptMemberPatch = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.groupId as string;
    const invitationId = req.params.invitationId as string;
    const myId = (req as any).user.id
    const result = await acceptMemberPatchService(groupId, myId, invitationId);
    res.status(200).json({
      data: result.data,
      message: result.message,
      code: 200
    })
  } catch (error: any) {
    res.status(400).json({
      message: `Lỗi: ${error.message}`
    })
  }
}


//[PATCH] /groups/invitations/:invitationId/reject
export const rejectMemberPatch = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.groupId as string;
    const invitationId = req.params.invitationId as string;
    const myId = (req as any).user.id
    const result = await rejectMemberPatchService(groupId, myId, invitationId)
    res.status(200).json({
      data: result.data,
      message: result.message,
      code: 200
    })
  } catch (error: any) {
    res.status(400).json({
      message: `Lỗi: ${error.message}`
    })
  }
}
//[POST] /groups/:groupId/invitations
export const inviteMemberPost = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.groupId as string
    const userId = req.body.userId;
    const myId = (req as any).user.id;
    const result = await inviteMemberPostService(groupId, userId, myId)
    res.status(200).json({
      data: result.data,
      message: result.message,
      code: 200
    })
  } catch (error: any) {
    res.status(400).json({
      message: `Lỗi: ${error.message}`
    })
  }
}

//[GET] /groups/invitations/received
export const listInvitationGet = async (req: Request, res: Response) => {
  try {
    const myId = (req as any).user.id;
    const result = await listInvitationGetService(myId)
    res.status(200).json({
      data: result.data,
      message: result.message,
      code: 200
    })
  } catch (error: any) {
    res.status(400).json({
      message: `Lỗi: ${error.message}`
    })
  }
}

//[PATCH] /groups/invitations/:invitationId/accept
export const acceptInvitationPatch = async (req: Request, res: Response) => {
  try {
    const invitationId = req.params.invitationId as string
    const myId = (req as any).user.id
    const result = await acceptInvitationPatchService(invitationId, myId)
    res.status(200).json({
      data: result.data,
      message: result.message,
      code: 200
    })
  } catch (error: any) {
    res.status(400).json({
      message: `Lỗi: ${error.message}`
    })
  }
}

//[PATCH] /groups/invitations/:invitationId/reject
export const rejectInvitationPatch = async (req: Request, res: Response) => {
  try {
    const invitationId = req.params.invitationId as string
    const myId = (req as any).user.id
    const result = await rejectInvitationPatchService(invitationId, myId);
    res.status(200).json({
      data: result.data,
      message: result.message,
      code: 200
    })
  } catch (error: any) {
    res.status(400).json({
      message: `Lỗi: ${error.message}`
    })
  }
}

//[PATCH] /groups/:groupId/transfer-owner
export const transferOwnerPatch = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.groupId as string;
    const myId = (req as any).user.id;
    const newOwnerId = req.body.newOwnerId;
    const result = await transferOwnerPatchService(groupId, myId, newOwnerId)
    res.status(200).json({
      data: result.data,
      message: result.message,
      code: 200
    })
  } catch (error: any) {
    res.status(400).json({
      message: `Lỗi: ${error.message}`
    })
  }
}
