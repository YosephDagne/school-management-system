import { Model, DataTypes } from "sequelize";
import sequelize from "../../config/database";

export class UserRole extends Model {
  public id!: string;
  public userId!: string;
  public roleId!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserRole.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "roles",
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "user_roles",
    indexes: [
      {
        unique: true,
        fields: ["userId", "roleId"],
      },
    ],
  }
);
