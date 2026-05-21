import {Router} from "express"
const router = Router()
import * as middleware from "../../middlewares/client/auth.middleware"
import * as ratelimit  from "../../middlewares/client/rateLimit.middleware"
import * as controller from "../../controllers/client/friend.controller"

router.get("/",ratelimit.authIpLimiter,middleware.authMiddleware, controller.friendList )
router.patch("/accept/:userId",ratelimit.authIpLimiter,middleware.authMiddleware,controller.acceptFriendPost)
router.delete("/reject/:userId",ratelimit.authIpLimiter,middleware.authMiddleware,controller.rejectFriendPost)
router.post("/request/:userId",ratelimit.authIpLimiter,middleware.authMiddleware,controller.requestFriendPost)
router.patch("/block/:userId",ratelimit.authIpLimiter,middleware.authMiddleware,controller.blockFriendPatch)
export const friendRoutes = router