import { Router } from "express";
import * as controller from "../../controllers/admin/stats.controller";
import { adminAuthMiddleware, requireRoles } from "../../middlewares/admin/auth.middleware";

const router = Router();

router.use(adminAuthMiddleware);
router.use(requireRoles(["ADMIN", "MANAGER"]));

router.get("/dashboard", controller.getDashboardStats);

export default router;
