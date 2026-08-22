// ======================================================
// Expert Decision Replay Platform
// Decision Management JavaScript
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {

    // =====================================================
    // SIDEBAR TOGGLE
    // =====================================================

    const sidebar = document.querySelector(".sidebar");
    const toggleSidebar = document.getElementById("toggleSidebar");

    if (toggleSidebar && sidebar) {

        toggleSidebar.addEventListener("click", () => {

            sidebar.classList.toggle("collapsed");

        });

    }

    let allDecisions = [];
    // =====================================================
    // Authentication
    // =====================================================

    checkAuthentication();

    const currentUser =
        await loadCurrentUser();

    if (!currentUser) {

        return;

    }

    // =====================================================
    // Bootstrap Components
    // =====================================================

    const modalElement =
        document.getElementById("decisionModal");

    const toastElement =
        document.getElementById("successToast");

    const decisionModal =
        new bootstrap.Modal(modalElement);

    const historyModal =
        new bootstrap.Modal(
            document.getElementById("historyModal")
        );

    const successToast =
        new bootstrap.Toast(toastElement);

    // =====================================================
    // Editing Decision
    // =====================================================

    let editingDecisionId = null;

    // =====================================================
    // Buttons
    // =====================================================

    const newDecisionBtn =
        document.getElementById("newDecisionBtn");

    const saveDecisionBtn =
        document.getElementById("saveDecisionBtn");

    // =====================================================
    // Search & Filters
    // =====================================================

    const searchInput =
        document.getElementById("searchDecision");

    const statusFilter =
        document.getElementById("statusFilter");

    const priorityFilter =
        document.getElementById("priorityFilter");

    // =====================================================
    // Current User
    // =====================================================

    const decisionOwner =
        document.getElementById("decisionOwner");

    if (decisionOwner) {

        decisionOwner.value =
            currentUser.full_name;

    }

    // =====================================================
    // Role Permissions
    // =====================================================

    applyDecisionPermissions();

    // =====================================================
    // New Decision
    // =====================================================

    if (newDecisionBtn) {

        newDecisionBtn.addEventListener("click", () => {

            editingDecisionId = null;

            document
                .getElementById("decisionForm")
                .reset();

            if (decisionOwner) {

                decisionOwner.value =
                    currentUser.full_name;

            }

            document
                .getElementById("decisionModalTitle")
                .innerHTML = `

                <i class="bi bi-file-earmark-plus-fill"></i>

                Create New Decision

            `;

            saveDecisionBtn.innerHTML = `

                <i class="bi bi-check-circle"></i>

                Save Decision

            `;

            decisionModal.show();

        });

    }
    // =====================================================
// LOAD DECISIONS
// =====================================================
async function loadDecisions() {

    try {

        const response = await fetch("/decisions/", {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error("Unable to fetch decisions.");
        }

        allDecisions = await response.json();
        console.log("API Data:", allDecisions);

        renderTable(allDecisions);

    }

    catch (error) {

        console.error(error);

        alert("Unable to load decisions.");

    }

}
function renderTable(decisions) {

    const table = document.getElementById("decisionTable");

    table.innerHTML = "";

    const currentRole = getCurrentRole();

    decisions.forEach(decision => {
        console.log(
            "Rendering:",
            decision.id,
            decision.owner_name
    );

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${decision.id}</td>
            <td>${decision.title}</td>
            <td>${decision.department}</td>

            <td>
                <span class="priority ${decision.priority.toLowerCase()}">
                    ${decision.priority}
                </span>
            </td>

            <td>
                <span class="status ${decision.status.toLowerCase()}">
                    ${decision.status}
                </span>
            </td>

            <td>${decision.owner_name}</td>
            <td>${new Date(decision.created_at).toLocaleDateString()}</td>

            <td>

                <button class="action-btn view">
                    <i class="bi bi-eye"></i>
                </button>

                <button class="action-btn edit">
                    <i class="bi bi-pencil"></i>
                </button>

                <button class="action-btn delete">
                    <i class="bi bi-trash"></i>
                </button>

                <button class="action-btn history">
                    <i class="bi bi-clock-history"></i>
                </button>

            </td>
        `;

        table.appendChild(row);

        attachView(row, decision);
        attachEdit(row, decision);
        attachDelete(row, decision.id);
        attachHistory(row, decision.id);

        const editBtn = row.querySelector(".edit");
        const deleteBtn = row.querySelector(".delete");

        if (currentRole === "Reviewer") {
            editBtn.style.display = "none";
            deleteBtn.style.display = "none";
        }

        if (currentRole === "Employee") {
            deleteBtn.style.display = "none";
        }

    });

}

// =====================================================
// SAVE / UPDATE DECISION
// =====================================================

saveDecisionBtn.addEventListener("click", async () => {

    const title =
        document.getElementById("decisionTitle").value.trim();
    if (title.length < 5) {

    alert(
        "Decision title must contain at least 5 characters."
    );

    return;

}

    const department =
        document.getElementById("department").value;

    const category =
        document.getElementById("category").value;

    const priority =
        document.getElementById("priority").value;

    const problem =
        document.getElementById("problemStatement").value.trim();
        if (problem.length < 20) {

    alert(
        "Please provide a more detailed problem statement."
    );

    return;

}

    // ==========================================
    // Validation
    // ==========================================

    if (

        title === "" ||

        department === "" ||

        category === "" ||

        priority === "" ||

        problem === ""

    ) {

        alert("Please fill all required fields.");

        return;

    }

    // ==========================================
    // Loading Button
    // ==========================================

    saveDecisionBtn.disabled = true;

    saveDecisionBtn.innerHTML = `

        <span class="spinner-border spinner-border-sm"></span>

        Saving...

    `;

    try {

        const url = editingDecisionId

            ? `/decisions/${editingDecisionId}`

            : "/decisions/";

        const method = editingDecisionId

            ? "PUT"

            : "POST";

        const response = await fetch(

            url,

            {

                method: method,

                headers: {

                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${getToken()}`

                },

                body: JSON.stringify({

                    title: title,

                    problem_statement: problem,

                    category: category,

                    department: department,

                    priority: priority,

                    status: "Draft"

                })

            }

        );

        const data =
            await response.json();

        if (!response.ok) {

            saveDecisionBtn.disabled = false;

            saveDecisionBtn.innerHTML = `

                <i class="bi bi-check-circle"></i>

                Save Decision

            `;

            alert(

                data.detail ||

                "Something went wrong."

);
            return;
}

        // ==========================================
        // Reset Form
        // ==========================================

        decisionModal.hide();

        document
            .getElementById("decisionForm")
            .reset();

        editingDecisionId = null;

        document
            .getElementById("decisionModalTitle")
            .innerHTML = `

                <i class="bi bi-file-earmark-plus-fill"></i>

                Create New Decision

            `;

        saveDecisionBtn.disabled = false;

        saveDecisionBtn.innerHTML = `

            <i class="bi bi-check-circle"></i>

            Save Decision

        `;

        successToast.show();

        loadDecisions();

    }

    catch (error) {

        console.error(error);

        saveDecisionBtn.disabled = false;

        saveDecisionBtn.innerHTML = `

            <i class="bi bi-check-circle"></i>

            Save Decision

        `;

        alert(

            "Unable to save decision."

        );

    }

});

