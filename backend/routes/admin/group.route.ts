import { Router } from "express";
import * as controller from "../../controllers/admin/group.controller";
import { adminAuthMiddleware, requireRoles } from "../../middlewares/admin/auth.middleware";

const router = Router();

router.use(adminAuthMiddleware);
router.use(requireRoles(["ADMIN", "MANAGER", "STAFF"]));

router.get("/", controller.getGroups);
router.get("/:id", controller.getGroupById);
router.patch("/:id/toggle-status", requireRoles(["ADMIN", "MANAGER"]), controller.toggleGroupStatus);
router.delete("/:id", requireRoles(["ADMIN", "MANAGER"]), controller.deleteGroup);

export default router;
