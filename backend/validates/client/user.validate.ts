import { NextFunction, Request, Response } from "express";
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isEmpty = (value: any) => {
  return value === undefined || value === null ||
    String(value).trim() === ""
}
const errorResponse = (res: Response, message: string) => {
  res.status(400).json({
    code: 400,
    message
  })
}

const normalizeEmail = (req: Request) => {
  req.body.email = String(req.body.email).trim().toLowerCase();
}

const validateEmail = (req: Request, res: Response) => {
  if (isEmpty(req.body.email)) {
    errorResponse(res, "Vui lòng nhập email")
    return false

  }
  normalizeEmail(req)
  if (!emailRegex.test(req.body.email)) {
    errorResponse(res, "Email không hợp lệ")
    return false
  }
  return true;
}

const validatePassword = (req: Request, res: Response)=>{
  if(isEmpty(req.body.password)){
    errorResponse(res, "Vui lòng nhập mật khẩu")
    return false
  }

  req.body.password = String(req.body.password)
  if(req.body.password.length < 6){
    errorResponse(res, "Mật khẩu phải có ít nhất 6 ký tự")
    return false
  }
  return true
}

const validateName = (req: Request, res: Response)=>{
  if(isEmpty(req.body.name)){
    errorResponse(res, "Vui lòng nhập tên");
    return false
  }
  req.body.name = String(req.body.name).trim();
  return true
}

const validateOTP = (req: Request, res: Response)=>{
  if(isEmpty(req.body.otp)){
    errorResponse(res, "Vui lòng nhập OTP");
    return false
  }

  req.body.otp = String(req.body.otp).trim();

  if (!/^\d{6}$/.test(req.body.otp)) {
    errorResponse(res, "OTP phải gồm 6 chữ số");
    return false;
  }
  return true
}

export const loginPost = (req: Request, res: Response, next: NextFunction)=>{
  if(!validateEmail(req,res)) return
  if(!validatePassword(req,res)) return
  next()
}

export const registerPost = (req: Request, res: Response, next:NextFunction)=>{
  if (!validateEmail(req, res)) return;
  if (!validatePassword(req, res)) return;
  if (!validateName(req, res)) return;
  next();
}

export const verifyOtpRegisterPost = (req: Request, res: Response, next: NextFunction) => {
  if (!validateEmail(req, res)) return;
  if (!validateOTP(req, res)) return;
  if (!validatePassword(req, res)) return;
  if (!validateName(req, res)) return;
  next();
}

export const forgotPasswordPost = (req: Request, res: Response, next: NextFunction) => {
  if (!validateEmail(req, res)) return;
  next();
}

export const verifyOTPPost = (req: Request, res: Response, next: NextFunction) => {
  if (!validateEmail(req, res)) return;
  if (!validateOTP(req, res)) return;
  next();
}

export const resetPasswordPost = (req: Request, res: Response, next: NextFunction) => {
  if (!validateEmail(req, res)) return;
  if (!validateOTP(req, res)) return;
  if (!validatePassword(req, res)) return;
  next();
}