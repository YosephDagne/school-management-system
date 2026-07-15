import http from "http";

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

// Helper function to make HTTP requests
function request(method: string, path: string, body?: any, token?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const options: http.RequestOptions = {
      method,
      headers,
    };

    const req = http.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode && res.statusCode >= 400) {
            reject({ status: res.statusCode, message: parsed.message || data });
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject({ status: res.statusCode, message: data });
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("=== STARTING INTEGRATION TESTS ===");
  try {
    // 1. Login as Admin
    console.log("\n1. Testing Login as Admin...");
    const loginRes = await request("POST", "/auth/login", {
      username: "admin",
      password: "admin123",
    });
    const token = loginRes.data.token;
    console.log("✓ Login successful, Token obtained!");

    // 2. Create a Parent
    console.log("\n2. Testing Parent Creation...");
    const parentRes = await request("POST", "/registrar/parents", {
      username: "parent_yoseph",
      email: "yoseph_parent@gmail.com",
      fullName: "Yoseph Dagne Senior",
      phoneNumber: "+251911223344",
      address: "Addis Ababa, Bole Subcity",
    }, token);
    const parentId = parentRes.data.parent.id;
    console.log(`✓ Parent registered. ID: ${parentId}`);

    // 3. Create a Teacher
    console.log("\n3. Testing Teacher Creation...");
    const teacherRes = await request("POST", "/registrar/teachers", {
      username: "teacher_abebe",
      email: "abebe@school.com",
      employeeId: "EMP001",
      firstName: "Abebe",
      middleName: "Kebede",
      lastName: "Mamo",
      phoneNumber: "+251912345678",
      qualification: "BSc in Mathematics",
      specialization: "Calculus",
    }, token);
    const teacherId = teacherRes.data.teacher.id;
    const teacherTokenRes = await request("POST", "/auth/login", {
      username: "teacher_abebe",
      password: "teacher123",
    });
    const teacherToken = teacherTokenRes.data.token;
    console.log(`✓ Teacher registered. ID: ${teacherId}`);

    // 4. Create a Class
    console.log("\n4. Testing Class Section Creation...");
    const classRes = await request("POST", "/registrar/classes", {
      name: "Grade 9A",
      gradeLevel: 9,
      academicYear: "2026-2027",
      homeroomTeacherId: teacherId,
    }, token);
    const classId = classRes.data.id;
    console.log(`✓ Class Section created. ID: ${classId}`);

    // 5. Create a Subject
    console.log("\n5. Testing Subject Creation...");
    const subjectRes = await request("POST", "/registrar/subjects", {
      name: "Mathematics Grade 9",
      code: "MATH-09",
      gradeLevel: 9,
      stream: "General",
    }, token);
    const subjectId = subjectRes.data.id;
    console.log(`✓ Subject created. ID: ${subjectId}`);

    // 6. Map Subject & Teacher to Class (ClassSubject)
    console.log("\n6. Testing Class-Subject Assignment...");
    const classSubjectRes = await request("POST", "/registrar/class-subjects", {
      classId,
      subjectId,
      teacherId,
    }, token);
    const classSubjectId = classSubjectRes.data.id;
    console.log(`✓ ClassSubject mapping completed. ID: ${classSubjectId}`);

    // 7. Enroll a Student
    console.log("\n7. Testing Student Enrollment...");
    const studentRes = await request("POST", "/registrar/students", {
      username: "student_yoseph",
      email: "yoseph_student@gmail.com",
      admissionNumber: "ADM2026-001",
      firstName: "Yoseph",
      middleName: "Dagne",
      lastName: "Junior",
      gender: "M",
      dateOfBirth: "2010-05-15",
      parentId,
      classId,
    }, token);
    const studentId = studentRes.data.student.id;
    console.log(`✓ Student enrolled. ID: ${studentId}`);

    // 8. Take Attendance (by Teacher)
    console.log("\n8. Testing Daily Homeroom Attendance taking...");
    const attendanceRes = await request("POST", "/attendance", {
      studentId,
      classId,
      date: "2026-09-15",
      status: "Present",
    }, teacherToken);
    console.log("✓ Attendance logged:", attendanceRes.data.status);

    // 9. Create Exams (by Teacher)
    console.log("\n9. Testing Exam Setup...");
    const midExamRes = await request("POST", "/exams", {
      name: "Mid Term Exam",
      type: "Exam",
      classSubjectId,
      maxMarks: 40,
      weightage: 40.00,
      semester: "Semester_1",
      academicYear: "2026-2027",
    }, teacherToken);
    const finalExamRes = await request("POST", "/exams", {
      name: "Final Exam",
      type: "Exam",
      classSubjectId,
      maxMarks: 60,
      weightage: 60.00,
      semester: "Semester_1",
      academicYear: "2026-2027",
    }, teacherToken);
    console.log("✓ Exams created with weightages 40% (Mid) and 60% (Final).");

    // 10. Record Grades for Student (by Teacher)
    console.log("\n10. Testing Marks Entry...");
    await request("POST", "/grades", {
      examId: midExamRes.data.id,
      studentId,
      marksObtained: 36, // 36 out of 40 = 90%
      remarks: "Great score",
    }, teacherToken);
    await request("POST", "/grades", {
      examId: finalExamRes.data.id,
      studentId,
      marksObtained: 54, // 54 out of 60 = 90%
      remarks: "Excellent job",
    }, teacherToken);
    console.log("✓ Student grades submitted.");

    // 11. Calculate Class Rankings
    console.log("\n11. Testing Class Ranking Calculation...");
    const rankingRes = await request("GET", `/grades/class/${classId}/rankings?semester=Semester_1&academicYear=2026-2027`, null, teacherToken);
    console.log("✓ Class rankings generated:");
    console.table(rankingRes.data.map((r: any) => ({
      Rank: r.rank,
      Name: `${r.firstName} ${r.lastName}`,
      Admission: r.admissionNumber,
      "Average Score": `${r.average}%`,
      "Grand Total": r.grandTotal
    })));

    // 12. Catalog Library Book
    console.log("\n12. Testing Library Book Cataloging...");
    const bookRes = await request("POST", "/library/books", {
      title: "Introduction to Calculus",
      author: "James Stewart",
      isbn: "978-0538497817",
      quantity: 5,
    }, token);
    const bookId = bookRes.data.id;
    console.log(`✓ Library catalog updated. Book ID: ${bookId}`);

    // 13. Borrow Library Book
    console.log("\n13. Testing Library Book Checkout...");
    const borrowRes = await request("POST", "/library/borrow", {
      bookId,
      studentId,
      dueDate: "2026-10-15",
    }, token);
    const borrowingId = borrowRes.data.id;
    console.log(`✓ Book checkout logged. Borrowing ID: ${borrowingId}`);

    // 14. Return Library Book
    console.log("\n14. Testing Library Book Return...");
    const returnRes = await request("POST", `/library/return/${borrowingId}`, null, token);
    console.log(`✓ Book return processed. Fine incurred: ${returnRes.data.fineAmount} Birr`);

    // 15. Create Fee Invoice & Log Payment
    console.log("\n15. Testing Fees Ledger & Payments...");
    const feeRes = await request("POST", "/finance/fees", {
      title: "Grade 9 Tuition Semester 1",
      amount: 4500.00,
      gradeLevel: 9,
      dueDate: "2026-09-30",
      academicYear: "2026-2027",
    }, token);
    const feeId = feeRes.data.id;
    
    // Log payment (bank transfer CBE reference)
    const paymentRes = await request("POST", "/finance/payments", {
      studentId,
      feeId,
      amountPaid: 4500.00,
      paymentMethod: "BankTransfer",
      transactionReference: "CBE-TXN-998877",
    }, token);
    console.log(`✓ Tuition payment saved. Receipt: ${paymentRes.data.receiptNumber}, Status: ${paymentRes.data.status}`);

    const ledgerRes = await request("GET", `/finance/ledger/${studentId}`, null, token);
    console.log("✓ Final student billing ledger calculated:");
    console.table(ledgerRes.data.map((l: any) => ({
      Title: l.title,
      Total: l.totalAmount,
      Paid: l.amountPaid,
      Balance: l.balance,
      Status: l.status,
    })));

    console.log("\n=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ===");
  } catch (error: any) {
    console.error("\n❌ Test Failed:", error);
  }
}

// Execute tests
runTests();
