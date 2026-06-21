import { Router } from "express";
import * as controller from "../../controllers/admin/report.controller";
import { adminAuthMiddleware } from "../../middlewares/admin/auth.middleware";

const router = Router();

router.use(adminAuthMiddleware);

router.get("/", controller.getReports);
router.patch("/:id/resolve", controller.resolveReport);

export default router;
