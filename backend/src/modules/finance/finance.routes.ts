import { Router } from "express";
import { FinanceController } from "./finance.controller";
import { authMiddleware, requirePermission } from "../../middleware/auth";

const router = Router();

router.use(authMiddleware as any);

router.post("/fees", requirePermission("manage_finance") as any, FinanceController.createFee as any);
router.post("/payments", requirePermission("manage_finance") as any, FinanceController.recordPayment as any);
router.get("/ledger/:studentId", FinanceController.getLedger as any);

export default router;
