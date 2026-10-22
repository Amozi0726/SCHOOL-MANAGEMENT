// =====================================================
// SCHOOL MANAGEMENT SYSTEM - BACKEND SERVER
// Node.js + Express + MySQL
// =====================================================

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

// =====================================================
// 1. MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());

// =====================================================
// 2. HELPER FUNCTIONS
// =====================================================

function isValidId(id) {
    return /^\d+$/.test(String(id)) &&
        Number.isSafeInteger(Number(id)) &&
        Number(id) > 0;
}

function handleDatabaseError(res, error, operation = "Database error") {
    console.error(`${operation}:`, error.message);

    if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
            success: false,
            message: "This record already exists. Check for duplicate values."
        });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({
            success: false,
            message: "The selected related record does not exist."
        });
    }

    return res.status(500).json({
        success: false,
        message: "A database error occurred. Check the backend terminal."
    });
}

function requireId(req, res, next) {
    if (!isValidId(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid record ID."
        });
    }

    next();
}

// =====================================================
// 3. HOME AND DATABASE TEST
// =====================================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "School Management System backend is running."
    });
});

app.get("/test-db", (req, res) => {
    db.query("SELECT 1 AS test", (error, results) => {
        if (error) {
            return handleDatabaseError(res, error, "Testing database");
        }

        res.json({
            success: true,
            message: "Database connection successful!",
            result: results[0]
        });
    });
});

// =====================================================
// 4. STUDENTS
// =====================================================

app.get("/students", (req, res) => {
    db.query(
        "SELECT * FROM students ORDER BY student_id DESC",
        (error, results) => {
            if (error) {
                return handleDatabaseError(res, error, "Loading students");
            }

            res.json(results);
        }
    );
});

app.post("/students", (req, res) => {
    const {
        admission_number,
        first_name,
        last_name,
        gender,
        date_of_birth,
        class_name,
        phone,
        email
    } = req.body;

    if (
        !admission_number ||
        !first_name ||
        !last_name ||
        !gender ||
        !class_name
    ) {
        return res.status(400).json({
            success: false,
            message: "Admission number, names, gender and class are required."
        });
    }

    const sql = `
        INSERT INTO students (
            admission_number, first_name, last_name, gender,
            date_of_birth, class_name, phone, email
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            admission_number,
            first_name,
            last_name,
            gender,
            date_of_birth || null,
            class_name,
            phone || null,
            email || null
        ],
        (error, result) => {
            if (error) {
                return handleDatabaseError(res, error, "Registering student");
            }

            res.status(201).json({
                success: true,
                message: "Student registered successfully.",
                student_id: result.insertId
            });
        }
    );
});

app.put("/students/:id", requireId, (req, res) => {
    const {
        admission_number,
        first_name,
        last_name,
        gender,
        date_of_birth,
        class_name,
        phone,
        email
    } = req.body;

    if (
        !admission_number ||
        !first_name ||
        !last_name ||
        !gender ||
        !class_name
    ) {
        return res.status(400).json({
            success: false,
            message: "Complete all required student fields."
        });
    }

    const sql = `
        UPDATE students
        SET admission_number = ?,
            first_name = ?,
            last_name = ?,
            gender = ?,
            date_of_birth = ?,
            class_name = ?,
            phone = ?,
            email = ?
        WHERE student_id = ?
    `;

    db.query(
        sql,
        [
            admission_number,
            first_name,
            last_name,
            gender,
            date_of_birth || null,
            class_name,
            phone || null,
            email || null,
            Number(req.params.id)
        ],
        (error, result) => {
            if (error) {
                return handleDatabaseError(res, error, "Updating student");
            }

            if (!result.affectedRows) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found."
                });
            }

            res.json({
                success: true,
                message: "Student updated successfully."
            });
        }
    );
});

app.delete("/students/:id", requireId, (req, res) => {
    db.query(
        "DELETE FROM students WHERE student_id = ?",
        [Number(req.params.id)],
        (error, result) => {
            if (error) {
                return handleDatabaseError(res, error, "Deleting student");
            }

            if (!result.affectedRows) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found."
                });
            }

            res.json({
                success: true,
                message: "Student deleted successfully."
            });
        }
    );
});

// =====================================================
// 5. CLASSES
// =====================================================

app.get("/classes", (req, res) => {
    db.query(
        "SELECT * FROM classes ORDER BY class_id DESC",
        (error, results) => {
            if (error) {
                return handleDatabaseError(res, error, "Loading classes");
            }

            res.json(results);
        }
    );
});

app.post("/classes", (req, res) => {
    const {
        class_name,
        class_teacher,
        room_number,
        academic_year
    } = req.body;

    if (!class_name) {
        return res.status(400).json({
            success: false,
            message: "Class name is required."
        });
    }

    const sql = `
        INSERT INTO classes
            (class_name, class_teacher, room_number, academic_year)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            class_name,
            class_teacher || null,
            room_number || null,
            academic_year || null
        ],
        (error, result) => {
            if (error) {
                return handleDatabaseError(res, error, "Creating class");
            }

            res.status(201).json({
                success: true,
                message: "Class registered successfully.",
                class_id: result.insertId
            });
        }
    );
});

