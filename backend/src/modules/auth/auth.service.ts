import { User } from "../users/user.model";
import { Role } from "../rbac/role.model";
import { Permission } from "../rbac/permission.model";
import { Student } from "../students/student.model";
import { Parent } from "../parents/parent.model";
import { Teacher } from "../teachers/teacher.model";
import { comparePassword, hashPassword } from "../../utils/password";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { AuditService } from "../audit/audit.service";

type AuthResult = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email?: string;
    roles: string[];
    permissions: string[];
    studentId?: string;
    parentId?: string;
    teacherId?: string;
  };
};

export class AuthService {
  static async login(username: string, password: string, ipAddress?: string): Promise<AuthResult> {
    // 1. Fetch user by username including roles, permissions, and profiles
    const user = await User.findOne({
      where: { username },
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

    if (!user) {
      throw new Error("Invalid username or password");
    }

    if (!user.isActive) {
      throw new Error("Account is inactive. Please contact administration.");
    }

    // 2. Verify password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid username or password");
    }

    // 3. Update last login
    user.lastLogin = new Date();
    await user.save();

    // 4. Extract roles and aggregated permissions
    const roles = user.roles.map((r: any) => r.name);
    const permissions = Array.from(
      new Set(user.roles.flatMap((r: any) => r.permissions.map((p: any) => p.name)))
    );

    // 5. Generate tokens
    const tokenPayload = { id: user.id, username: user.username };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // 6. Audit log
    await AuditService.log(user.id, "LOGIN", "Auth", ipAddress, { username });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles,
        permissions,
        studentId: (user as any).student?.id,
        parentId: (user as any).parent?.id,
        teacherId: (user as any).teacher?.id,
      },
    };
  }

  static async refreshToken(token: string): Promise<{ accessToken: string }> {
    let decoded: any;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      throw new Error("Invalid or expired refresh token");
    }

    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      throw new Error("User not found or deactivated");
    }

    const accessToken = generateAccessToken({ id: user.id, username: user.username });
    return { accessToken };
  }

  static async logout(userId: string, ipAddress?: string) {
    await AuditService.log(userId, "LOGOUT", "Auth", ipAddress, {});
  }

  static async changePassword(userId: string, oldPass: string, newPass: string, ipAddress?: string) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isMatch = await comparePassword(oldPass, user.password);
    if (!isMatch) {
      throw new Error("Incorrect current password");
    }

    user.password = await hashPassword(newPass);
    await user.save();

    await AuditService.log(userId, "CHANGE_PASSWORD", "Auth", ipAddress, {});
    return true;
  }
}
