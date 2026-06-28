import { Router } from "express";
const router: Router = Router();
import * as controller from "../../controllers/client/setting.controller";

router.get("/", controller.getSettings);

export const settingRoutes = router;