// =====================================================
// VIEW DECISION + ATTACHMENTS
// =====================================================

function attachView(row, decision) {

    row.querySelector(".view").addEventListener("click", () => {

        // Fill decision details

        document.getElementById("viewDecisionTitle").value =
            decision.title || "";

        document.getElementById("viewDecisionDepartment").value =
            decision.department || "";

        document.getElementById("viewDecisionCategory").value =
            decision.category || "";

        document.getElementById("viewDecisionPriority").value =
            decision.priority || "";

        document.getElementById("viewDecisionStatus").value =
            decision.status || "";

        document.getElementById("viewDecisionOwner").value =
            decision.owner_name || "";

        document.getElementById("viewDecisionProblem").value =
            decision.problem_statement || "";

        // Store currently selected decision

        window.currentAttachmentDecisionId = decision.id;
        // Load existing attachments
        loadDecisionAttachments(decision.id);

        // Reset attachment UI

        const fileInput =
            document.getElementById("attachmentFile");

        const status =
            document.getElementById("attachmentUploadStatus");

        if (fileInput) {
            fileInput.value = "";
        }

        if (status) {
            status.style.display = "none";
        }

        // Show modal

        const modalElement =
            document.getElementById("viewDecisionModal");

        const viewModal =
            new bootstrap.Modal(modalElement);

        viewModal.show();

    });

}
// =====================================================
// EDIT DECISION
// =====================================================

