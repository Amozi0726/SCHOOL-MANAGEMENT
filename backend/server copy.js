
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

// =====================================
// 1. MIDDLEWARE
// =====================================

app.use(cors());
app.use(express.json());

// =====================================
// 2. HELPER FUNCTIONS
// =====================================

function isValidId(id) {
    return /^\d+$/.test(String(id)) &&
        Number.isSafeInteger(Number(id)) &&
        Number(id) > 0;
}

function handleDatabaseError(
    res,
    error,
    operation = "Database error"
) {
    console.error(operation + ":", error.message);

    if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
            success: false,
            message: "This record already exists."
        });
    }

    return res.status(500).json({
        success: false,
        message: error.message
    });
}

// =====================================
// 3. HOME AND DATABASE TEST
// =====================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "School Management System backend is running."
    });
});

app.get("/test-db", (req, res) => {
    db.query("SELECT 1 AS test", (error, results) => {
        if (error) {
            return handleDatabaseError(res, error);
        }

        res.json({
            success: true,
            message: "Database connection successful!",
            result: results[0]
        });
    });
});

// =====================================
// 4. STUDENTS
// =====================================

app.get("/students", (req, res) => {
    db.query(
        "SELECT * FROM students ORDER BY student_id DESC",
        (error, results) => {
            if (error) {
                return handleDatabaseError(res, error);
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
            message: "Fill in all required student fields."
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
                return handleDatabaseError(
                    res, error, "Student registration"
                );
            }

            res.status(201).json({
                success: true,
                message: "Student registered successfully.",
                student_id: result.insertId
            });
        }
    );
});

// =====================================
// 5. CLASSES
// =====================================

app.get("/classes", (req, res) => {
    db.query(
        "SELECT * FROM classes ORDER BY class_id DESC",
        (error, results) => {
            if (error) {
                return handleDatabaseError(res, error);
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
                return handleDatabaseError(
                    res, error, "Class registration"
                );
            }

            res.status(201).json({
                success: true,
                message: "Class registered successfully.",
                class_id: result.insertId
            });
        }
    );
});

// =====================================
// 6. TEACHERS
// =====================================

app.get("/teachers", (req, res) => {
    db.query(
        "SELECT * FROM teachers ORDER BY teacher_id DESC",
        (error, results) => {
            if (error) {
                return handleDatabaseError(res, error);
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
                return handleDatabaseError(
                    res, error, "Teacher registration"
                );
            }

            res.status(201).json({
                success: true,
                message: "Teacher registered successfully.",
                teacher_id: result.insertId
            });
        }
    );
});

// =====================================
// 7. SUBJECTS
// =====================================

app.get("/subjects", (req, res) => {
    db.query(
        "SELECT * FROM subjects ORDER BY subject_id DESC",
        (error, results) => {
            if (error) {
                return handleDatabaseError(res, error);
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
        INSERT INTO subjects
        (subject_name, subject_code, description)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [subject_name, subject_code, description || null],
        (error, result) => {
            if (error) {
                return handleDatabaseError(
                    res, error, "Subject registration"
                );
            }

            res.status(201).json({
                success: true,
                message: "Subject registered successfully.",
                subject_id: result.insertId
            });
        }
    );
});

// =====================================
// 8. ASSIGNMENT OPTIONS
// =====================================

app.get("/assignment-options", (req, res) => {
    const teachersSql = `
        SELECT teacher_id,
        CONCAT(first_name, ' ', last_name) AS name
        FROM teachers ORDER BY first_name
    `;

    const subjectsSql = `
        SELECT subject_id, subject_name AS name
        FROM subjects ORDER BY subject_name
    `;

    const classesSql = `
        SELECT class_id, class_name AS name
        FROM classes ORDER BY class_name
    `;

    db.query(teachersSql, (error, teachers) => {
        if (error) {
            return handleDatabaseError(res, error, "Loading teachers");
        }

        db.query(subjectsSql, (error, subjects) => {
            if (error) {
                return handleDatabaseError(res, error, "Loading subjects");
            }

            db.query(classesSql, (error, classes) => {
                if (error) {
                    return handleDatabaseError(res, error, "Loading classes");
                }

                res.json({
                    success: true,
                    data: { teachers, subjects, classes }
                });
            });
        });
    });
});

// =====================================
// 9. ASSIGNMENTS
// =====================================

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
                return handleDatabaseError(
                    res, error, "Creating assignment"
                );
            }

            res.status(201).json({
                success: true,
                message: "Assignment created successfully.",
                assignment_id: result.insertId
            });
        }
    );
});

app.delete("/assignments/:id", (req, res) => {
    const id = req.params.id;

    if (!isValidId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid assignment ID."
        });
    }

    db.query(
        "DELETE FROM teacher_subject_assignments WHERE assignment_id = ?",
        [Number(id)],
        (error, result) => {
            if (error) {
                return handleDatabaseError(
                    res, error, "Deleting assignment"
                );
            }

            if (result.affectedRows === 0) {
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

// =====================================
// 10. ATTENDANCE MANAGEMENT
// =====================================

// GET ALL ATTENDANCE RECORDS
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
            return handleDatabaseError(
                res, error, "Loading attendance records"
            );
        }

        res.json({ success: true, data: results });
    });
});

// GET STUDENTS IN A CLASS FOR A DATE
app.get("/attendance/students", (req, res) => {
    const { class_name, date } = req.query;

    if (!class_name || !date) {
        return res.status(400).json({
            success: false,
            message: "Please provide the class name and date."
        });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
            success: false,
            message: "Date must use YYYY-MM-DD format."
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

// RECORD OR UPDATE ATTENDANCE
app.post("/attendance", (req, res) => {
    const {
        student_id,
        attendance_date,
        status,
        remarks
    } = req.body;

    const allowedStatuses = ["Present", "Absent", "Late", "Excused"];

    if (!isValidId(student_id)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid student ID."
        });
    }

    if (
        !attendance_date ||
        !/^\d{4}-\d{2}-\d{2}$/.test(attendance_date)
    ) {
        return res.status(400).json({
            success: false,
            message: "Please provide a date in YYYY-MM-DD format."
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
        [
            Number(student_id),
            attendance_date,
            status,
            remarks || null
        ],
        (error) => {
            if (error) {
                return handleDatabaseError(
                    res, error, "Saving attendance"
                );
            }

            res.json({
                success: true,
                message: "Attendance saved successfully."
            });
        }
    );
});

// =====================================
// 11. DIAGNOSTIC ROUTE
// Confirms which server.js is running
// =====================================

app.get("/attendance-check", (req, res) => {
    res.json({
        success: true,
        message: "Attendance routes are loaded.",
        serverFile: __filename
    });
});

// =====================================
// 12. ROUTE NOT FOUND
// Keep this AFTER all routes
// =====================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

// =====================================
// 13. START SERVER
// =====================================

app.listen(PORT, () => {
    console.log("----------------------------------------");
    console.log("School Management System API");
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`Attendance: http://localhost:${PORT}/attendance`);
    console.log(`Attendance check: http://localhost:${PORT}/attendance-check`);
    console.log(`Database test: http://localhost:${PORT}/test-db`);
    console.log("Loaded file:", __filename);
    console.log("----------------------------------------");
});
