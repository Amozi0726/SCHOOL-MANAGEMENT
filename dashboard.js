
const API_URL = "http://localhost:5000/students";

document.addEventListener("DOMContentLoaded", function () {

    // 1. Logout
    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            const confirmLogout = confirm(
                "Are you sure you want to log out?"
            );

            if (confirmLogout) {
                window.location.href = "index.html";
            }
        });
    }

    // 2. Add Student button
    const addStudentButton = document.getElementById("addStudentButton");

    if (addStudentButton) {
        addStudentButton.addEventListener("click", function () {
            window.location.href = "students.html";
        });
    }

    // 3. Quick Action buttons
    const actionButtons = document.querySelectorAll(".action-button");

    actionButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const action = button.dataset.action;

            if (action === "student") {
                window.location.href = "students.html";
                return;
            }

            const messages = {
                attendance: "The attendance module will be developed next.",
                results: "The examination results module will be developed next.",
                fees: "The fee payment module will be developed next."
            };

            if (messages[action]) {
                alert(messages[action]);
            }
        });
    });

    // 4. Load actual students from the database
    loadDashboardStudents();

});


// Load student records from the backend
async function loadDashboardStudents() {

    const totalStudentsElement =
        document.getElementById("totalStudents");

    const recentStudentsBody =
        document.getElementById("recentStudentsBody");

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to retrieve student records.");
        }

        const students = await response.json();

        // Update total number of students
        if (totalStudentsElement) {
            totalStudentsElement.textContent =
                students.length.toLocaleString();
        }

        // Display recent students
        if (!recentStudentsBody) {
            return;
        }

        recentStudentsBody.replaceChildren();

        if (students.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 4;
            cell.textContent = "No students registered yet.";

            row.appendChild(cell);
            recentStudentsBody.appendChild(row);

            return;
        }

        // Show up to five most recently returned records
        students.slice(0, 5).forEach(function (student) {

            const row = document.createElement("tr");

            const admissionCell = document.createElement("td");
            admissionCell.textContent = student.admission_number || "";

            const nameCell = document.createElement("td");
            nameCell.textContent =
                `${student.first_name || ""} ${student.last_name || ""}`.trim();

            const classCell = document.createElement("td");
            classCell.textContent = student.class_name || "";

            const statusCell = document.createElement("td");
            const statusLabel = document.createElement("span");

            statusLabel.className = "status active-status";
            statusLabel.textContent = "Registered";

            statusCell.appendChild(statusLabel);

            row.append(
                admissionCell,
                nameCell,
                classCell,
                statusCell
            );

            recentStudentsBody.appendChild(row);
        });

    } catch (error) {
        console.error("Dashboard error:", error);

        if (totalStudentsElement) {
            totalStudentsElement.textContent = "—";
        }

        if (recentStudentsBody) {
            recentStudentsBody.replaceChildren();

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 4;
            cell.textContent =
                "Unable to load students. Check the backend connection.";

            row.appendChild(cell);
            recentStudentsBody.appendChild(row);
        }
    }
}
