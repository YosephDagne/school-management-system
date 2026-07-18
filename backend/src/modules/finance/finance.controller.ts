import { Response, NextFunction } from "express";
import { FinanceService } from "./finance.service";
import { Payment } from "./payment.model";
import { ApiResponse } from "../../utils/ApiResponse";
import { AuditService } from "../audit/audit.service";
import { AuthenticatedRequest } from "../../middleware/auth";

export class FinanceController {
  static async createFee(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await FinanceService.createFee(req.body);
      await AuditService.log(req.user!.id, "CREATE_FEE", "Finance", req.ip, { feeId: result.id, title: result.title });
      return ApiResponse.success(res, result, "Fee structure template added successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async getFees(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await FinanceService.getAllFees();
      return ApiResponse.success(res, result, "Fees list retrieved");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async recordPayment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await FinanceService.recordPayment(req.body);
      await AuditService.log(req.user!.id, "RECORD_PAYMENT", "Finance", req.ip, {
        studentId: req.body.studentId,
        receipt: result.receiptNumber,
      });
      return ApiResponse.success(res, result, "Tuition payment processed and receipt generated");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async approvePayment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const paymentId = req.params.paymentId as string;
      const payment = await Payment.findByPk(paymentId);
      if (!payment) return ApiResponse.error(res, "Payment not found", 404);
      (payment as any).status = "Approved";
      await payment.save();
      await AuditService.log(req.user!.id, "APPROVE_PAYMENT", "Finance", req.ip, { paymentId });
      return ApiResponse.success(res, payment, "Payment approved successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async getLedger(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const studentId = req.params.studentId as string;
      const result = await FinanceService.getStudentFeesLedger(studentId);
      return ApiResponse.success(res, result, "Student fees ledger profile calculated");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }
}