app.put("/classes/:id", requireId, (req, res) => {
    const {
        class_name,
        class_teacher,
        room_number,
        academic_year
    } = req.body;

    if (!class_name) {
        return res.status(400).json({
            success: false,
            message: "Class name is required."
        });
    }

    const sql = `
        UPDATE classes
        SET class_name = ?,
            class_teacher = ?,
            room_number = ?,
            academic_year = ?
        WHERE class_id = ?
    `;

    db.query(
        sql,
        [
            class_name,
            class_teacher || null,
            room_number || null,
            academic_year || null,
            Number(req.params.id)
        ],
        (error, result) => {
            if (error) {
                return handleDatabaseError(res, error, "Updating class");
            }

            if (!result.affectedRows) {
                return res.status(404).json({
                    success: false,
                    message: "Class not found."
                });
            }

            res.json({
                success: true,
                message: "Class updated successfully."
            });
        }
    );
});

app.delete("/classes/:id", requireId, (req, res) => {
    db.query(
        "DELETE FROM classes WHERE class_id = ?",
        [Number(req.params.id)],
        (error, result) => {
            if (error) {
                return handleDatabaseError(res, error, "Deleting class");
            }

            if (!result.affectedRows) {
                return res.status(404).json({
                    success: false,
                    message: "Class not found."
                });
            }

            res.json({
                success: true,
                message: "Class deleted successfully."
            });
        }
    );
});

// =====================================================
// 6. TEACHERS
// =====================================================

app.get("/teachers", (req, res) => {
    db.query(
        "SELECT * FROM teachers ORDER BY teacher_id DESC",
        (error, results) => {
            if (error) {
                return handleDatabaseError(res, error, "Loading teachers");
            }

            res.json(results);
        }
    );
});

