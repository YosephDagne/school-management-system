import { Response, NextFunction } from "express";
import { AuditLog } from "./audit.model";
import { User } from "../users/user.model";
import { ApiResponse } from "../../utils/ApiResponse";
import { AuthenticatedRequest } from "../../middleware/auth";
import { Op } from "sequelize";

export class AuditController {
  static async getLogs(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { module, action, userId, from, to, page = "1", limit = "50" } = req.query;

      const where: any = {};
      if (module) where.module = module;
      if (action) where.action = { [Op.iLike]: `%${action}%` };
      if (userId) where.userId = userId;
      if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt[Op.gte] = new Date(from as string);
        if (to) where.createdAt[Op.lte] = new Date(to as string);
      }

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      const { count, rows } = await AuditLog.findAndCountAll({
        where,
        include: [{ model: User, as: "user", attributes: ["username", "email"] }],
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit as string),
        offset,
      });

      return ApiResponse.success(res, { logs: rows, total: count, page: parseInt(page as string), limit: parseInt(limit as string) }, "Audit logs retrieved");
    } catch (e: any) {
      return ApiResponse.error(res, e.message);
    }
  }
}
