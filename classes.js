
const API_URL = "http://localhost:5000/classes";

document.addEventListener("DOMContentLoaded", () => {
    const classForm = document.getElementById("classForm");
    const classIdInput = document.getElementById("class_id");
    const classNameInput = document.getElementById("class_name");
    const classTeacherInput = document.getElementById("class_teacher");
    const roomNumberInput = document.getElementById("room_number");
    const academicYearInput = document.getElementById("academic_year");
    const saveButton = document.getElementById("saveButton");
    const cancelButton = document.getElementById("cancelButton");
    const formTitle = document.getElementById("formTitle");
    const message = document.getElementById("message");
    const searchInput = document.getElementById("searchInput");
    const classTableBody = document.getElementById("classTableBody");
    const classCount = document.getElementById("classCount");

    let classes = [];

    // Display a message to the user
    function showMessage(text, type = "success") {
        message.textContent = text;
        message.className = type;
    }

    // Load classes from the backend
    async function loadClasses() {
        classTableBody.innerHTML =
            '<tr><td colspan="5">Loading classes...</td></tr>';

        try {
            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error("Unable to load classes.");
            }

            const data = await response.json();

            // The GET endpoint returns an array of classes
            classes = Array.isArray(data) ? data : [];

            displayClasses(searchInput.value);
        } catch (error) {
            console.error("Loading classes failed:", error);
            classTableBody.innerHTML =
                '<tr><td colspan="5">Unable to load classes. Check that the backend is running.</td></tr>';
            classCount.textContent = "Classes could not be loaded.";
        }
    }

    // Display and search classes
    function displayClasses(searchTerm = "") {
        const term = searchTerm.trim().toLowerCase();

        const filteredClasses = classes.filter(item =>
            [
                item.class_name,
                item.class_teacher,
                item.room_number,
                item.academic_year
            ].some(value =>
                String(value || "").toLowerCase().includes(term)
            )
        );

        classCount.textContent =
            `${filteredClasses.length} class${filteredClasses.length === 1 ? "" : "es"} found`;

        classTableBody.replaceChildren();

        if (filteredClasses.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 5;
            cell.textContent = term
                ? "No classes match your search."
                : "No classes registered yet.";

            row.appendChild(cell);
            classTableBody.appendChild(row);
            return;
        }

        filteredClasses.forEach(item => {
            const row = document.createElement("tr");

            [
                item.class_name,
                item.class_teacher || "—",
                item.room_number || "—",
                item.academic_year || "—"
            ].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            const actionsCell = document.createElement("td");

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.textContent = "Edit";
            editButton.className = "secondary-button";
            editButton.addEventListener("click", () => editClass(item));

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.textContent = "Delete";
            deleteButton.className = "danger-button";
            deleteButton.style.marginLeft = "8px";
            deleteButton.addEventListener("click", () => deleteClass(item));

            actionsCell.append(editButton, deleteButton);
            row.appendChild(actionsCell);
            classTableBody.appendChild(row);
        });
    }

    // Reset the form
    function resetForm() {
        classForm.reset();
        classIdInput.value = "";
        formTitle.textContent = "Register a Class";
        saveButton.textContent = "Save Class";
        cancelButton.hidden = true;
    }

    // Register or update a class
    classForm.addEventListener("submit", async event => {
        event.preventDefault();

        const id = classIdInput.value;

        const classData = {
            class_name: classNameInput.value.trim(),
            class_teacher: classTeacherInput.value.trim(),
            room_number: roomNumberInput.value.trim(),
            academic_year: academicYearInput.value.trim()
        };

        if (!classData.class_name) {
            showMessage("Please enter a class name.", "error");
            return;
        }

        const url = id ? `${API_URL}/${id}` : API_URL;
        const method = id ? "PUT" : "POST";

        saveButton.disabled = true;
        saveButton.textContent = id ? "Updating..." : "Saving...";

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(classData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Unable to save class.");
            }

            showMessage(
                result.message || "Class saved successfully!",
                "success"
            );

            resetForm();
            await loadClasses();
        } catch (error) {
            console.error("Saving class failed:", error);
            showMessage(error.message, "error");
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = classIdInput.value
                ? "Update Class"
                : "Save Class";
        }
    });

    // Load class details into the form for editing
    function editClass(item) {
        classIdInput.value = item.class_id;
        classNameInput.value = item.class_name || "";
        classTeacherInput.value = item.class_teacher || "";
        roomNumberInput.value = item.room_number || "";
        academicYearInput.value = item.academic_year || "";

        formTitle.textContent = "Edit Class";
        saveButton.textContent = "Update Class";
        cancelButton.hidden = false;

        showMessage(`Editing ${item.class_name}.`, "success");

        classForm.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    // Delete a class
    async function deleteClass(item) {
        const confirmed = confirm(
            `Are you sure you want to delete ${item.class_name}?`
        );

        if (!confirmed) return;

        try {
            const response = await fetch(`${API_URL}/${item.class_id}`, {
                method: "DELETE"
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Unable to delete class.");
            }

            showMessage(result.message || "Class deleted successfully!", "success");

            if (classIdInput.value === String(item.class_id)) {
                resetForm();
            }

            await loadClasses();
        } catch (error) {
            console.error("Deleting class failed:", error);
            showMessage(error.message, "error");
        }
    }

    // Cancel editing
    cancelButton.addEventListener("click", () => {
        resetForm();
        showMessage("Editing cancelled.", "success");
    });

    // Search classes as the user types
    searchInput.addEventListener("input", () => {
        displayClasses(searchInput.value);
    });

    // Initial load
    loadClasses();
});