app.post("/teachers", (req, res) => {
    const {
        first_name,
        last_name,
        gender,
        phone,
        email,
        subject,
        qualification,
        hire_date
    } = req.body;

    if (!first_name || !last_name || !gender || !subject) {
        return res.status(400).json({
            success: false,
            message: "First name, last name, gender and subject are required."
        });
    }

    const sql = `
        INSERT INTO teachers (
            first_name, last_name, gender, phone, email,
            subject, qualification, hire_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            first_name,
            last_name,
            gender,
            phone || null,
            email || null,
            subject,
            qualification || null,
            hire_date || null
        ],
        (error, result) => {
            if (error) {
                return handleDatabaseError(res, error, "Registering teacher");
            }

            res.status(201).json({
                success: true,
                message: "Teacher registered successfully.",
                teacher_id: result.insertId
            });
        }
    );
});

app.put("/teachers/:id", requireId, (req, res) => {
    const {
        first_name,
        last_name,
        gender,
        phone,
        email,
        subject,
        qualification,
        hire_date
    } = req.body;

    if (!first_name || !last_name || !gender || !subject) {
        return res.status(400).json({
            success: false,
            message: "Complete all required teacher fields."
        });
    }

    const sql = `
        UPDATE teachers
        SET first_name = ?,
            last_name = ?,
            gender = ?,
            phone = ?,
            email = ?,
            subject = ?,
            qualification = ?,
            hire_date = ?
        WHERE teacher_id = ?
    `;

    db.query(
        sql,
        [
            first_name,
            last_name,
            gender,
            phone || null,
            email || null,
            subject,
            qualification || null,
            hire_date || null,
            Number(req.params.id)
        ],
        (error, result) => {
            if (error) {
                return handleDatabaseError(res, error, "Updating teacher");
            }

            if (!result.affectedRows) {
                return res.status(404).json({
                    success: false,
                    message: "Teacher not found."
                });
            }

            res.json({
                success: true,
                message: "Teacher updated successfully."
            });
        }
    );
});

app.delete("/teachers/:id", requireId, (req, res) => {
    db.query(
        "DELETE FROM teachers WHERE teacher_id = ?",
        [Number(req.params.id)],
        (error, result) => {
            if (error) {
                return handleDatabaseError(res, error, "Deleting teacher");
            }

            if (!result.affectedRows) {
                return res.status(404).json({
                    success: false,
                    message: "Teacher not found."
                });
            }

            res.json({
                success: true,
                message: "Teacher deleted successfully."
            });
        }
    );
});

// =====================================================
// 7. SUBJECTS
// =====================================================

app.get("/subjects", (req, res) => {
    db.query(
        "SELECT * FROM subjects ORDER BY subject_id DESC",
        (error, results) => {
            if (error) {
                return handleDatabaseError(res, error, "Loading subjects");
            }

            res.json({
                success: true,
                data: results
            });
        }
    );
});

app.post("/subjects", (req, res) => {
    const { subject_name, subject_code, description } = req.body;

    if (!subject_name || !subject_code) {
        return res.status(400).json({
            success: false,
            message: "Subject name and subject code are required."
        });
    }

    const sql = `
        INSERT INTO subjects (subject_name, subject_code, description)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [subject_name, subject_code, description || null],
        (error, result) => {
            if (error) {
                return handleDatabaseError(res, error, "Creating subject");
            }

            res.status(201).json({
                success: true,
                message: "Subject registered successfully.",
                subject_id: result.insertId
            });
        }
    );
});

// =====================================================
// 8. ASSIGNMENT OPTIONS
// =====================================================

app.get("/assignment-options", (req, res) => {
    const teachersSql = `
        SELECT teacher_id,
               CONCAT(first_name, ' ', last_name) AS name
        FROM teachers
        ORDER BY first_name
    `;

    const subjectsSql = `
        SELECT subject_id, subject_name AS name
        FROM subjects
        ORDER BY subject_name
    `;

    const classesSql = `
        SELECT class_id, class_name AS name
        FROM classes
        ORDER BY class_name
    `;

    db.query(teachersSql, (error, teachers) => {
        if (error) {
            return handleDatabaseError(res, error, "Loading teacher options");
        }

        db.query(subjectsSql, (error, subjects) => {
            if (error) {
                return handleDatabaseError(res, error, "Loading subject options");
            }

            db.query(classesSql, (error, classes) => {
                if (error) {
                    return handleDatabaseError(res, error, "Loading class options");
                }

                res.json({
                    success: true,
                    data: { teachers, subjects, classes }
                });
            });
        });
    });
});

// =====================================================
// 9. TEACHER-SUBJECT-CLASS ASSIGNMENTS
// =====================================================

