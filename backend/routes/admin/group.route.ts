import { Router } from "express";
import * as controller from "../../controllers/admin/group.controller";
import { adminAuthMiddleware } from "../../middlewares/admin/auth.middleware";

const router = Router();

router.use(adminAuthMiddleware);

router.get("/", controller.getGroups);
router.get("/:id", controller.getGroupById);
router.patch("/:id/toggle-status", controller.toggleGroupStatus);
router.delete("/:id", controller.deleteGroup);

export default router;
