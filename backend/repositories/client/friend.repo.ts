import { FriendshipStatus } from "@prisma/client"
import prisma from "../../config/prisma"

export const getListFriend = async (id: string) => {
  return prisma.$queryRaw`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.avatar_url AS "avatarUrl",
      u.bio
    FROM friendships f
    JOIN users u 
      ON u.id = CASE 
        WHEN f.sender_id = ${id} THEN f.receiver_id
        WHEN f.receiver_id = ${id} THEN f.sender_id
      END
    WHERE f.status = 'ACCEPTED'
      AND (f.sender_id = ${id} OR f.receiver_id = ${id})
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
    include:{
      sender:{
        select:{
          name: true,
          avatarUrl: true,
          email: true
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
    include:{
      receiver:{
        select:{
          name:true,
          avatarUrl: true,
          email: true
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
