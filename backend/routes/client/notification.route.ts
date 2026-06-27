import { Router } from "express";
const router: Router = Router();
import * as controller from "../../controllers/client/notification.controller";
import * as authMiddleware from "../../middlewares/client/auth.middleware";

router.use(authMiddleware.authMiddleware);

router.get("/", controller.getNotificationSettings);
router.put("/", controller.updateNotificationSettings);

export const notificationRoutes = router;
