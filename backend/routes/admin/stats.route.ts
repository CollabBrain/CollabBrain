import { Router } from "express";
import * as controller from "../../controllers/admin/stats.controller";
import { adminAuthMiddleware } from "../../middlewares/admin/auth.middleware";

const router = Router();

router.use(adminAuthMiddleware);

router.get("/dashboard", controller.getDashboardStats);

export default router;
