import { Model, DataTypes } from "sequelize";
import sequelize from "../../config/database";

export class RolePermission extends Model {
  public id!: string;
  public roleId!: string;
  public permissionId!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RolePermission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "roles",
        key: "id",
      },
    },
    permissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "permissions",
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "role_permissions",
    indexes: [
      {
        unique: true,
        fields: ["roleId", "permissionId"],
      },
    ],
  }
);
