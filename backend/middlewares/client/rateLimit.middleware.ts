import { Request, Response } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
const tooManyRequest = (message: string)=>({
    code: 429,
    message
  })
const getEmailKey = (req: Request)=>{
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  return email ? `email: ${email}` : `ip: ${ipKeyGenerator(req.ip?? req.socket.remoteAddress ?? "")}`
}
export const authIpLimiter = rateLimit({
  windowMs: 15*60*1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: tooManyRequest("Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút")
})

export const loginEmailLimiter = rateLimit({
  windowMs: 5*60*1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: getEmailKey,
  skipSuccessfulRequests: true,
  message: tooManyRequest("Đăng nhập sai quá nhiều lần vui lòng thử lại sau 5 phút")
})

export const registerEmailLimiter = rateLimit({
  windowMs: 60*60*1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: getEmailKey,
  message: tooManyRequest("Gửi OTP đăng kí quá nhiều lần, vui lòng thử lại sau 1 giờ")

})
export const verifyOtpEmailLimiter = rateLimit({
  windowMs: 5*60*1000,
  limit:5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: getEmailKey,
  message: tooManyRequest("Sai OTP quá nhiều lần, vui lòng thử lại sau 5 phút")
})

export const forgotPasswordEmailLimiter = rateLimit({
  windowMs: 60*60*1000,
  limit:3,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: getEmailKey,
  message: tooManyRequest("Sai email quá nhiều lần, vui lòng thử lại sau 1 giờ")
})

