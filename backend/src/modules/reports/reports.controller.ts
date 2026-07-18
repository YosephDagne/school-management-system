import { Response } from "express";
import { ReportsService } from "./reports.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { AuthenticatedRequest } from "../../middleware/auth";

export class ReportsController {
  static async getSchoolAnalytics(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const data = await ReportsService.getSchoolAnalytics();
      return ApiResponse.success(res, data, "School analytics compiled successfully");
    } catch (e: any) {
      return ApiResponse.error(res, e.message);
    }
  }

  static async getAcademicAverages(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const data = await ReportsService.getAcademicAverageReport();
      return ApiResponse.success(res, data, "Academic performance reports compiled");
    } catch (e: any) {
      return ApiResponse.error(res, e.message);
    }
  }

  static async getMinistryReport(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const data = await ReportsService.getMinistryReport();
      return ApiResponse.success(res, data, "Ministry of Education metrics compiled");
    } catch (e: any) {
      return ApiResponse.error(res, e.message);
    }
  }
}
