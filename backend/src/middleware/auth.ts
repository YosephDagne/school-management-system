import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { User } from "../modules/users/user.model";
import { Role } from "../modules/rbac/role.model";
import { Permission } from "../modules/rbac/permission.model";
import { Student } from "../modules/students/student.model";
import { Parent } from "../modules/parents/parent.model";
import { Teacher } from "../modules/teachers/teacher.model";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    roles: string[];
    permissions: string[];
    studentId?: string;
    parentId?: string;
    teacherId?: string;
  };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<any> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded: any = verifyToken(token);
    
    // Fetch user and their roles with associated permissions plus profiles
    const user = await User.findByPk(decoded.id, {
      include: [
        {
          model: Role,
          as: "roles",
          include: [
            {
              model: Permission,
              as: "permissions",
              attributes: ["name"],
            },
          ],
        },
        { model: Student, as: "student" },
        { model: Parent, as: "parent" },
        { model: Teacher, as: "teacher" },
      ],
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "User not found or deactivated" });
    }

    const roles = user.roles.map((r: any) => r.name);
    const permissions = Array.from(
      new Set(user.roles.flatMap((r: any) => r.permissions.map((p: any) => p.name)))
    );

    req.user = {
      id: user.id,
      username: user.username,
      roles,
      permissions,
      studentId: (user as any).student?.id,
      parentId: (user as any).parent?.id,
      teacherId: (user as any).teacher?.id,
    } as any;

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired", expired: true });
    }
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

// RBAC Middleware to check permission
export function hasPermission(permissions: string | string[]) {
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Super Admin bypasses all checks
    if (req.user.roles.includes("Super Admin") || req.user.roles.includes("SUPER_ADMIN")) {
      return next();
    }

    // Check if user has all requested permissions
    const hasAll = requiredPermissions.every((perm) => req.user!.permissions.includes(perm));
    if (!hasAll) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You do not have the required permissions: [${requiredPermissions.join(", ")}]`,
      });
    }

    next();
  };
}

// RBAC Middleware to check role
export function hasRole(roles: string | string[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Super Admin bypasses all checks
    if (req.user.roles.includes("Super Admin") || req.user.roles.includes("SUPER_ADMIN")) {
      return next();
    }

    // Check if user has any of the allowed roles
    const hasAnyRole = allowedRoles.some((role) => req.user!.roles.includes(role));
    if (!hasAnyRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles [${allowedRoles.join(", ")}]`,
      });
    }

    next();
  };
}

// Legacy helpers for backward compatibility with existing route imports
export function requirePermission(permissionName: string) {
  return hasPermission(permissionName);
}

export function requireRole(allowedRoles: string[]) {
  return hasRole(allowedRoles);
}
