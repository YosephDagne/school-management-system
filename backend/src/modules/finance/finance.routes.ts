import { Router } from "express";
import { FinanceController } from "./finance.controller";
import { authMiddleware, hasPermission } from "../../middleware/auth";
import { checkStudentOwnership } from "../../middleware/ownership";

const router = Router();
router.use(authMiddleware as any);

router.post("/fees", hasPermission("finance.create") as any, FinanceController.createFee as any);
router.get("/fees", hasPermission("finance.read") as any, FinanceController.getFees as any);
router.post("/payments", hasPermission("finance.create") as any, FinanceController.recordPayment as any);
router.post("/payments/approve/:paymentId", hasPermission("finance.approve") as any, FinanceController.approvePayment as any);
router.get("/ledger/:studentId", hasPermission("finance.read") as any, checkStudentOwnership("studentId") as any, FinanceController.getLedger as any);

export default router;
