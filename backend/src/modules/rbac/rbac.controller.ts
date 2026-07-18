import { Response } from "express";
import { Role } from "./role.model";
import { Permission } from "./permission.model";
import { User } from "../users/user.model";
import { ApiResponse } from "../../utils/ApiResponse";
import { AuditService } from "../audit/audit.service";
import { AuthenticatedRequest } from "../../middleware/auth";

export class RbacController {
  // ─── Roles ──────────────────────────────────────────────────────────────────
  static async getRoles(_req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const roles = await Role.findAll({
        include: [{ model: Permission, as: "permissions", attributes: ["id", "name", "description"] }],
        order: [["name", "ASC"]],
      });
      return ApiResponse.success(res, roles, "Roles retrieved");
    } catch (e: any) {
      return ApiResponse.error(res, e.message);
    }
  }

  static async createRole(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { name, description } = req.body;
      if (!name) return ApiResponse.error(res, "Role name is required", 400);
      const existing = await Role.findOne({ where: { name } });
      if (existing) return ApiResponse.error(res, "Role with this name already exists", 409);
      const role = await Role.create({ name, description });
      await AuditService.log(req.user!.id, "CREATE_ROLE", "RBAC", req.ip, { roleName: name });
      return ApiResponse.success(res, role, "Role created", 201);
    } catch (e: any) {
      return ApiResponse.error(res, e.message);
    }
  }

  static async updateRole(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const id = req.params.id as string;
      const { name, description } = req.body;
      const role = await Role.findByPk(id);
      if (!role) return ApiResponse.error(res, "Role not found", 404);
      await role.update({ name, description });
      await AuditService.log(req.user!.id, "UPDATE_ROLE", "RBAC", req.ip, { roleId: id, name });
      return ApiResponse.success(res, role, "Role updated");
    } catch (e: any) {
      return ApiResponse.error(res, e.message);
    }
  }

  static async deleteRole(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const id = req.params.id as string;
      const role = await Role.findByPk(id);
      if (!role) return ApiResponse.error(res, "Role not found", 404);
      await role.destroy();
      await AuditService.log(req.user!.id, "DELETE_ROLE", "RBAC", req.ip, { roleId: id });
      return ApiResponse.success(res, null, "Role deleted");
    } catch (e: any) {
      return ApiResponse.error(res, e.message);
    }
  }

  static async setRolePermissions(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const id = req.params.id as string;
      const { permissionIds } = req.body;
      if (!Array.isArray(permissionIds)) return ApiResponse.error(res, "permissionIds must be an array", 400);
      const role = await Role.findByPk(id);
      if (!role) return ApiResponse.error(res, "Role not found", 404);
      const permissions = await Permission.findAll({ where: { id: permissionIds } });
      await (role as any).setPermissions(permissions);
      await AuditService.log(req.user!.id, "SET_ROLE_PERMISSIONS", "RBAC", req.ip, { roleId: id, permissionIds });
      return ApiResponse.success(res, null, "Role permissions updated");
    } catch (e: any) {
      return ApiResponse.error(res, e.message);
    }
  }

  // ─── Permissions ────────────────────────────────────────────────────────────
  static async getPermissions(_req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const permissions = await Permission.findAll({ order: [["name", "ASC"]] });
      return ApiResponse.success(res, permissions, "Permissions retrieved");
    } catch (e: any) {
      return ApiResponse.error(res, e.message);
    }
  }

  static async createPermission(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { name, description } = req.body;
      if (!name) return ApiResponse.error(res, "Permission name is required", 400);
      const existing = await Permission.findOne({ where: { name } });
      if (existing) return ApiResponse.error(res, "Permission already exists", 409);
      const perm = await Permission.create({ name, description });
      await AuditService.log(req.user!.id, "CREATE_PERMISSION", "RBAC", req.ip, { name });
      return ApiResponse.success(res, perm, "Permission created", 201);
    } catch (e: any) {
      return ApiResponse.error(res, e.message);
    }
  }

  static async deletePermission(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const id = req.params.id as string;
      const perm = await Permission.findByPk(id);
      if (!perm) return ApiResponse.error(res, "Permission not found", 404);
      await perm.destroy();
      await AuditService.log(req.user!.id, "DELETE_PERMISSION", "RBAC", req.ip, { permissionId: id });
      return ApiResponse.success(res, null, "Permission deleted");
    } catch (e: any) {
      return ApiResponse.error(res, e.message);
    }
  }

  // ─── User Role Assignment ────────────────────────────────────────────────────
  static async assignRolesToUser(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { userId, roleIds } = req.body;
      if (!userId || !Array.isArray(roleIds)) return ApiResponse.error(res, "userId and roleIds array required", 400);
      const user = await User.findByPk(userId as string);
      if (!user) return ApiResponse.error(res, "User not found", 404);
      const roles = await Role.findAll({ where: { id: roleIds } });
      await (user as any).setRoles(roles);
      await AuditService.log(req.user!.id, "ASSIGN_USER_ROLES", "RBAC", req.ip, { userId, roleIds });
      return ApiResponse.success(res, null, "Roles assigned to user");
    } catch (e: any) {
      return ApiResponse.error(res, e.message);
    }
  }
}