function attachEdit(row, decision) {

    const editBtn =
        row.querySelector(".edit");

    editBtn.addEventListener("click", () => {

        // Reviewer cannot edit

        if (isReviewer()) {

            alert(
                "Reviewers cannot edit decisions."
            );

            return;

        }

        editingDecisionId =
            decision.id;

        document
            .getElementById("decisionModalTitle")
            .innerHTML = `

            <i class="bi bi-pencil-square"></i>

            Update Decision

        `;

        document
            .getElementById("decisionTitle")
            .value = decision.title;

        document
            .getElementById("department")
            .value = decision.department;

        document
            .getElementById("category")
            .value = decision.category;

        document
            .getElementById("priority")
            .value = decision.priority;

        document
            .getElementById("problemStatement")
            .value = decision.problem_statement;

        saveDecisionBtn.innerHTML = `

            <i class="bi bi-pencil-square"></i>

            Update Decision

        `;

        decisionModal.show();

    });

}

// =====================================================
// DELETE DECISION
// =====================================================

function attachDelete(row, decisionId) {

    const deleteBtn =
        row.querySelector(".delete");

    deleteBtn.addEventListener("click", async () => {

        // Employee cannot delete

        if (isEmployee()) {

            alert(
                "Employees cannot delete decisions."
            );

            return;

        }

        // Reviewer cannot delete

        if (isReviewer()) {

            alert(
                "Reviewers cannot delete decisions."
            );

            return;

        }

        const confirmDelete = confirm(

            "Are you sure you want to delete this decision?"

        );

        if (!confirmDelete) {

            return;

        }

        try {

            const response = await fetch(

                `/decisions/${decisionId}`,

                {

                    method: "DELETE",

                    headers: {

                        Authorization:
                            `Bearer ${getToken()}`

                    }

                }

            );

            if (!response.ok) {

                throw new Error();

            }

            successToast.show();

            loadDecisions();

        }

        catch (error) {

            console.error(error);

            alert(

                "Unable to delete decision."

            );

        }

    });

}
function attachHistory(row, decisionId) {

    const historyBtn = row.querySelector(".history");

    historyBtn.addEventListener("click", async () => {

        try {

            const response = await fetch(

                `/versions/${decisionId}`,

                {

                    headers: {

                        Authorization: `Bearer ${getToken()}`

                    }

                }

            );

            if (!response.ok) {

                throw new Error("Unable to load version history.");

            }

            const versions = await response.json();

            const historyTable =
                document.getElementById("historyTable");

            historyTable.innerHTML = "";

            if (versions.length === 0) {

                historyTable.innerHTML = `

                    <tr>

                        <td colspan="4" class="text-center">

                            No Version History Found

                        </td>

                    </tr>

                `;

            }

            else {

                versions.forEach(version => {

                    historyTable.innerHTML += `

                        <tr>

                            <td>V${version.version_number}</td>

                            <td>${version.changed_by_name}</td>

                            <td style="white-space: pre-line;">
                                ${version.change_summary}
                            </td>

                            <td>${new Date(version.created_at).toLocaleString()}</td>

                        </tr>

                    `;

                });
            }

            historyModal.show();

        }

        catch (error) {

            console.error(error);

            alert("Unable to load version history.");

        }

    });

}
// =====================================================
// SEARCH & FILTER
// =====================================================

function filterTable() {

    const search = searchInput.value.toLowerCase();
    const status = statusFilter.value.toLowerCase();
    const priority = priorityFilter.value.toLowerCase();

    const filtered = allDecisions.filter(decision => {

        const searchMatch =
            decision.title.toLowerCase().includes(search) ||
            decision.department.toLowerCase().includes(search);

        const statusMatch =
            status === "" ||
            decision.status.toLowerCase() === status;

        const priorityMatch =
            priority === "" ||
            decision.priority.toLowerCase() === priority;

        return searchMatch &&
               statusMatch &&
               priorityMatch;

    });

    renderTable(filtered);
}
// =====================================================
// ROLE PERMISSIONS
// =====================================================

function applyDecisionPermissions() {

    // Reviewer

    if (isReviewer()) {

        document
            .getElementById("newDecisionBtn")
            ?.classList.add("d-none");

    }

    // Employee

    if (isEmployee()) {

        // Employees cannot delete.
        // Backend already enforces ownership.

    }

    // Manager

    if (isManager()) {

        // Full Access

    }

    // Administrator

    if (isAdmin()) {

        // Full Access

    }

}

// =====================================================
// AUTO REFRESH
// =====================================================

