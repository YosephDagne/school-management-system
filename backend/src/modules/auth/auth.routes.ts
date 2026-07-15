import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authMiddleware } from "../../middleware/auth";

const router = Router();

router.post("/login", AuthController.login);
router.post("/change-password", authMiddleware as any, AuthController.changePassword as any);
router.get("/profile", authMiddleware as any, AuthController.getProfile as any);

export default router;
