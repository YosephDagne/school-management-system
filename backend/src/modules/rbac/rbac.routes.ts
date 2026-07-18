import { Router } from "express";
import { RbacController } from "./rbac.controller";
import { authMiddleware, hasPermission } from "../../middleware/auth";

const router = Router();

router.use(authMiddleware as any);

// Roles
router.get("/roles", hasPermission("role.manage") as any, RbacController.getRoles as any);
router.post("/roles", hasPermission("role.manage") as any, RbacController.createRole as any);
router.put("/roles/:id", hasPermission("role.manage") as any, RbacController.updateRole as any);
router.delete("/roles/:id", hasPermission("role.manage") as any, RbacController.deleteRole as any);
router.post("/roles/:id/permissions", hasPermission("role.manage") as any, RbacController.setRolePermissions as any);

// Permissions
router.get("/permissions", hasPermission("role.manage") as any, RbacController.getPermissions as any);
router.post("/permissions", hasPermission("permission.manage") as any, RbacController.createPermission as any);
router.delete("/permissions/:id", hasPermission("permission.manage") as any, RbacController.deletePermission as any);

// User-Role assignment
router.post("/assign-roles", hasPermission("role.manage") as any, RbacController.assignRolesToUser as any);

export default router;
