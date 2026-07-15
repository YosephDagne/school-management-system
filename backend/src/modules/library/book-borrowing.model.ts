import { Model, DataTypes } from "sequelize";
import sequelize from "../../config/database";

export class BookBorrowing extends Model {
  public id!: string;
  public bookId!: string;
  public studentId?: string;
  public teacherId?: string;
  public borrowDate!: Date;
  public dueDate!: Date;
  public returnDate?: Date;
  public status!: string; // 'Borrowed' | 'Returned' | 'Overdue'
  public fineAmount!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

BookBorrowing.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bookId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    teacherId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    borrowDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    returnDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "Borrowed",
      allowNull: false,
    },
    fineAmount: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0.00,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "book_borrowings",
  }
);