app.get("/assignments", (req, res) => {
    const sql = `
        SELECT
            a.assignment_id,
            a.teacher_id,
            a.subject_id,
            a.class_id,
            CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
            s.subject_name,
            c.class_name,
            a.assigned_at
        FROM teacher_subject_assignments a
        JOIN teachers t ON a.teacher_id = t.teacher_id
        JOIN subjects s ON a.subject_id = s.subject_id
        JOIN classes c ON a.class_id = c.class_id
        ORDER BY a.assignment_id DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            return handleDatabaseError(res, error, "Loading assignments");
        }

        res.json({ success: true, data: results });
    });
});

app.post("/assignments", (req, res) => {
    const { teacher_id, subject_id, class_id } = req.body;

    if (
        !isValidId(teacher_id) ||
        !isValidId(subject_id) ||
        !isValidId(class_id)
    ) {
        return res.status(400).json({
            success: false,
            message: "Select a valid teacher, subject and class."
        });
    }

    const sql = `
        INSERT INTO teacher_subject_assignments
            (teacher_id, subject_id, class_id)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [Number(teacher_id), Number(subject_id), Number(class_id)],
        (error, result) => {
            if (error) {
                return handleDatabaseError(res, error, "Creating assignment");
            }

            res.status(201).json({
                success: true,
                message: "Assignment created successfully.",
                assignment_id: result.insertId
            });
        }
    );
});

app.delete("/assignments/:id", requireId, (req, res) => {
    db.query(
        "DELETE FROM teacher_subject_assignments WHERE assignment_id = ?",
        [Number(req.params.id)],
        (error, result) => {
            if (error) {
                return handleDatabaseError(res, error, "Deleting assignment");
            }

            if (!result.affectedRows) {
                return res.status(404).json({
                    success: false,
                    message: "Assignment not found."
                });
            }

            res.json({
                success: true,
                message: "Assignment deleted successfully."
            });
        }
    );
});

// =====================================================
// 10. ATTENDANCE
// =====================================================

app.get("/attendance", (req, res) => {
    const sql = `
        SELECT
            a.attendance_id,
            a.student_id,
            s.admission_number,
            s.first_name,
            s.last_name,
            s.class_name,
            a.attendance_date,
            a.status,
            a.remarks
        FROM attendance a
        JOIN students s ON a.student_id = s.student_id
        ORDER BY a.attendance_date DESC, s.first_name ASC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            return handleDatabaseError(res, error, "Loading attendance");
        }

        res.json({ success: true, data: results });
    });
});

app.get("/attendance/students", (req, res) => {
    const { class_name, date } = req.query;

    if (!class_name || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
            success: false,
            message: "Provide a class name and date in YYYY-MM-DD format."
        });
    }

    const sql = `
        SELECT
            s.student_id,
            s.admission_number,
            s.first_name,
            s.last_name,
            s.class_name,
            a.status,
            a.remarks
        FROM students s
        LEFT JOIN attendance a
            ON s.student_id = a.student_id
            AND a.attendance_date = ?
        WHERE s.class_name = ?
        ORDER BY s.first_name, s.last_name
    `;

    db.query(sql, [date, class_name], (error, results) => {
        if (error) {
            return handleDatabaseError(
                res, error, "Loading students for attendance"
            );
        }

        res.json({ success: true, data: results });
    });
});

app.post("/attendance", (req, res) => {
    const { student_id, attendance_date, status, remarks } = req.body;
    const allowedStatuses = ["Present", "Absent", "Late", "Excused"];

    if (!isValidId(student_id)) {
        return res.status(400).json({
            success: false,
            message: "Provide a valid student ID."
        });
    }

    if (
        !attendance_date ||
        !/^\d{4}-\d{2}-\d{2}$/.test(attendance_date)
    ) {
        return res.status(400).json({
            success: false,
            message: "Provide a date in YYYY-MM-DD format."
        });
    }

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Choose Present, Absent, Late or Excused."
        });
    }

    const sql = `
        INSERT INTO attendance
            (student_id, attendance_date, status, remarks)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            remarks = VALUES(remarks)
    `;

    db.query(
        sql,
        [Number(student_id), attendance_date, status, remarks || null],
        (error) => {
            if (error) {
                return handleDatabaseError(res, error, "Saving attendance");
            }

            res.json({
                success: true,
                message: "Attendance saved successfully."
            });
        }
    );
});

app.get("/attendance-check", (req, res) => {
    res.json({
        success: true,
        message: "Attendance routes are loaded.",
        serverFile: __filename
    });
});

// =====================================================
// 11. EXAMINATIONS
// =====================================================

app.get("/examinations-check", (req, res) => {
    res.json({
        success: true,
        message: "Examinations routes are available.",
        serverFile: __filename
    });
});

app.get("/examinations", (req, res) => {
    const sql = `
        SELECT
            e.exam_id,
            e.exam_name,
            e.subject_id,
            s.subject_name,
            s.subject_code,
            e.class_name,
            e.term,
            e.exam_date,
            e.max_marks,
            e.academic_year
        FROM examinations e
        JOIN subjects s ON e.subject_id = s.subject_id
        ORDER BY e.exam_id DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            return handleDatabaseError(res, error, "Loading examinations");
        }

        res.json({ success: true, data: results });
    });
});

