import { Router } from "express";
const router = Router()
import * as ratelimit from "../../middlewares/client/rateLimit.middleware"
import * as middleware from "../../middlewares/client/auth.middleware"
import * as controller from "../../controllers/client/group.controller"
router.post("/",ratelimit.authIpLimiter,middleware.authMiddleware,controller.createGroupPost)


router.get("/list",ratelimit.authIpLimiter,middleware.authMiddleware, controller.myGroupGet)
router.get("/search",ratelimit.authIpLimiter, middleware.authMiddleware, controller.findGroupGet)

router.get("/:groupId",ratelimit.authIpLimiter,middleware.authMiddleware,controller.groupInfoGet)
router.patch("/:groupId",ratelimit.authIpLimiter,middleware.authMiddleware,controller.updateGroupPatch)
router.delete("/:groupId",ratelimit.authIpLimiter,middleware.authMiddleware,controller.removeGroupDelete)


router.get("/:groupId/members",ratelimit.authIpLimiter,middleware.authMiddleware,controller.memberGroupGet)
router.post("/:groupId/members", ratelimit.authIpLimiter,middleware.authMiddleware,controller.addMemberPost)

router.delete("/:groupId/members/:userId", ratelimit.authIpLimiter,middleware.authMiddleware,controller.deleteMemberDelete)
router.patch("/:groupId/members/:userId/role", ratelimit.authIpLimiter,middleware.authMiddleware,controller.changeRoleUserPatch)

router.post("/:groupId/leave", ratelimit.authIpLimiter,middleware.authMiddleware,controller.leaveGroupPost)


router.post("/:groupId/join-request",ratelimit.authIpLimiter,middleware.authMiddleware,controller.joinRequestPost)
router.get("/:groupId/join-requests",ratelimit.authIpLimiter,middleware.authMiddleware,controller.listRequestGet)

router.patch("/:groupId/join-requests/:invitationId/accept",ratelimit.authIpLimiter,middleware.authMiddleware,controller.acceptMemberPatch)
router.patch("/:groupId/join-requests/:invitationId/reject",ratelimit.authIpLimiter,middleware.authMiddleware,controller.rejectMemberPatch)

router.post("/:groupId/invitations",ratelimit.authIpLimiter,middleware.authMiddleware,controller.inviteMemberPost)
router.get("/invitations/received",ratelimit.authIpLimiter,middleware.authMiddleware, controller.listInvitationGet)
router.patch("/invitations/:invitationId/accept",ratelimit.authIpLimiter,middleware.authMiddleware,controller.acceptInvitationPatch)
router.patch("/invitations/:invitationId/reject",ratelimit.authIpLimiter,middleware.authMiddleware,controller.rejectInvitationPatch)

router.patch("/:groupId/transfer-owner",ratelimit.authIpLimiter,middleware.authMiddleware,controller.transferOwnerPatch)
export const  groupRoutes = router
