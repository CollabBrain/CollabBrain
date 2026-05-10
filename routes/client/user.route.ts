import { Router } from "express";
const router: Router = Router()
import * as controller from "../../controllers/client/user.controller"
router.post("/login",controller.loginPost)

router.post("/register", controller.registerPost)
router.post("/register/verify-otp",controller.verifyOtpRegisterPost)

export const userRoutes = router