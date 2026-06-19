import { Router } from "express";
import * as controller from "../../controllers/admin/group.controller";
import {
  validateGetGroups,
  validateGroupId
} from "../../validates/admin/group.validate";
import { adminAuthMiddleware } from "../../middlewares/admin/auth.middleware";

const router = Router();

router.use(adminAuthMiddleware);

router.get("/", validateGetGroups, controller.getGroups);
router.get("/:id", validateGroupId, controller.getGroupById);
router.delete("/:id", validateGroupId, controller.deleteGroup);

export default router;
