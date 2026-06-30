import { Router } from "express";
import * as controller from "../../controllers/admin/document.controller";
import { adminAuthMiddleware, requireRoles } from "../../middlewares/admin/auth.middleware";

const router = Router();

router.use(adminAuthMiddleware);
router.use(requireRoles(["ADMIN", "MANAGER", "STAFF"]));

router.get("/", controller.getDocuments);
router.post("/:id/re-ingest", controller.reIngestDocument);
router.delete("/:id", requireRoles(["ADMIN", "MANAGER"]), controller.deleteDocument);

export default router;
