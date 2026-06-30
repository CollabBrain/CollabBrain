import { Router } from "express";
import * as controller from "../../controllers/admin/user.controller";
import { validateGetUsers, validateUserId, validateUpdateUser } from "../../validates/admin/user.validate";
import { adminAuthMiddleware, requireRoles } from "../../middlewares/admin/auth.middleware";

const router = Router();

router.use(adminAuthMiddleware);
router.use(requireRoles(["ADMIN", "MANAGER", "STAFF"]));

router.get("/", validateGetUsers, controller.getUsers);
router.get("/:id", validateUserId, controller.getUserById);
router.patch("/:id", requireRoles(["ADMIN", "MANAGER"]), validateUserId, validateUpdateUser, controller.updateUser);
router.delete("/:id", requireRoles(["ADMIN", "MANAGER"]), validateUserId, controller.deleteUser);
router.patch("/:id/toggle-status", requireRoles(["ADMIN", "MANAGER"]), validateUserId, controller.toggleUserStatus);

export default router;
