import { Router } from "express";
import * as controller from "../../controllers/client/report.controller";
import { authMiddleware } from "../../middlewares/client/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", controller.createReport);

export const reportRoutes = router;
