import { Model, DataTypes } from "sequelize";
import sequelize from "../../config/database";

export class Payment extends Model {
  public id!: string;
  public studentId!: string;
  public feeId!: string;
  public amountPaid!: number;
  public paymentDate!: Date;
  public paymentMethod!: string; // 'Cash' | 'BankTransfer' | 'MobileMoney'
  public transactionReference?: string;
  public receiptNumber!: string;
  public status!: string; // 'Paid' | 'Partially_Paid' | 'Pending'

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Payment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    feeId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    amountPaid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    paymentDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    transactionReference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    receiptNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "Paid",
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "payments",
  }
);
