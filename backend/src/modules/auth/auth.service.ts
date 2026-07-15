import { User } from "../users/user.model";
import { Role } from "../rbac/role.model";
import { Permission } from "../rbac/permission.model";
import { comparePassword, hashPassword } from "../../utils/password";
import { generateToken } from "../../utils/jwt";

export class AuthService {
  static async login(username: string, password: string) {
    // 1. Fetch user by username including role and permissions
    const user = await User.findOne({
      where: { username },
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

    // 4. Extract permission list
    const permissions = user.role.permissions.map((p: any) => p.name);

    // 5. Generate token
    const token = generateToken({ id: user.id, username: user.username, role: user.role.name });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role.name,
        permissions,
      },
    };
  }

  static async changePassword(userId: string, oldPass: string, newPass: string) {
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
    return true;
  }
}
