import { Router } from "express";
import * as controller from "../../controllers/client/user.controller"
import * as validate from "../../validates/client/user.validate"
import * as rateLimit from "../../middlewares/client/rateLimit.middleware"
const router: Router = Router()

router.post("/login",rateLimit.authIpLimiter, validate.loginPost, rateLimit.loginEmailLimiter,controller.loginPost)

router.post("/register", rateLimit.authIpLimiter, validate.registerPost, rateLimit.registerEmailLimiter,controller.registerPost)
router.post("/register/verify-otp", validate.verifyOtpRegisterPost, controller.verifyOtpRegisterPost)

router.post("/forgot-password/forgot", validate.forgotPasswordPost, controller.forgotPasswordPost)
router.post("/forgot-password/otp", validate.verifyOTPPost, controller.verifyOTPPost)
router.post("/forgot-password/reset", validate.resetPasswordPost, controller.resetPasswordPost)

export const userRoutes = router
