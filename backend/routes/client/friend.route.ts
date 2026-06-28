import { Router } from "express"
const router = Router()
import * as middleware from "../../middlewares/client/auth.middleware"
import * as ratelimit from "../../middlewares/client/rateLimit.middleware"
import * as controller from "../../controllers/client/friend.controller"

router.get("/list", ratelimit.authIpLimiter, middleware.authMiddleware, controller.friendList)

router.patch("/accept/:userId", ratelimit.authIpLimiter, middleware.authMiddleware, controller.acceptFriendPost)
router.delete("/reject/:userId", ratelimit.authIpLimiter, middleware.authMiddleware, controller.rejectFriendPost)
router.post("/request/:userId", ratelimit.authIpLimiter, middleware.authMiddleware, controller.requestFriendPost)
router.patch("/block/:userId", ratelimit.authIpLimiter, middleware.authMiddleware, controller.blockFriendPatch)

router.delete("/unrequest/:userId", ratelimit.authIpLimiter, middleware.authMiddleware, controller.unrequestFriendDelete)
router.delete("/unfriend/:userId", ratelimit.authIpLimiter, middleware.authMiddleware, controller.unfriendDelete)

router.get("/requests/receive", ratelimit.authIpLimiter, middleware.authMiddleware, controller.requestedListGet)
router.get("/requests/sent", ratelimit.authIpLimiter, middleware.authMiddleware, controller.sentListGet)
router.patch("/unblock/:userId", ratelimit.authIpLimiter, middleware.authMiddleware, controller.unblockFriendPatch)
router.get("/suggestions", ratelimit.authIpLimiter, middleware.authMiddleware, controller.suggestionListGet)
router.get("/blocked", ratelimit.authIpLimiter, middleware.authMiddleware, controller.blockedListGet)
export const friendRoutes = router