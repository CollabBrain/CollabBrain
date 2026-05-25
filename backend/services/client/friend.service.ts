import { FriendshipStatus } from "@prisma/client"
import { createFriendShip, deleteRowFriendShip, findFriendship, getListFriend, getListBlockedUser, getRequestedFriend, getSearchSuggestions, getSentFriend, getSuggestFriend, updateFriendShipStatus } from "../../repositories/client/friend.repo"

export const getListFriendService = async (id: string) => {
  const result = await getListFriend(id)
  return {
    data: result,
    message: "Lấy thành công danh sách bạn bè"
  }
}
export const getFriendBySearchKeyWord = async (myId: string, keyword: string)=>{
  const result = await getSearchSuggestions(myId, keyword)
  return {
    data: result,
    message: "Tìm kiếm gợi ý thành công"
  }
}

export const acceptFriendPostService = async (senderId: string, receiverId: string, status: FriendshipStatus) => {

  const friendship = await findFriendship(senderId, receiverId)
  if (!friendship) throw new Error("Lời mời kết bạn không tồn tại")
  if (friendship.status !== "PENDING") throw new Error("Lời mời đã được xử lý")
  const result = await updateFriendShipStatus(senderId, receiverId, status)
  return {
    data: result,
    message: "Cập nhật trạng thái thành công"
  }
}

export const rejectFriendPostService = async (senderId: string, receiverId: string) => {
  const friendship = await findFriendship(senderId, receiverId)
  if (!friendship) throw new Error("Lời mời kết bạn không tồn tại")
  if (friendship.status !== "PENDING") throw new Error("Lời mời đã được xử lý")
  const result = await deleteRowFriendShip(senderId, receiverId)
  return {
    message: "Xóa thành công"
  }
}

export const requestFriendPostService = async (senderId: string, receiverId: string) => {
  if (senderId === receiverId) throw new Error("Không gửi được cho chính bản thân")

  const existing = await findFriendship(senderId, receiverId)
  const reverse = await findFriendship(receiverId, senderId)
  const friendship = existing || reverse

  if (friendship) {
    if (friendship.status === "BLOCKED") throw new Error("Không thể gửi lời mời kết bạn")
    if (friendship.status === "PENDING") throw new Error("Lời mời kết bạn đã tồn tại")
    if (friendship.status === "ACCEPTED") throw new Error("Đã là bạn bè")
  }

  const result = await createFriendShip(senderId, receiverId)
  return {
    data: result,
    message: "Đã gửi lời mời thành công"
  }
}


export const blockFriendPatchService = async (myId: string, targetId: string) => {
  const existing = await findFriendship(myId, targetId)
  const reverse = await findFriendship(targetId, myId)
  const friendship = existing || reverse

  if (friendship) {
    if (friendship.status === "BLOCKED") throw new Error("Đã block người này rồi")
    const result = await updateFriendShipStatus(friendship.senderId, friendship.receiverId, "BLOCKED")
    return { data: result, message: "Block thành công" }
  }
  const result = await createFriendShip(myId, targetId)
  await updateFriendShipStatus(myId, targetId, "BLOCKED")
  return { data: result, message: "Block thành công" }
}

export const unrequestFriendDeleteService = async (myId: string, targetId: string) => {
  const existing = await findFriendship(myId, targetId)
  const reverse = await findFriendship(targetId, myId)
  const friendship = existing || reverse

  if (friendship) {
    if (friendship.status === "BLOCKED") throw new Error("Không thể thực hiện thao tác hủy lời mời")
    if (friendship.status === "ACCEPTED") throw new Error("Đã là bạn bè. Không thể thực hiện thao tác hủy lời mời")
  } else {
    throw new Error("Không thể xóa")
  }
  if (friendship.senderId !== myId) throw new Error("Không có quyền thực hiện thao tác này, do bạn không phải là người gửi")

  await deleteRowFriendShip(friendship.senderId, friendship.receiverId)
  return {
    message: "Đã hủy lời mời kết bạn thành công"
  }
}

export const unfriendDeleteService = async (myId: string, targetId: string) => {
  const existing = await findFriendship(myId, targetId)
  const reverse = await findFriendship(targetId, myId)
  const friendship = existing || reverse

  if (friendship) {
    if (friendship.status === "BLOCKED") throw new Error("Không thể thực hiện thao tác hủy kết bạn")
    if (friendship.status === "PENDING") throw new Error("Chưa là bạn bè không thể hủy kết bạn")
  } else {
    throw new Error("Không thể xóa")
  }
  await deleteRowFriendShip(friendship.senderId, friendship.receiverId)
  return {
    message: "Đã hủy kết bạn thành công"
  }
}

export const requestedListGetService = async (myId: string) => {
  const result = await getRequestedFriend(myId)
  return {
    data: result,
    message: "Lấy danh sách thành công"
  }
}

export const sentListGetService = async (myId: string) => {
  const result = await getSentFriend(myId)
  return {
    data: result,
    message: "Lấy danh sách thành công"
  }
}

export const unblockFriendPatchService = async (myId: string, targetId: string) => {
  const existing = await findFriendship(myId, targetId)
  const reverse = await findFriendship(targetId, myId)
  const friendship = existing || reverse

  if (!friendship || friendship.status !== "BLOCKED")
    throw new Error("Không có block nào để hủy")

  const result = await deleteRowFriendShip(friendship.senderId, friendship.receiverId)
  return { data: result, message: "Hủy block thành công" }
}

export const suggestionListGetService = async (myId: string, limit: number = 10) => {
  const result = await getSuggestFriend(myId, limit)
  return {
    data: result,
    message: "Lấy danh sách gợi ý thành công"
  }
}

export const blockedListGetService = async (myId: string)=>{
  const result = await getListBlockedUser(myId)
  return {
    data: result,
    message: "Lấy danh sách chặn thành công"
  }
}