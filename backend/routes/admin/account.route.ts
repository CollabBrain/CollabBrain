import { Router } from "express";
import * as controller from "../../controllers/admin/account.controller";
import {
  validateGetAccounts,
  validateAccountId,
  validateCreateAccount,
  validateUpdateAccount
} from "../../validates/admin/account.validate";
import { adminAuthMiddleware, requireRoles } from "../../middlewares/admin/auth.middleware";

const router = Router();

router.use(adminAuthMiddleware);
router.use(requireRoles(["ADMIN"]));

router.get("/", validateGetAccounts, controller.getAccounts);
router.get("/:id", validateAccountId, controller.getAccountById);
router.post("/", validateCreateAccount, controller.createAccount);
router.patch("/:id", validateAccountId, validateUpdateAccount, controller.updateAccount);
router.delete("/:id", validateAccountId, controller.deleteAccount);
router.patch("/:id/toggle-status", validateAccountId, controller.toggleAccountStatus);

export default router;
