import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { AuditService } from "../audit/audit.service";
import { AuthenticatedRequest } from "../../middleware/auth";

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return ApiResponse.error(res, "Username and password are required", 400);
      }

      const result = await AuthService.login(username, password);
      
      // Log login success
      await AuditService.log(result.user.id, "USER_LOGIN", req.ip, { username });

      return ApiResponse.success(res, result, "Login successful");
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 401);
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return ApiResponse.error(res, "Current and new passwords are required", 400);
      }

      const userId = req.user!.id;
      await AuthService.changePassword(userId, oldPassword, newPassword);

      // Log password change
      await AuditService.log(userId, "CHANGE_PASSWORD", req.ip);

      return ApiResponse.success(res, null, "Password changed successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 400);
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      return ApiResponse.success(res, { user: req.user }, "Profile retrieved");
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 400);
    }
  }
}