app.post("/examinations", (req, res) => {
    const {
        exam_name,
        subject_id,
        class_name,
        term,
        exam_date,
        max_marks,
        academic_year
    } = req.body;

    const maximum = Number(max_marks);

    if (
        typeof exam_name !== "string" || !exam_name.trim() ||
        !isValidId(subject_id) ||
        typeof class_name !== "string" || !class_name.trim() ||
        typeof term !== "string" || !term.trim() ||
        !exam_date || !/^\d{4}-\d{2}-\d{2}$/.test(exam_date) ||
        max_marks === "" || max_marks === null ||
        max_marks === undefined ||
        !Number.isFinite(maximum) || maximum <= 0 || maximum > 999.99
    ) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid exam name, subject, class, term, date and maximum marks."
        });
    }

    const sql = `
        INSERT INTO examinations (
            exam_name, subject_id, class_name, term,
            exam_date, max_marks, academic_year
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            exam_name.trim(),
            Number(subject_id),
            class_name.trim(),
            term.trim(),
            exam_date,
            maximum,
            academic_year || null
        ],
        (error, result) => {
            if (error) {
                return handleDatabaseError(
                    res, error, "Registering examination"
                );
            }

            res.status(201).json({
                success: true,
                message: "Examination registered successfully.",
                exam_id: result.insertId
            });
        }
    );
});

// =====================================================
// 12. EXAMINATION RESULTS
// =====================================================

app.get("/exam-results", (req, res) => {
    const { exam_id } = req.query;

    if (!isValidId(exam_id)) {
        return res.status(400).json({
            success: false,
            message: "Provide a valid examination ID."
        });
    }

    const sql = `
        SELECT
            r.result_id,
            r.exam_id,
            r.student_id,
            s.admission_number,
            s.first_name,
            s.last_name,
            s.class_name,
            e.exam_name,
            e.max_marks,
            r.marks_obtained,
            r.grade,
            r.remarks
        FROM exam_results r
        JOIN students s ON r.student_id = s.student_id
        JOIN examinations e ON r.exam_id = e.exam_id
        WHERE r.exam_id = ?
        ORDER BY s.first_name, s.last_name
    `;

    db.query(sql, [Number(exam_id)], (error, results) => {
        if (error) {
            return handleDatabaseError(
                res, error, "Loading examination results"
            );
        }

        res.json({ success: true, data: results });
    });
});

app.post("/exam-results", (req, res) => {
    const { exam_id, student_id, marks_obtained, remarks } = req.body;
    const marks = Number(marks_obtained);

    if (
        !isValidId(exam_id) ||
        !isValidId(student_id) ||
        marks_obtained === "" ||
        marks_obtained === null ||
        marks_obtained === undefined ||
        !Number.isFinite(marks) ||
        marks < 0 ||
        marks > 999.99
    ) {
        return res.status(400).json({
            success: false,
            message: "Provide valid examination, student and marks."
        });
    }

    const checkSql = `
        SELECT
            e.max_marks,
            e.class_name,
            s.class_name AS student_class
        FROM examinations e
        JOIN students s ON s.student_id = ?
        WHERE e.exam_id = ?
    `;

    db.query(
        checkSql,
        [Number(student_id), Number(exam_id)],
        (error, rows) => {
            if (error) {
                return handleDatabaseError(
                    res, error, "Checking examination and student"
                );
            }

            if (!rows.length) {
                return res.status(404).json({
                    success: false,
                    message: "Examination or student not found."
                });
            }

            const exam = rows[0];

            if (exam.class_name !== exam.student_class) {
                return res.status(400).json({
                    success: false,
                    message: "This student does not belong to the examination class."
                });
            }

            if (marks > Number(exam.max_marks)) {
                return res.status(400).json({
                    success: false,
                    message: `Marks cannot exceed ${exam.max_marks}.`
                });
            }

            const percentage = (marks / Number(exam.max_marks)) * 100;

            let grade;
            if (percentage >= 80) grade = "A";
            else if (percentage >= 70) grade = "B";
            else if (percentage >= 60) grade = "C";
            else if (percentage >= 50) grade = "D";
            else grade = "E";

            const saveSql = `
                INSERT INTO exam_results
                    (exam_id, student_id, marks_obtained, grade, remarks)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    marks_obtained = VALUES(marks_obtained),
                    grade = VALUES(grade),
                    remarks = VALUES(remarks)
            `;

            db.query(
                saveSql,
                [
                    Number(exam_id),
                    Number(student_id),
                    marks,
                    grade,
                    remarks || null
                ],
                (saveError) => {
                    if (saveError) {
                        return handleDatabaseError(
                            res, saveError, "Saving examination result"
                        );
                    }

                    res.json({
                        success: true,
                        message: "Examination result saved successfully.",
                        marks_obtained: marks,
                        grade,
                        percentage: Number(percentage.toFixed(2))
                    });
                }
            );
        }
    );
});

// =====================================================
// 13. FEES MANAGEMENT - ASSESSMENTS
// =====================================================

app.get("/fees", (req, res) => {
    const sql = `
        SELECT
            fa.assessment_id,
            fa.student_id,
            s.admission_number,
            s.first_name,
            s.last_name,
            s.class_name,
            fa.term,
            fa.academic_year,
            fa.fees_charged,
            COALESCE(SUM(fp.amount_paid), 0) AS amount_paid,
            fa.fees_charged - COALESCE(SUM(fp.amount_paid), 0) AS balance,
            MAX(fp.payment_date) AS payment_date,
            GROUP_CONCAT(
                fp.payment_method
                ORDER BY fp.payment_id SEPARATOR ', '
            ) AS payment_methods,
            GROUP_CONCAT(
                fp.receipt_number
                ORDER BY fp.payment_id SEPARATOR ', '
            ) AS receipt_numbers
        FROM fee_assessments fa
        JOIN students s ON s.student_id = fa.student_id
        LEFT JOIN fee_payments fp
            ON fp.assessment_id = fa.assessment_id
        GROUP BY
            fa.assessment_id,
            fa.student_id,
            s.admission_number,
            s.first_name,
            s.last_name,
            s.class_name,
            fa.term,
            fa.academic_year,
            fa.fees_charged
        ORDER BY fa.assessment_id DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            return handleDatabaseError(res, error, "Loading fee assessments");
        }

        res.json({ success: true, data: results });
    });
});

