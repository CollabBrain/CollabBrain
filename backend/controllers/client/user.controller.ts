import { Request, Response } from "express";
import { editProfileService, forgotPasswordServiceSendMail, loginService, registerService, resetPasswordService, verifyOTPForgotPassword, verifyOTPRegister } from "../../services/client/user.service";
import { UserTypes } from "../../types/client/user.types";

//[POSt] /user/login
export const loginPost = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await loginService({ email, password })
    
    res.status(200).json({
      code: 200,
      data: result
    })
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message
    })
  }

}

//[POST] /user/register - gửi email otp
export const registerPost = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const result = await registerService({ email, password, name })

    res.status(200).json({
      code: 200,
      data: result
    })
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message
    })
  }
}

// [POST] /user/register/verify-otp  — xác nhận OTP, tạo user
export const verifyOtpRegisterPost = async (req: Request, res: Response) => {
  try {
    const { email, otp, password, name } = req.body;

    const result = await verifyOTPRegister({ email, otp, password, name });

    res.status(200).json({ code: 200, data: result });
  } catch (error: any) {
    res.status(400).json({ code: 400, message: error.message });
  }
};


//[POST] /user/forgot-pasword/forgot
export const forgotPasswordPost = async (req: Request, res: Response) => {
  try {
    const email = req.body.email

    const result = await forgotPasswordServiceSendMail(email)

    res.status(200).json({
      code: 200,
      data: result
    })
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message
    })
  }
}

//[POST] /user/forgot-password/otp
export const verifyOTPPost = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const result = await verifyOTPForgotPassword(email, otp)

    res.status(200).json({
      code: 200,
      data: result
    })
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message
    })
  }
}

//[POST] /user/forgot-password/rest
export const resetPasswordPost = async (req: Request, res: Response) => {
  try {
    const { email, otp, password } = req.body

    const result = await resetPasswordService({ email, otp, password })

    res.status(200).json({
      code: 200,
      data: result
    })
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message
    })
  }
}
export const userProfile = (req: Request, res: Response)=>{
  try {
    const user = (req as any).user
    res.status(200).json({
      data: user,
      message: "Lấy thông tin profile thành công",
      code: 200
    })
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message
    })
  }
}
 
export const editProfile = async(req: Request, res: Response)=>{
  try {
    const user = (req as any).user
    const result = await editProfileService(user.id,req.body)
    res.status(200).json({
      code: 200,
      data: result,
      message: "Cập nhật profile thành công"
    });
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message
    });
  }

}