import { Router } from "express";
import * as controller from "../../controllers/admin/document.controller";
import { adminAuthMiddleware } from "../../middlewares/admin/auth.middleware";

const router = Router();

router.use(adminAuthMiddleware);

router.get("/", controller.getDocuments);
router.post("/:id/re-ingest", controller.reIngestDocument);
router.delete("/:id", controller.deleteDocument);

export default router;