function startDecisionRefresh() {

    setInterval(async () => {

        if (!isLoggedIn()) {

            return;

        }

        try {

            await loadDecisions();

        }

        catch (error) {

            console.error(error);

        }

    }, 300000);

}

// =====================================================
// PAGE PROTECTION
// =====================================================

function protectDecisionPage() {

    if (!isLoggedIn()) {

        logout();

        return;

    }

}
searchInput?.addEventListener("input", filterTable);

statusFilter?.addEventListener("change", filterTable);

priorityFilter?.addEventListener("change", filterTable);
// =====================================================
// ATTACHMENT UPLOAD
// =====================================================

const uploadAttachmentBtn =
    document.getElementById("uploadAttachmentBtn");

const attachmentFile =
    document.getElementById("attachmentFile");

const attachmentList =
    document.getElementById("attachmentList");

const attachmentUploadStatus =
    document.getElementById("attachmentUploadStatus");

const attachmentProgress =
    document.getElementById("attachmentProgress");


// Open file picker

uploadAttachmentBtn?.addEventListener("click", () => {

    attachmentFile.click();

});


// File selected

attachmentFile?.addEventListener("change", async () => {

    const file = attachmentFile.files[0];

    if (!file) {
        return;
    }

    const decisionId =
        window.currentAttachmentDecisionId;

    if (!decisionId) {

        alert("Please select a decision first.");

        return;

    }


    // Maximum file size: 10 MB

    const maxSize =
        10 * 1024 * 1024;

    if (file.size > maxSize) {

        alert(
            "File size must be less than 10 MB."
        );

        attachmentFile.value = "";

        return;

    }


    // Allowed file types

const allowedTypes = [
    // PDF
    "application/pdf",

    // Word
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    // Excel
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    // PowerPoint
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    // Text
    "text/plain",

    // Images
    "image/png",
    "image/jpeg"
];

    if (!allowedTypes.includes(file.type)) {

        alert(
            "This file type is not supported."
        );

        attachmentFile.value = "";

        return;

    }


    const formData =
        new FormData();

    formData.append(
        "file",
        file
    );


    attachmentUploadStatus.style.display =
        "block";

    attachmentProgress.style.width =
        "100%";

    attachmentProgress.textContent =
        "Uploading...";


    try {

        const response =
            await fetch(
                `/attachments/upload?decision_id=${decisionId}`,
                {
                    method: "POST",

                    headers: {
                        Authorization:
                            `Bearer ${getToken()}`
                    },

                    body: formData
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "File upload failed."
            );

        }


        attachmentProgress.textContent =
            "Upload completed";

        // Refresh complete attachment list
        await loadDecisionAttachments(decisionId);

        attachmentFile.value = "";
        setTimeout(() => {

            attachmentUploadStatus.style.display =
                "none";

        }, 1200);


    }

    catch (error) {

        console.error(
            "Attachment upload error:",
            error
        );

        attachmentUploadStatus.style.display =
            "none";

        alert(
            error.message ||
            "Unable to upload file."
        );

    }

});


// =====================================================
// DISPLAY UPLOADED ATTACHMENT
// =====================================================

function displayUploadedAttachment(data) {

    if (!attachmentList) {
        return;
    }

    const fileName =
        data.file_name ||
        data.original_filename ||
        data.filename ||
        "Uploaded File";

    const fileSize =
        data.file_size
            ? formatFileSize(data.file_size)
            : "";

    const fileType =
        data.file_type || "";

    const attachmentId = data.id;

    const item = document.createElement("div");

    item.className =
        "attachment-item d-flex align-items-center justify-content-between border rounded p-3 mb-2";

    // File information
    const fileInfo = document.createElement("div");

    fileInfo.className =
        "d-flex align-items-center";

    fileInfo.innerHTML = `
        <div class="me-3">
            <i class="bi bi-file-earmark-text fs-3 text-primary"></i>
        </div>

        <div>
            <div class="fw-semibold">
                ${escapeHtml(fileName)}
            </div>

            <small class="text-muted">
                ${fileSize}
                ${fileType
                    ? " • " + escapeHtml(fileType)
                    : ""
                }
            </small>
        </div>
    `;


    // Buttons
    const buttons = document.createElement("div");

    buttons.className =
        "d-flex gap-2";


    // Download button
    const downloadBtn =
        document.createElement("button");

    downloadBtn.type = "button";

    downloadBtn.className =
        "btn btn-sm btn-outline-primary";

    downloadBtn.innerHTML = `
        <i class="bi bi-download"></i>
        Download
    `;


    downloadBtn.addEventListener(
        "click",
        () => downloadAttachment(
            attachmentId,
            fileName
        )
    );


    // Delete button
    const deleteBtn =
        document.createElement("button");

    deleteBtn.type = "button";

    deleteBtn.className =
        "btn btn-sm btn-outline-danger";

    deleteBtn.innerHTML = `
        <i class="bi bi-trash"></i>
        Delete
    `;


    deleteBtn.addEventListener(
        "click",
        () => deleteAttachment(
            attachmentId
        )
    );


    buttons.appendChild(downloadBtn);
    buttons.appendChild(deleteBtn);

    item.appendChild(fileInfo);
    item.appendChild(buttons);

    attachmentList.appendChild(item);
}
// =====================================================
// LOAD DECISION ATTACHMENTS
// =====================================================

