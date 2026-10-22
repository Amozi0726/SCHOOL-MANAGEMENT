
const API_URL = "http://localhost:5000/teachers";

const teacherForm = document.getElementById("teacherForm");
const teacherTableBody = document.getElementById("teacherTableBody");
const teacherCount = document.getElementById("teacherCount");
const subjectCount = document.getElementById("subjectCount");
const searchInput = document.getElementById("searchInput");
const resultCount = document.getElementById("resultCount");
const messageBox = document.getElementById("message");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEdit");

let teachers = [];
let messageTimer;

function showMessage(message, type = "success") {
    clearTimeout(messageTimer);

    messageBox.textContent = message;
    messageBox.className = `message ${type}`;
    messageBox.hidden = false;

    messageTimer = setTimeout(() => {
        messageBox.hidden = true;
    }, 5000);
}

async function apiRequest(url, options = {}) {
    let response;

    try {
        response = await fetch(url, {
            ...options,
            headers: {
                ...(options.body
                    ? { "Content-Type": "application/json" }
                    : {}),
                ...options.headers
            }
        });
    } catch {
        throw new Error(
            "Cannot connect to the backend. Make sure Node.js is running on port 5000."
        );
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || `Request failed with status ${response.status}.`
        );
    }

    return data;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function formatDate(value) {
    if (!value) return "—";

    const dateText = String(value).slice(0, 10);
    const parts = dateText.split("-");

    if (parts.length !== 3) return escapeHTML(dateText);

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

async function loadTeachers() {
    teacherTableBody.innerHTML = `
        <tr><td colspan="7" class="empty">Loading teachers...</td></tr>
    `;

    try {
        const data = await apiRequest(API_URL);

        if (!Array.isArray(data)) {
            throw new Error("The server returned an unexpected response.");
        }

        teachers = data;
        renderTeachers();
    } catch (error) {
        teacherTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty">${escapeHTML(error.message)}</td>
            </tr>
        `;

        teacherCount.textContent = "—";
        subjectCount.textContent = "—";
        resultCount.textContent = "Unable to load records";
        showMessage(error.message, "error");
    }
}

function renderTeachers() {
    const query = searchInput.value.trim().toLowerCase();

    const filteredTeachers = teachers.filter(teacher => {
        const searchableText = [
            teacher.first_name,
            teacher.last_name,
            teacher.email,
            teacher.phone,
            teacher.subject,
            teacher.qualification
        ].join(" ").toLowerCase();

        return searchableText.includes(query);
    });

    teacherCount.textContent = teachers.length;

    const subjects = new Set(
        teachers
            .map(teacher => String(teacher.subject || "").trim().toLowerCase())
            .filter(Boolean)
    );

    subjectCount.textContent = subjects.size;
    resultCount.textContent =
        `${filteredTeachers.length} record${filteredTeachers.length === 1 ? "" : "s"}`;

    if (filteredTeachers.length === 0) {
        teacherTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty">
                    ${teachers.length === 0
                        ? "No teachers registered yet. Use the form above to add a teacher."
                        : "No teachers match your search."}
                </td>
            </tr>
        `;
        return;
    }

    teacherTableBody.innerHTML = filteredTeachers.map(teacher => `
        <tr>
            <td>${escapeHTML(teacher.teacher_id)}</td>

            <td>
                <div class="teacher-name">
                    ${escapeHTML(teacher.first_name)} ${escapeHTML(teacher.last_name)}
                </div>
                <div class="teacher-gender">
                    ${escapeHTML(teacher.gender || "—")}
                </div>
            </td>

            <td>
                <div>${escapeHTML(teacher.phone || "—")}</div>
                <div class="secondary-text">
                    ${escapeHTML(teacher.email || "")}
                </div>
            </td>

            <td>${escapeHTML(teacher.subject || "—")}</td>

            <td>${escapeHTML(teacher.qualification || "—")}</td>

            <td>${formatDate(teacher.hire_date)}</td>

            <td>
                <div class="actions">
                    <button type="button"
                        class="btn btn-edit"
                        data-action="edit"
                        data-id="${escapeHTML(teacher.teacher_id)}">
                        Edit
                    </button>

                    <button type="button"
                        class="btn btn-delete"
                        data-action="delete"
                        data-id="${escapeHTML(teacher.teacher_id)}">
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

function getFormData() {
    return {
        first_name: document.getElementById("first_name").value.trim(),
        last_name: document.getElementById("last_name").value.trim(),
        gender: document.getElementById("gender").value,
        phone: document.getElementById("phone").value.trim(),
        email: document.getElementById("email").value.trim(),
        subject: document.getElementById("subject").value.trim(),
        qualification: document.getElementById("qualification").value.trim(),
        hire_date: document.getElementById("hire_date").value
    };
}

function resetTeacherForm() {
    teacherForm.reset();
    document.getElementById("teacher_id").value = "";
    document.getElementById("formTitle").textContent = "Register a Teacher";
    submitButton.textContent = "Register Teacher";
    cancelEditButton.hidden = true;
}

teacherForm.addEventListener("submit", async event => {
    event.preventDefault();

    const teacherId = document.getElementById("teacher_id").value;
    const teacherData = getFormData();

    submitButton.disabled = true;
    submitButton.textContent = teacherId ? "Saving Changes..." : "Registering...";

    try {
        const result = await apiRequest(
            teacherId ? `${API_URL}/${encodeURIComponent(teacherId)}` : API_URL,
            {
                method: teacherId ? "PUT" : "POST",
                body: JSON.stringify(teacherData)
            }
        );

        showMessage(
            result.message || "Teacher saved successfully!",
            "success"
        );

        resetTeacherForm();
        await loadTeachers();
    } catch (error) {
        showMessage(error.message, "error");
    } finally {
        submitButton.disabled = false;

        if (document.getElementById("teacher_id").value) {
            submitButton.textContent = "Save Changes";
        } else {
            submitButton.textContent = "Register Teacher";
        }
    }
});

teacherTableBody.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const teacherId = button.dataset.id;
    const action = button.dataset.action;

    const teacher = teachers.find(
        item => String(item.teacher_id) === String(teacherId)
    );

    if (!teacher) {
        showMessage("Teacher record not found. Refresh the list.", "error");
        return;
    }

    if (action === "edit") {
        document.getElementById("teacher_id").value = teacher.teacher_id;
        document.getElementById("first_name").value = teacher.first_name || "";
        document.getElementById("last_name").value = teacher.last_name || "";
        document.getElementById("gender").value = teacher.gender || "";
        document.getElementById("phone").value = teacher.phone || "";
        document.getElementById("email").value = teacher.email || "";
        document.getElementById("subject").value = teacher.subject || "";
        document.getElementById("qualification").value =
            teacher.qualification || "";
        document.getElementById("hire_date").value =
            teacher.hire_date ? String(teacher.hire_date).slice(0, 10) : "";

        document.getElementById("formTitle").textContent = "Edit Teacher";
        submitButton.textContent = "Save Changes";
        cancelEditButton.hidden = false;

        teacherForm.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        return;
    }

    if (action === "delete") {
        const confirmed = window.confirm(
            `Delete ${teacher.first_name} ${teacher.last_name} from the teacher records? This cannot be undone.`
        );

        if (!confirmed) return;

        button.disabled = true;

        try {
            const result = await apiRequest(
                `${API_URL}/${encodeURIComponent(teacherId)}`,
                { method: "DELETE" }
            );

            if (
                document.getElementById("teacher_id").value ===
                String(teacherId)
            ) {
                resetTeacherForm();
            }

            showMessage(
                result.message || "Teacher deleted successfully!",
                "success"
            );

            await loadTeachers();
        } catch (error) {
            showMessage(error.message, "error");
            button.disabled = false;
        }
    }
});

cancelEditButton.addEventListener("click", resetTeacherForm);
document.getElementById("clearForm").addEventListener("click", () => {
    document.getElementById("teacher_id").value = "";
    document.getElementById("formTitle").textContent = "Register a Teacher";
    submitButton.textContent = "Register Teacher";
    cancelEditButton.hidden = true;
});

searchInput.addEventListener("input", renderTeachers);
document.getElementById("refreshButton").addEventListener("click", loadTeachers);

loadTeachers();
