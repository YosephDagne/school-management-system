import { Response, NextFunction } from "express";
import { LibraryService } from "./library.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { AuditService } from "../audit/audit.service";
import { AuthenticatedRequest } from "../../middleware/auth";

export class LibraryController {
  static async createBook(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await LibraryService.createBook(req.body);
      await AuditService.log(req.user!.id, "CREATE_BOOK", req.ip, { bookId: result.id, title: result.title });
      return ApiResponse.success(res, result, "Book cataloged successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async borrowBook(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await LibraryService.borrowBook(req.body);
      await AuditService.log(req.user!.id, "BORROW_BOOK", req.ip, {
        bookId: req.body.bookId,
        studentId: req.body.studentId,
        teacherId: req.body.teacherId,
      });
      return ApiResponse.success(res, result, "Book checkout registered successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async returnBook(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const borrowingId = req.params.borrowingId as string;
      const result = await LibraryService.returnBook(borrowingId);
      await AuditService.log(req.user!.id, "RETURN_BOOK", req.ip, { borrowingId });
      return ApiResponse.success(res, result, "Book return processed successfully");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async getActiveBorrowings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await LibraryService.getActiveBorrowings();
      return ApiResponse.success(res, result, "Active library borrowings retrieved");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async getBooks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await LibraryService.getBooks();
      return ApiResponse.success(res, result, "Books inventory list retrieved");
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }
}
