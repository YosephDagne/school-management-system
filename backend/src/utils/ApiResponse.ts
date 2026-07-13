export class ApiResponse {
  static success(res: any, data: any, message = "Success") {
    return res.status(200).json({
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
