import { Router } from "express";
import * as controller from "../../controllers/admin/setting.controller";
import { adminAuthMiddleware, requireRoles } from "../../middlewares/admin/auth.middleware";

const router = Router();

router.use(adminAuthMiddleware);
router.use(requireRoles(["ADMIN"]));

router.get("/", controller.getSettings);
router.put("/", controller.updateSettings);

export default router;
