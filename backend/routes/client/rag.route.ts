import { Router } from "express";
const router: Router = Router()
import * as controller from "../../controllers/client/rag.controller"
import * as middleware from "../../middlewares/client/auth.middleware"
import * as ratelimit from "../../middlewares/client/rateLimit.middleware"
router.post("/query",ratelimit.authIpLimiter,middleware.authMiddleware, controller.queryRag)

export const ragRoutes = router