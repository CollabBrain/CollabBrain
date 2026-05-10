import { Request, Response } from "express";
import { loginService, registerService, verifyOTPRegister } from "../../services/client/user.service";

//[POSt] /user/login
export const loginPost = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await loginService({email, password})
    res.status(200).json({
      code: 200,
      data: result
    })
  } catch (error) {
    res.status(404).json({
      code: 400,
      message: `Lỗi: ${error}`
    })
  }

}

//[POST] /user/register - gửi email otp
export const registerPost = async(req: Request, res: Response)=>{
  try {
    const {email, password, name} = req.body;
    const result = await registerService({email, password, name})
  } catch (error) {
    
  }
}
// [POST] /user/register/verify-otp  — xác nhận OTP, tạo user
export const verifyOtpRegisterPost = async (req: Request, res: Response) => {
  try {
    const { email, otp, password, name } = req.body;
    const result = await verifyOTPRegister({ email, otp, password, name });
    res.status(201).json({ code: 201, data: result });
  } catch (error: any) {
    res.status(400).json({ code: 400, message: error.message });
  }
};