async function loadDecisionAttachments(
    decisionId
) {

    if (!attachmentList) {
        return;
    }

    attachmentList.innerHTML = `
        <div class="text-muted text-center p-3">
            <span class="spinner-border spinner-border-sm"></span>
            Loading attachments...
        </div>
    `;


    try {

        const response =
            await fetch(
                `/attachments/decision/${decisionId}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${getToken()}`
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load attachments."
            );

        }


        const attachments =
            await response.json();


        attachmentList.innerHTML = "";


        if (attachments.length === 0) {

            attachmentList.innerHTML = `
                <div class="text-muted text-center p-3">
                    <i class="bi bi-paperclip"></i>
                    No attachments found.
                </div>
            `;

            return;
        }


        attachments.forEach(
            attachment => {

                displayUploadedAttachment(
                    attachment
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Attachment loading error:",
            error
        );

        attachmentList.innerHTML = `
            <div class="text-danger text-center p-3">
                Unable to load attachments.
            </div>
        `;

    }
}
// =====================================================
// DOWNLOAD ATTACHMENT
// =====================================================

async function downloadAttachment(
    attachmentId,
    fileName
) {

    try {

        const response = await fetch(
            `/attachments/${attachmentId}/download`,
            {
                method: "GET",

                headers: {
                    Authorization:
                        `Bearer ${getToken()}`
                }
            }
        );


        if (!response.ok) {

            let message =
                "Unable to download attachment.";

            try {

                const data =
                    await response.json();

                message =
                    data.detail || message;

            } catch (e) {
                // Response was not JSON
            }

            throw new Error(message);
        }


        const blob =
            await response.blob();


        const downloadUrl =
            window.URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href =
            downloadUrl;

        link.download =
            fileName || "attachment";


        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);


        window.URL.revokeObjectURL(
            downloadUrl
        );

    }

    catch (error) {

        console.error(
            "Download attachment error:",
            error
        );

        alert(
            error.message ||
            "Unable to download attachment."
        );

    }

}
// =====================================================
// DELETE ATTACHMENT
// =====================================================

async function deleteAttachment(
    attachmentId
) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this attachment?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/attachments/${attachmentId}`,
                {
                    method: "DELETE",

                    headers: {
                        Authorization:
                            `Bearer ${getToken()}`
                    }
                }
            );


        let data = {};

        try {

            data =
                await response.json();

        } catch (e) {
            // Empty response
        }


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to delete attachment."
            );

        }


        alert(
            data.message ||
            "Attachment deleted successfully."
        );


        // Reload attachments
        await loadDecisionAttachments(
            window.currentAttachmentDecisionId
        );

    }

    catch (error) {

        console.error(
            "Delete attachment error:",
            error
        );

        alert(
            error.message ||
            "Unable to delete attachment."
        );

    }

}
// =====================================================
// FORMAT FILE SIZE
// =====================================================

function formatFileSize(bytes) {

    if (!bytes) {
        return "0 Bytes";
    }

    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];

    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );

    return (
        parseFloat(
            (bytes /
                Math.pow(1024, index)
            ).toFixed(2)
        )
        + " "
        + units[index]
    );

}


// =====================================================
// SAFE HTML
// =====================================================

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}

// =====================================================
// INITIALIZE
// =====================================================

protectDecisionPage();

loadDecisions();

startDecisionRefresh();

// =====================================================
// CONSOLE
// =====================================================

console.info(
    "[Decision] Module Loaded"
);
});