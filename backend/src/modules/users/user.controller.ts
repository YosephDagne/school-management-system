import { Response } from "express";
import { User } from "./user.model";
import { Role } from "../rbac/role.model";
import { Permission } from "../rbac/permission.model";
import { ApiResponse } from "../../utils/ApiResponse";
import { AuditService } from "../audit/audit.service";
import { AuthenticatedRequest } from "../../middleware/auth";
import { hashPassword } from "../../utils/password";

export class UserController {
  static async getUsers(_req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const users = await User.findAll({
        include: [{ model: Role, as: "roles", include: [{ model: Permission, as: "permissions", attributes: ["name"] }] }],
        attributes: { exclude: ["password"] },
        order: [["username", "ASC"]],
      });
      return ApiResponse.success(res, users, "Users retrieved");
    } catch (e: any) {
      return ApiResponse.error(res, e.message);
    }
  }

  static async getUserById(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const id = req.params.id as string;
      const user = await User.findByPk(id, {
        include: [{ model: Role, as: "roles", include: [{ model: Permission, as: "permissions", attributes: ["name"] }] }],
        attributes: { exclude: ["password"] },
      });
      if (!user) return ApiResponse.error(res, "User not found", 404);
      return ApiResponse.success(res, user, "User retrieved");
    } catch (e: any) {
      return ApiResponse.error(res, e.message);
    }
  }

  static async createUser(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { username, email, password, roleIds, isActive = true } = req.body;
      if (!username || !password) return ApiResponse.error(res, "username and password are required", 400);

      const exists = await User.findOne({ where: { username } });
      if (exists) return ApiResponse.error(res, "Username already taken", 409);

      const hashedPwd = await hashPassword(password);
      const user = await User.create({ username, email, password: hashedPwd, isActive });

      if (roleIds && Array.isArray(roleIds)) {
        const roles = await Role.findAll({ where: { id: roleIds } });
        await (user as any).setRoles(roles);
      }

      await AuditService.log(req.user!.id, "CREATE_USER", "Users", req.ip, { username });
      const created = await User.findByPk(user.id, {
        include: [{ model: Role, as: "roles" }],
        attributes: { exclude: ["password"] },
      });
      return ApiResponse.success(res, created, "User created", 201);
    } catch (e: any) {
      return ApiResponse.error(res, e.message);
    }
  }

  static async updateUser(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const id = req.params.id as string;
      const { email, isActive, roleIds } = req.body;
      const user = await User.findByPk(id);
      if (!user) return ApiResponse.error(res, "User not found", 404);

      if (email !== undefined) user.email = email;
      if (isActive !== undefined) user.isActive = isActive;
      await user.save();

      if (roleIds && Array.isArray(roleIds)) {
        const roles = await Role.findAll({ where: { id: roleIds } });
        await (user as any).setRoles(roles);
      }

      await AuditService.log(req.user!.id, "UPDATE_USER", "Users", req.ip, { userId: id });
      return ApiResponse.success(res, null, "User updated");
    } catch (e: any) {
      return ApiResponse.error(res, e.message);
    }
  }

  static async deleteUser(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const id = req.params.id as string;
      if (id === req.user!.id) return ApiResponse.error(res, "Cannot delete your own account", 400);
      const user = await User.findByPk(id);
      if (!user) return ApiResponse.error(res, "User not found", 404);
      await (user as any).setRoles([]);
      await user.destroy();
      await AuditService.log(req.user!.id, "DELETE_USER", "Users", req.ip, { userId: id });
      return ApiResponse.success(res, null, "User deleted");
    } catch (e: any) {
      return ApiResponse.error(res, e.message);
    }
  }

  static async toggleStatus(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const id = req.params.id as string;
      if (id === req.user!.id) return ApiResponse.error(res, "Cannot deactivate your own account", 400);
      const user = await User.findByPk(id);
      if (!user) return ApiResponse.error(res, "User not found", 404);
      user.isActive = !user.isActive;
      await user.save();
      await AuditService.log(req.user!.id, user.isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER", "Users", req.ip, { userId: id });
      return ApiResponse.success(res, { isActive: user.isActive }, `User ${user.isActive ? "activated" : "deactivated"}`);
    } catch (e: any) {
      return ApiResponse.error(res, e.message);
    }
  }
}
