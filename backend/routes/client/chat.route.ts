import { Router } from "express";
import * as controller from "../../controllers/client/chat.controller"
import * as middleware from "../../middlewares/client/auth.middleware"
import * as ratelimit from "../../middlewares/client/rateLimit.middleware"
const router = Router()
router.get("/history/:userId",ratelimit.authIpLimiter,middleware.authMiddleware,controller.getHistory)
router.patch("/read/:userId",ratelimit.authIpLimiter,middleware.authMiddleware,controller.markedReadPatch)
router.patch("/delete/:messageId",ratelimit.authIpLimiter,middleware.authMiddleware,controller.deleteMessagePatch)
export const chatRoutes = router