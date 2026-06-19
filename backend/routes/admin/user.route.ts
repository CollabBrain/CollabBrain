import { Router } from "express";
import * as controller from "../../controllers/admin/user.controller";
import { validateGetUsers, validateUserId, validateUpdateUser } from "../../validates/admin/user.validate";
import { adminAuthMiddleware } from "../../middlewares/admin/auth.middleware";

const router = Router();

router.use(adminAuthMiddleware);

router.get("/", validateGetUsers, controller.getUsers);
router.get("/:id", validateUserId, controller.getUserById);
router.patch("/:id", validateUserId, validateUpdateUser, controller.updateUser);
router.delete("/:id", validateUserId, controller.deleteUser);
router.patch("/:id/toggle-status", validateUserId, controller.toggleUserStatus);

export default router;