// =====================================================
// 14. FEE PAYMENT RECEIPTS
// =====================================================

app.get("/fee-payments-check", (req, res) => {
    res.json({
        success: true,
        message: "Fee payment routes are loaded.",
        serverFile: __filename
    });
});


app.get("/fee-payments", (req, res) => {
    const sql = `
        SELECT
            fp.payment_id,
            fp.assessment_id,
            fp.amount_paid,
            fp.payment_date,
            fp.payment_method,
            fp.receipt_number,
            fa.student_id,
            fa.term,
            fa.academic_year,
            fa.fees_charged,
            s.admission_number,
            s.first_name,
            s.last_name,
            s.class_name
        FROM fee_payments fp
        INNER JOIN fee_assessments fa
            ON fp.assessment_id = fa.assessment_id
        INNER JOIN students s
            ON fa.student_id = s.student_id
        ORDER BY fp.payment_date DESC, fp.payment_id DESC
    `;

db.query(sql, (error, results) => {
    if (error) {
        console.error("FEE PAYMENTS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load payment receipts.",
            error: error.message
        });
    }

    res.json({
        success: true,
        data: results
    });
});

});


// =====================================================
// 15. CREATE OR UPDATE FEE ASSESSMENT
// =====================================================

app.post("/fees", (req, res) => {
    const { student_id, term, academic_year, fees_charged } = req.body;

    const studentId = Number(student_id);
    const year = Number(academic_year);
    const fees = Number(fees_charged);

    if (
        !Number.isInteger(studentId) || studentId <= 0 ||
        typeof term !== "string" || !term.trim() ||
        !Number.isInteger(year) || year < 2000 || year > 2100 ||
        fees_charged === "" ||
        fees_charged === null ||
        fees_charged === undefined ||
        !Number.isFinite(fees) ||
        fees < 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid student, term, academic year and fee amount."
        });
    }

    const sql = `
        INSERT INTO fee_assessments
            (student_id, term, academic_year, fees_charged)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            fees_charged = VALUES(fees_charged)
    `;

    db.query(
        sql,
        [studentId, term.trim(), year, fees],
        (error) => {
            if (error) {
                return handleDatabaseError(
                    res, error, "Saving fee assessment"
                );
            }

            const lookupSql = `
                SELECT assessment_id
                FROM fee_assessments
                WHERE student_id = ?
                  AND term = ?
                  AND academic_year = ?
            `;

            db.query(
                lookupSql,
                [studentId, term.trim(), year],
                (lookupError, rows) => {
                    if (lookupError) {
                        return handleDatabaseError(
                            res, lookupError, "Finding fee assessment"
                        );
                    }

                    if (!rows.length) {
                        return res.status(500).json({
                            success: false,
                            message: "Assessment saved, but its ID could not be retrieved."
                        });
                    }

                    res.json({
                        success: true,
                        message: "Fee assessment saved successfully.",
                        assessment_id: rows[0].assessment_id
                    });
                }
            );
        }
    );
});

