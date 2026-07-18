import { Fee } from "./fee.model";
import { Payment } from "./payment.model";
import { Student } from "../students/student.model";

export class FinanceService {
  // 1. Create a Fee Template
  static async createFee(data: {
    title: string;
    amount: number;
    gradeLevel?: number;
    dueDate: Date;
    academicYear: string;
  }) {
    const fee = await Fee.create({
      title: data.title,
      amount: data.amount,
      gradeLevel: data.gradeLevel,
      dueDate: data.dueDate,
      academicYear: data.academicYear,
    });
    return fee;
  }

  // 2. Get all fees
  static async getAllFees() {
    return await Fee.findAll({ order: [["createdAt", "DESC"]] });
  }

  // 2. Process a Payment receipt
  static async recordPayment(data: {
    studentId: string;
    feeId: string;
    amountPaid: number;
    paymentMethod: string;
    transactionReference?: string;
  }) {
    const student = await Student.findByPk(data.studentId);
    if (!student) throw new Error("Student not found");

    const fee = await Fee.findByPk(data.feeId);
    if (!fee) throw new Error("Fee template not found");

    // Generate unique receipt number: e.g. RCP-YYYYMMDD-XXXX
    const rand = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `RCP-${Date.now().toString().slice(-6)}-${rand}`;

    // Get previous payments for this fee-student to calculate status
    const previousPayments = await Payment.findAll({
      where: { studentId: data.studentId, feeId: data.feeId },
    });

    const previousPaidSum = previousPayments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
    const totalPaid = previousPaidSum + Number(data.amountPaid);
    
    let status = "Partially_Paid";
    if (totalPaid >= Number(fee.amount)) {
      status = "Paid";
    }

    const payment = await Payment.create({
      studentId: data.studentId,
      feeId: data.feeId,
      amountPaid: data.amountPaid,
      paymentMethod: data.paymentMethod,
      transactionReference: data.transactionReference,
      receiptNumber,
      status,
    });

    return payment;
  }

  // 3. Get Student Billing Ledger
  static async getStudentFeesLedger(studentId: string) {
    const student = await Student.findByPk(studentId);
    if (!student) throw new Error("Student not found");

    // Fetch all general fees or fees matched to student's grade level
    const fees = await Fee.findAll({
      where: {
        gradeLevel: student.classId ? [null as any] : [null as any], // We can fetch general or specific grade fees
      },
    });

    // Alternatively, fetch all fees
    const allFees = await Fee.findAll();
    const studentClass = student.classId ? await student.classId : null;
    
    // In our system, fees either apply to all (gradeLevel is null) or to the student's grade
    // Let's resolve student's class gradeLevel
    let studentGradeLevel: number | null = null;
    if (student.classId) {
      const cls = await (student as any).getClass();
      if (cls) studentGradeLevel = cls.gradeLevel;
    }

    const applicableFees = allFees.filter(
      (f) => f.gradeLevel === null || f.gradeLevel === studentGradeLevel
    );

    const ledger = [];
    for (const fee of applicableFees) {
      const payments = await Payment.findAll({
        where: { studentId, feeId: fee.id },
      });

      const amountPaid = payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
      const remainingBalance = Number(fee.amount) - amountPaid;

      ledger.push({
        feeId: fee.id,
        title: fee.title,
        totalAmount: Number(fee.amount),
        dueDate: fee.dueDate,
        academicYear: fee.academicYear,
        amountPaid,
        balance: remainingBalance,
        status: amountPaid === 0 ? "Unpaid" : remainingBalance <= 0 ? "Paid" : "Partially_Paid",
        payments,
      });
    }

    return ledger;
  }
}
