import { Router } from "express";
import { AuditController } from "./audit.controller";
import { authMiddleware, hasPermission } from "../../middleware/auth";

const router = Router();

router.use(authMiddleware as any);
router.get("/", hasPermission("audit.read") as any, AuditController.getLogs as any);

export default router;
