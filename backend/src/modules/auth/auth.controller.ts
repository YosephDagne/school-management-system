import { Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { AuthenticatedRequest } from "../../middleware/auth";

export class AuthController {
  static async login(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return ApiResponse.error(res, "Username and password are required", 400);
      }
      const result = await AuthService.login(username, password, req.ip);
      return ApiResponse.success(res, result, "Login successful");
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 401);
    }
  }

  static async refresh(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return ApiResponse.error(res, "Refresh token is required", 400);
      }
      const result = await AuthService.refreshToken(refreshToken);
      return ApiResponse.success(res, result, "Token refreshed successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 401);
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      if (req.user) {
        await AuthService.logout(req.user.id, req.ip);
      }
      return ApiResponse.success(res, null, "Logged out successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return ApiResponse.error(res, "oldPassword and newPassword are required", 400);
      }
      await AuthService.changePassword(req.user!.id, oldPassword, newPassword, req.ip);
      return ApiResponse.success(res, null, "Password changed successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      return ApiResponse.success(res, req.user, "Profile retrieved");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }
}