// =====================================================
// 16. RECORD FEE ASSESSMENT AND PAYMENT TOGETHER
// POST /fees/record
// =====================================================

app.post("/fees/record", async (req, res) => {
    const {
        student_id,
        term,
        academic_year,
        fees_charged,
        amount_paid = 0,
        payment_date,
        payment_method,
        receipt_number
    } = req.body;

    const studentId = Number(student_id);
    const year = Number(academic_year);
    const charged = Number(fees_charged);
    const paid = Number(amount_paid);

    const selectedTerm =
        typeof term === "string" ? term.trim() : "";

    const paymentDate =
        typeof payment_date === "string" ? payment_date.trim() : "";

    const paymentMethod =
        typeof payment_method === "string" ? payment_method.trim() : "";
const receipt =
    typeof receipt_number === "string" && receipt_number.trim() !== ""
        ? receipt_number.trim()
        : `SPMH-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    if (
        !Number.isInteger(studentId) || studentId <= 0 ||
        !selectedTerm || selectedTerm.length > 20 ||
        !Number.isInteger(year) || year < 2000 || year > 2100 ||
        !Number.isFinite(charged) || charged <= 0 ||
        Math.round(charged * 100) !== charged * 100 ||
        !Number.isFinite(paid) || paid < 0 ||
        Math.round(paid * 100) !== paid * 100
    ) {
        return res.status(400).json({
            success: false,
            message: "Enter valid student, term, year and fee amounts."
        });
    }

    if (paid > 0) {
        const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(paymentDate);
        let validDate = false;

        if (dateMatch) {
            const date = new Date(Date.UTC(
                Number(dateMatch[1]),
                Number(dateMatch[2]) - 1,
                Number(dateMatch[3])
            ));

            validDate =
                date.getUTCFullYear() === Number(dateMatch[1]) &&
                date.getUTCMonth() === Number(dateMatch[2]) - 1 &&
                date.getUTCDate() === Number(dateMatch[3]);
        }

        if (
            !validDate ||
            !paymentMethod ||
            paymentMethod.length > 30 ||
            !receipt ||
            receipt.length > 50
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid payment date, method and receipt number."
            });
        }
    }

    let connection;
    let transactionStarted = false;

    function queryAsync(sql, values = []) {
        return new Promise((resolve, reject) => {
            connection.query(sql, values, (error, results) => {
                if (error) reject(error);
                else resolve(results);
            });
        });
    }

    try {
        connection = await new Promise((resolve, reject) => {
            db.getConnection((error, conn) => {
                if (error) reject(error);
                else resolve(conn);
            });
        });

        await new Promise((resolve, reject) => {
            connection.beginTransaction(error => {
                if (error) reject(error);
                else resolve();
            });
        });

        transactionStarted = true;

        await queryAsync(
            `INSERT INTO fee_assessments
                (student_id, term, academic_year, fees_charged)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                fees_charged = VALUES(fees_charged)`,
            [studentId, selectedTerm, year, charged]
        );

        const assessments = await queryAsync(
            `SELECT assessment_id, fees_charged
             FROM fee_assessments
             WHERE student_id = ?
               AND term = ?
               AND academic_year = ?
             FOR UPDATE`,
            [studentId, selectedTerm, year]
        );

        if (!assessments.length) {
            const error = new Error("The fee assessment could not be found.");
            error.statusCode = 404;
            throw error;
        }

        const assessment = assessments[0];
        const assessmentId = assessment.assessment_id;

        const paymentTotals = await queryAsync(
            `SELECT COALESCE(SUM(amount_paid), 0) AS total_paid
             FROM fee_payments
             WHERE assessment_id = ?`,
            [assessmentId]
        );

        const totalPaid = Number(paymentTotals[0].total_paid || 0);
        const currentFees = Number(assessment.fees_charged);

        if (totalPaid > currentFees + 0.001) {
            const error = new Error(
                "The fees charged cannot be less than the amount already paid."
            );
            error.statusCode = 400;
            throw error;
        }

        const outstanding = Math.round((currentFees - totalPaid) * 100) / 100;

        if (paid > outstanding) {
            const error = new Error(
                `Payment exceeds the outstanding balance of KES ${outstanding.toFixed(2)}.`
            );
            error.statusCode = 400;
            throw error;
        }

        if (paid > 0) {
            await queryAsync(
                `INSERT INTO fee_payments
                    (assessment_id, amount_paid, payment_date,
                     payment_method, receipt_number)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    assessmentId,
                    paid,
                    paymentDate,
                    paymentMethod,
                    receipt
                ]
            );
        }

        await new Promise((resolve, reject) => {
            connection.commit(error => {
                if (error) reject(error);
                else resolve();
            });
        });

        transactionStarted = false;

        return res.json({
            success: true,
            message: paid > 0
                ? "Fee assessment and payment saved successfully."
                : "Fee assessment saved successfully.",
            assessment_id: assessmentId
        });
    } catch (error) {
        if (connection && transactionStarted) {
            await new Promise(resolve => {
                connection.rollback(() => resolve());
            });
        }

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "This receipt number already exists. Enter a unique receipt number."
            });
        }

        console.error("Fee assessment/payment error:", error.message);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode
                ? error.message
                : "Unable to save fee assessment and payment."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// =====================================================
// 17. UNKNOWN ROUTES
// =====================================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

// =====================================================
// 18. START SERVER
// =====================================================

app.listen(PORT, () => {
    console.log("========================================");
    console.log("School Management System API");
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`Students: http://localhost:${PORT}/students`);
    console.log(`Classes: http://localhost:${PORT}/classes`);
    console.log(`Teachers: http://localhost:${PORT}/teachers`);
    console.log(`Subjects: http://localhost:${PORT}/subjects`);
    console.log(`Assignments: http://localhost:${PORT}/assignments`);
    console.log(`Attendance: http://localhost:${PORT}/attendance`);
    console.log(`Examinations: http://localhost:${PORT}/examinations`);
    console.log(`Fees: http://localhost:${PORT}/fees`);
    console.log(`Fee payments: http://localhost:${PORT}/fee-payments`);
    console.log(`Database test: http://localhost:${PORT}/test-db`);
    console.log("Loaded file:", __filename);
    console.log("========================================");
});