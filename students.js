
const API_URL = "http://localhost:5000/students";

const studentForm = document.getElementById("studentForm");
const studentTableBody = document.getElementById("studentTableBody");
const searchInput = document.getElementById("searchInput");
const message = document.getElementById("message");
const studentCount = document.getElementById("studentCount");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");
const formTitle = document.getElementById("formTitle");

let students = [];

// Show messages to the user
function showMessage(text, success = true) {
    message.textContent = text;
    message.style.color = success ? "#187647" : "#b42318";
}

// Read JSON responses and report server errors
async function readResponse(response) {
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "The request failed.");
    }

    return data;
}

// Load student records from MySQL through Node.js
async function loadStudents() {
    studentTableBody.innerHTML =
        '<tr><td colspan="7" class="empty-state">Loading student records...</td></tr>';

    try {
        const response = await fetch(API_URL);
        const data = await readResponse(response);

        students = Array.isArray(data) ? data : data.data;

        if (!Array.isArray(students)) {
            throw new Error("Unexpected student data returned by the server.");
        }

        searchStudents();
    } catch (error) {
        students = [];
        studentCount.textContent = "0";

        studentTableBody.innerHTML =
            '<tr><td colspan="7" class="empty-state">Unable to load student records.</td></tr>';

        showMessage(
            "Cannot connect to the Students API. Check that Node.js is running.",
            false
        );

        console.error("Loading students failed:", error);
    }
}

// Display records and update the total count
function displayStudents(list) {
    studentTableBody.replaceChildren();
    studentCount.textContent = students.length;

    if (list.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 7;
        cell.className = "empty-state";
        cell.textContent = students.length === 0
            ? "No student records available."
            : "No students match your search.";

        row.appendChild(cell);
        studentTableBody.appendChild(row);
        return;
    }

    list.forEach(student => {
        const row = document.createElement("tr");

        const values = [
            student.admission_number,
            `${student.first_name || ""} ${student.last_name || ""}`.trim(),
            student.gender,
            student.class_name,
            student.phone || "—",
            student.email || "—"
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value ?? "";
            row.appendChild(cell);
        });

        const actions = document.createElement("td");
        actions.className = "action-buttons";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "edit-button";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => editStudent(student));

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => {
            deleteStudent(student.student_id);
        });

        actions.append(editButton, deleteButton);
        row.appendChild(actions);
        studentTableBody.appendChild(row);
    });
}

// Clear the form and return to registration mode
function resetStudentForm() {
    studentForm.reset();
    document.getElementById("student_id").value = "";

    saveButton.textContent = "Save Student";
    cancelButton.hidden = true;
    formTitle.textContent = "Register New Student";
}

// Register a new student or update an existing record
studentForm.addEventListener("submit", async event => {
    event.preventDefault();

    const id = document.getElementById("student_id").value;

    const student = {
        admission_number: document.getElementById("admission_number").value.trim(),
        first_name: document.getElementById("first_name").value.trim(),
        last_name: document.getElementById("last_name").value.trim(),
        gender: document.getElementById("gender").value,
        date_of_birth: document.getElementById("date_of_birth").value,
        class_name: document.getElementById("class_name").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        email: document.getElementById("email").value.trim()
    };

    const url = id ? `${API_URL}/${id}` : API_URL;
    const method = id ? "PUT" : "POST";

    saveButton.disabled = true;
    saveButton.textContent = id ? "Updating..." : "Saving...";

    try {
        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(student)
        });

        const data = await readResponse(response);

        if (data.success === false) {
            throw new Error(data.message || "Unable to save student.");
        }

        resetStudentForm();
        showMessage(data.message || "Student saved successfully.");
        await loadStudents();
    } catch (error) {
        showMessage(error.message || "Unable to save student.", false);
        console.error("Saving student failed:", error);
    } finally {
        saveButton.disabled = false;

        if (!document.getElementById("student_id").value) {
            saveButton.textContent = "Save Student";
        }
    }
});

// Fill the form for editing
function editStudent(student) {
    document.getElementById("student_id").value = student.student_id;
    document.getElementById("admission_number").value = student.admission_number || "";
    document.getElementById("first_name").value = student.first_name || "";
    document.getElementById("last_name").value = student.last_name || "";
    document.getElementById("gender").value = student.gender || "";

    document.getElementById("date_of_birth").value =
        student.date_of_birth
            ? String(student.date_of_birth).slice(0, 10)
            : "";

    document.getElementById("class_name").value = student.class_name || "";
    document.getElementById("phone").value = student.phone || "";
    document.getElementById("email").value = student.email || "";

    saveButton.textContent = "Update Student";
    cancelButton.hidden = false;
    formTitle.textContent = "Update Student Details";

    showMessage(`Editing ${student.first_name} ${student.last_name}.`);
    studentForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Cancel editing
cancelButton.addEventListener("click", () => {
    resetStudentForm();
    showMessage("Editing cancelled.");
});

// Delete a student
async function deleteStudent(id) {
    if (!id) {
        showMessage("Student ID is missing.", false);
        return;
    }

    if (!confirm("Are you sure you want to delete this student?")) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        const data = await readResponse(response);

        if (data.success === false) {
            throw new Error(data.message || "Unable to delete student.");
        }

        if (String(document.getElementById("student_id").value) === String(id)) {
            resetStudentForm();
        }

        showMessage(data.message || "Student deleted successfully.");
        await loadStudents();
    } catch (error) {
        showMessage(error.message || "Unable to delete student.", false);
        console.error("Deleting student failed:", error);
    }
}

// Search by admission number, name, gender, class, phone or email
function searchStudents() {
    const term = searchInput.value.toLowerCase().trim();

    const filtered = students.filter(student => {
        const details = [
            student.admission_number,
            student.first_name,
            student.last_name,
            student.gender,
            student.class_name,
            student.phone,
            student.email
        ].join(" ").toLowerCase();

        return details.includes(term);
    });

    displayStudents(filtered);
}

searchInput.addEventListener("input", searchStudents);

// Load records when the page opens
loadStudents();
