import { Request, Response } from "express"
import * as adminService from "../../services/admin/auth.service"
import { verifyAccessToken } from "../../helpers/jwt"
export const loginAdminPost = async(req: Request, res: Response)=>{
  try {
    const {username, password} = req.body
    const result = await adminService.authService(username,password)
    res.status(200).json({
      code: 200,
      message: "Đăng nhập thành công",
      data: result
    })
  } catch (error: any) {
    res.status(400).json({
      message: "Đăng nhập thất bại"
    })
  }
}