import { Router } from "express";
import * as controller from "../../controllers/client/chat.controller"
import * as middleware from "../../middlewares/client/auth.middleware"
import * as ratelimit from "../../middlewares/client/rateLimit.middleware"
import { upload } from "../../helpers/storageMulter";
const router = Router()

// API kết nối với bộ máy chat ở Frontend
router.get("/conversations", ratelimit.authIpLimiter, middleware.authMiddleware, controller.getConversations)
router.post("/conversations", ratelimit.authIpLimiter, middleware.authMiddleware, controller.createConversation)
router.get("/conversations/:conversationId", ratelimit.authIpLimiter, middleware.authMiddleware, controller.getConversationById)
router.get("/conversations/:conversationId/messages", ratelimit.authIpLimiter, middleware.authMiddleware, controller.getConversationMessages)
router.patch("/conversations/:conversationId/read", ratelimit.authIpLimiter, middleware.authMiddleware, controller.markConversationRead)

// Tìm kiếm người dùng để bắt đầu chat mới
router.get("/users/search", ratelimit.authIpLimiter, middleware.authMiddleware, controller.searchUsers)

// Gửi tin nhắn (fallback REST khi socket không hoạt động)
router.post("/messages", ratelimit.authIpLimiter, middleware.authMiddleware, controller.sendMessage)

// Endpoints cũ của backend
router.get("/history/:userId",ratelimit.authIpLimiter,middleware.authMiddleware,controller.getHistory)
router.patch("/read/:userId",ratelimit.authIpLimiter,middleware.authMiddleware,controller.markedReadPatch)
router.patch("/delete/:messageId",ratelimit.authIpLimiter,middleware.authMiddleware,controller.deleteMessagePatch)
router.delete("/messages/:messageId",ratelimit.authIpLimiter,middleware.authMiddleware,controller.deleteMessage)

router.post("/upload",ratelimit.authIpLimiter,middleware.authMiddleware,upload.single("file"),controller.uploadFilePost)

export const chatRoutes = router