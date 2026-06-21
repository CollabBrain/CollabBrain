import { Router } from "express";
import * as controller from "../../controllers/admin/auth.controller"
const router = Router()
router.post("/login",controller.loginAdminPost)
export const authRoutes = router