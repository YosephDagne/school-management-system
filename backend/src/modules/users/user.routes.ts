import { Router } from "express";
import { UserController } from "./user.controller";
import { authMiddleware, hasPermission } from "../../middleware/auth";

const router = Router();

router.use(authMiddleware as any);

router.get("/", hasPermission("user.read") as any, UserController.getUsers as any);
router.get("/:id", hasPermission("user.read") as any, UserController.getUserById as any);
router.post("/", hasPermission("user.create") as any, UserController.createUser as any);
router.put("/:id", hasPermission("user.update") as any, UserController.updateUser as any);
router.delete("/:id", hasPermission("user.delete") as any, UserController.deleteUser as any);
router.patch("/:id/toggle-status", hasPermission("user.update") as any, UserController.toggleStatus as any);

export default router;
