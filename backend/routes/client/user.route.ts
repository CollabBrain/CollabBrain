import { Router } from "express";
const router: Router = Router()
import * as controller from "../../controllers/client/user.controller"
import * as validate from "../../validates/client/user.validate"
import * as ratelimit from "../../middlewares/client/rateLimit.middleware"
import * as authMiddleware from "../../middlewares/client/auth.middleware"
router.post("/login",ratelimit.authIpLimiter,validate.loginPost,ratelimit.loginEmailLimiter,controller.loginPost)

router.post("/register",ratelimit.authIpLimiter,validate.registerPost, ratelimit.registerEmailLimiter,controller.registerPost)
router.post("/register/verify-otp",ratelimit.authIpLimiter,validate.verifyOtpRegisterPost,ratelimit.verifyOtpEmailLimiter,controller.verifyOtpRegisterPost)

// Refresh token endpoint
router.post("/refresh", controller.refreshTokenPost)

router.get("/profile",authMiddleware.authMiddleware,controller.userProfile)
router.get("/profile/:id",authMiddleware.authMiddleware,controller.userProfileById)
router.patch("/profile", authMiddleware.authMiddleware,controller.editProfile)
router.patch("/profile/status", authMiddleware.authMiddleware, controller.updateStatus)
router.post("/forgot-password/forgot",ratelimit.authIpLimiter,validate.forgotPasswordPost,ratelimit.forgotPasswordEmailLimiter,controller.forgotPasswordPost)
router.post("/forgot-password/otp", ratelimit.authIpLimiter,validate.verifyOTPPost, ratelimit.verifyOtpEmailLimiter,controller.verifyOTPPost)
router.post("/forgot-password/reset",ratelimit.authIpLimiter,validate.resetPasswordPost,ratelimit.verifyOtpEmailLimiter, controller.resetPasswordPost)

export const userRoutes = router