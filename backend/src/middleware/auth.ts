import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { User } from "../modules/users/user.model";
import { Role } from "../modules/rbac/role.model";
import { Permission } from "../modules/rbac/permission.model";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
    permissions: string[];
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
    
    // Fetch user and their role with associated permissions
    const user = await User.findByPk(decoded.id, {
      include: [
        {
          model: Role,
          as: "role",
          include: [
            {
              model: Permission,
              as: "permissions",
              attributes: ["name"],
            },
          ],
        },
      ],
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "User not found or deactivated" });
    }

    const permissions = user.role.permissions.map((p: any) => p.name);

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role.name,
      permissions,
    };

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

// RBAC Middleware to check permission
export function requirePermission(permissionName: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (req.user.role === "SUPER_ADMIN") {
      return next(); // Super admin overrides all permission checks
    }

    if (!req.user.permissions.includes(permissionName)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You do not have the '${permissionName}' permission`,
      });
    }

    next();
  };
}

// RBAC Middleware to check role
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (req.user.role === "SUPER_ADMIN" || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Forbidden: Access restricted to roles [${allowedRoles.join(", ")}]`,
    });
  };
}
