import { FriendshipStatus } from "@prisma/client"
import prisma from "../../config/prisma"

export const getListFriend = async (id: string) => {
  return prisma.$queryRaw`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.avatar_url AS "avatarUrl",
      u.bio,
      u.status,
      u.status_expires_at AS "statusExpiresAt",
      u.created_at AS "createdAt"
    FROM friendships f
    JOIN users u 
      ON u.id = CASE 
        WHEN f.sender_id = ${id} THEN f.receiver_id
        WHEN f.receiver_id = ${id} THEN f.sender_id
      END
    WHERE f.status = 'ACCEPTED'
      AND (f.sender_id = ${id} OR f.receiver_id = ${id})
    ORDER BY f.updated_at DESC
  `
}
export const updateFriendShipStatus = async(senderId: string, receiverId:string, status: FriendshipStatus)=>{
  return prisma.friendship.update({
    where:{
      senderId_receiverId:{
        senderId: senderId,
        receiverId: receiverId
      }
    }, 
    data:{
      status: status
    }
  })
}
export const findFriendship = async(senderId: string, receiverId: string)=>{
  return prisma.friendship.findFirst({
    where:{
        senderId: senderId,
        receiverId: receiverId
          }
  })
}
export const deleteRowFriendShip = async (senderId: string, receiverId: string)=>{
  return prisma.friendship.delete({
    where:{
      senderId_receiverId:{
        senderId: senderId,
        receiverId: receiverId
      }
    }
  })
}

export const createFriendShip = async (senderId: string, receiverId: string)=>{
  return prisma.friendship.create({
    data: {
    senderId: senderId,
    receiverId: receiverId
    }
    
  })
}

export const getRequestedFriend = async(myId: string)=>{
  return prisma.friendship.findMany({
    where:{
      receiverId: myId,
      status:"PENDING"
    },
    orderBy:{
      createdAt: "desc"
    },
    include:{
      sender:{
        select:{
          id: true,
          name: true,
          avatarUrl: true,
          email: true,
          bio: true
        }
      }
    }
  })
}

export const getSentFriend = async(myId: string)=>{
  return prisma.friendship.findMany({
    where:{
      senderId: myId,
      status: "PENDING"
    },
    orderBy:{
      createdAt: "desc"
    },
    include:{
      receiver:{
        select:{
          id: true,
          name:true,
          avatarUrl: true,
          email: true,
          bio: true
        }
      }
      
    }
  })
}

export const getSuggestFriend = async (myId: string, limit:number) => {
  return prisma.$queryRaw`
    SELECT u.id, u.name, u.email, u.avatar_url AS "avatarUrl", u.bio
    FROM users u
    WHERE u.id != ${myId}
      AND u.is_deleted = false
      AND u.id NOT IN (
        SELECT CASE 
          WHEN f.sender_id = ${myId} THEN f.receiver_id
          ELSE f.sender_id
        END
        FROM friendships f
        WHERE f.sender_id = ${myId} OR f.receiver_id = ${myId}
      )
    ORDER BY RANDOM()
    LIMIT ${limit}
  `
}

export const getSearchSuggestions = async (myId: string, keyword: string)=>{
  if(!keyword.trim()) return []
  const words = keyword.trim().split(/\s+/)

  const searchPattern = words.map((word,index)=> index ===  words.length -1 ?`${word}:*` : word).join(" & ")
  const users = await prisma.user.findMany({
    where:{
      id: { not: myId },
      isDeleted: false,
      isActive: true,
      name:{ 
        search: searchPattern
      },
      NOT: {
        OR: [
          {
            sentFriendships: {
              some: { receiverId: myId, status: "BLOCKED" }
            }
          },
          {
            receivedFriendships: {
              some: { senderId: myId, status: "BLOCKED" }
            }
          }
        ]
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      bio: true,
      sentFriendships: {
        where: { receiverId: myId },
        select: { status: true, senderId: true, receiverId: true }
      },
      receivedFriendships: {
        where: { senderId: myId },
        select: { status: true, senderId: true, receiverId: true }
      }
    },
    take: 5
  })

  return users.map(u => {
    const friendship = u.sentFriendships[0] || u.receivedFriendships[0]
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
      friendship: friendship ? {
        status: friendship.status,
        senderId: friendship.senderId,
        
        receiverId: friendship.receiverId
      } : null
    }
  })
}
export const getListBlockedUser = async(myId: string)=>{
  return prisma.$queryRaw`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.avatar_url as "avatarUrl",
      u.bio
    FROM friendships f
    JOIN users u
      ON u.id = CASE
        WHEN f.sender_id = ${myId} THEN f.receiver_id
        WHEN f.receiver_id = ${myId} THEN f.sender_id
      END
    WHERE f.status = 'BLOCKED'
      AND (f.sender_id = ${myId} OR f.receiver_id = ${myId})
    ORDER BY f.updated_at DESC
  `
}
