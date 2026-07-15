import { Model, DataTypes } from "sequelize";
import sequelize from "../../config/database";

export class Notification extends Model {
  public id!: string;
  public recipientId!: string;
  public title!: string;
  public message!: string;
  public type!: string; // 'Email' | 'SMS' | 'InApp'
  public status!: string; // 'Sent' | 'Failed' | 'Read'
  public sentAt!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    recipientId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("Email", "SMS", "InApp"),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "Sent",
      allowNull: false,
    },
    sentAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "notifications",
  }
);
