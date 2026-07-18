import { AuditLog } from "./audit.model";

export class AuditService {
  static async log(userId: string, action: string, module: string, ipAddress?: string, details?: any) {
    try {
      const detailsStr = details ? (typeof details === "string" ? details : JSON.stringify(details)) : undefined;
      await AuditLog.create({
        userId,
        action,
        module,
        ipAddress,
        details: detailsStr,
      });
    } catch (error) {
      console.error("Failed to write audit log:", error);
    }
  }
}
