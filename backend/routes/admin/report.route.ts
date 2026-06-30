import { Router } from "express";
import * as controller from "../../controllers/admin/report.controller";
import { adminAuthMiddleware, requireRoles } from "../../middlewares/admin/auth.middleware";

const router = Router();

router.use(adminAuthMiddleware);
router.use(requireRoles(["ADMIN", "MANAGER", "STAFF"]));

router.get("/", controller.getReports);
router.patch("/:id/resolve", controller.resolveReport);

export default router;
