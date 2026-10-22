
const API_URL = "http://localhost:5000/subjects";

const form = document.getElementById("subjectForm");
const subjectIdInput = document.getElementById("subject_id");
const nameInput = document.getElementById("subject_name");
const codeInput = document.getElementById("subject_code");
const descriptionInput = document.getElementById("description");
const tableBody = document.getElementById("subjectTableBody");
const totalSubjects = document.getElementById("totalSubjects");
const messageBox = document.getElementById("message");
const formTitle = document.getElementById("formTitle");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");
const searchInput = document.getElementById("searchInput");

let subjects = [];

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
        throw new Error(result.message || "The request failed.");
    }

    return result;
}

function showMessage(message, type = "success") {
    messageBox.textContent = message;
    messageBox.className = `message ${type}`;
    messageBox.hidden = false;
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

async function loadSubjects() {
    tableBody.innerHTML =
        '<tr><td colspan="5">Loading subjects...</td></tr>';

    try {
        const result = await apiRequest(API_URL);
        subjects = result.data || [];
        renderSubjects();
    } catch (error) {
        tableBody.innerHTML =
            '<tr><td colspan="5">Could not load subjects.</td></tr>';

        showMessage(
            error.message + " Check that your Node.js server is running.",
            "error"
        );
    }
}

function renderSubjects() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    const filteredSubjects = subjects.filter(subject =>
        String(subject.subject_name).toLowerCase().includes(searchTerm) ||
        String(subject.subject_code).toLowerCase().includes(searchTerm)
    );

    totalSubjects.textContent = subjects.length;

    if (filteredSubjects.length === 0) {
        tableBody.innerHTML =
            '<tr><td colspan="5">No subjects found.</td></tr>';
        return;
    }

    tableBody.innerHTML = filteredSubjects.map(subject => `
        <tr>
            <td>${escapeHTML(subject.subject_id)}</td>
            <td>${escapeHTML(subject.subject_name)}</td>
            <td>${escapeHTML(subject.subject_code)}</td>
            <td>${escapeHTML(subject.description || "—")}</td>
            <td>
                <button type="button" class="edit-button"
                    data-action="edit"
                    data-id="${escapeHTML(subject.subject_id)}">
                    Edit
                </button>
                <button type="button" class="delete-button"
                    data-action="delete"
                    data-id="${escapeHTML(subject.subject_id)}">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");
}

function resetForm() {
    form.reset();
    subjectIdInput.value = "";
    formTitle.textContent = "Register New Subject";
    saveButton.textContent = "Register Subject";
    cancelButton.hidden = true;
}

form.addEventListener("submit", async event => {
    event.preventDefault();

    const id = subjectIdInput.value;

    const subject = {
        subject_name: nameInput.value.trim(),
        subject_code: codeInput.value.trim().toUpperCase(),
        description: descriptionInput.value.trim()
    };

    if (!subject.subject_name || !subject.subject_code) {
        showMessage("Enter the subject name and subject code.", "error");
        return;
    }

    saveButton.disabled = true;

    try {
        const result = await apiRequest(
            id ? `${API_URL}/${encodeURIComponent(id)}` : API_URL,
            {
                method: id ? "PUT" : "POST",
                body: JSON.stringify(subject)
            }
        );

        showMessage(result.message || "Subject saved successfully.");
        resetForm();
        await loadSubjects();
    } catch (error) {
        showMessage(error.message, "error");
    } finally {
        saveButton.disabled = false;
    }
});

tableBody.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = Number(button.dataset.id);
    const subject = subjects.find(item => item.subject_id === id);

    if (!subject) return;

    if (button.dataset.action === "edit") {
        subjectIdInput.value = subject.subject_id;
        nameInput.value = subject.subject_name;
        codeInput.value = subject.subject_code;
        descriptionInput.value = subject.description || "";

        formTitle.textContent = "Update Subject";
        saveButton.textContent = "Save Changes";
        cancelButton.hidden = false;

        form.scrollIntoView({ behavior: "smooth", block: "start" });
        nameInput.focus();
        return;
    }

    if (button.dataset.action === "delete") {
        const confirmed = window.confirm(
            `Are you sure you want to delete ${subject.subject_name}?`
        );

        if (!confirmed) return;

        try {
            const result = await apiRequest(
                `${API_URL}/${encodeURIComponent(id)}`,
                { method: "DELETE" }
            );

            showMessage(result.message || "Subject deleted successfully.");

            if (subjectIdInput.value === String(id)) {
                resetForm();
            }

            await loadSubjects();
        } catch (error) {
            showMessage(error.message, "error");
        }
    }
});

searchInput.addEventListener("input", renderSubjects);

cancelButton.addEventListener("click", () => {
    resetForm();
    messageBox.hidden = true;
});

form.addEventListener("reset", () => {
    setTimeout(() => {
        if (!subjectIdInput.value) {
            formTitle.textContent = "Register New Subject";
            saveButton.textContent = "Register Subject";
            cancelButton.hidden = true;
        }
    }, 0);
});

document.getElementById("refreshButton")
    .addEventListener("click", loadSubjects);

loadSubjects();
