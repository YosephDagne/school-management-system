import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../utils/ApiResponse";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): any {
  console.error("Express Global Error:", err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || "An unexpected error occurred on the server";

  return ApiResponse.error(res, message, status);
}
