export class ApiResponse {
  static success(res: any, data: any, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error(res: any, message: string, status = 400) {
    return res.status(status).json({
      success: false,
      message,
    });
  }
}
