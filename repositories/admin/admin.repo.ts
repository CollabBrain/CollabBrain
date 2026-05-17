import prisma from "../../config/prisma"

export const findAccountByUsername = async (username: string)=>{
  return prisma.account.findFirst({
    where:{
      username:username,
      isDeleted: false,
      isActive: true
    }
  })
}