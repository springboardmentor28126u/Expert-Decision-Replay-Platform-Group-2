// ======================================================
// Expert Decision Replay Platform
// Discussion Management JavaScript
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
    // ==========================================
    // SIDEBAR TOGGLE
    // ==========================================

    const sidebar = document.getElementById("sidebar");
    const toggleSidebar = document.getElementById("toggleSidebar");

    if (toggleSidebar && sidebar) {

        toggleSidebar.addEventListener("click", () => {

            sidebar.classList.toggle("collapsed");

        });

    }

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
    // Bootstrap
    // =====================================================

    const modalElement =
        document.getElementById("discussionModal");

    const toastElement =
        document.getElementById("successToast");

    const discussionModal =
        new bootstrap.Modal(modalElement);

    const successToast =
        new bootstrap.Toast(toastElement);

    // =====================================================
    // Controls
    // =====================================================

    const newDiscussionBtn =
        document.getElementById("newDiscussionBtn");

    const saveDiscussionBtn =
        document.getElementById("saveDiscussionBtn");

    const searchInput =
        document.getElementById("searchDiscussion");

    let editingDiscussionId = null;

    // =====================================================
    // Role Based Access
    // =====================================================

    applyDiscussionPermissions();

    // =====================================================
    // New Discussion
    // =====================================================

    if (newDiscussionBtn) {

        newDiscussionBtn.addEventListener("click", () => {

            editingDiscussionId = null;

            document
                .getElementById("discussionForm")
                ?.reset();

            document
                .getElementById("discussionId")
                .value = "";

            document
                .getElementById("decisionId")
                .value = "";

            saveDiscussionBtn.innerHTML = `

                <i class="bi bi-chat-left-text"></i>

                Save Discussion

            `;

            discussionModal.show();

        });

    }
    // =====================================================
// LOAD DISCUSSIONS
// =====================================================

async function loadDiscussions() {

    try {

        const response = await fetch(

            "/discussion/",

            {

                headers: {

                    Authorization:
                        `Bearer ${getToken()}`

                }

            }

        );

        if (!response.ok) {

            throw new Error(
                "Unable to fetch discussions."
            );

        }

        const discussions =
            await response.json();
        console.log("Discussions:", discussions);

        const table =
            document.getElementById(
                "discussionTable"
            );
            
        console.log("Table:", table);
        table.innerHTML = "";

        discussions.forEach(discussion => {
            console.log("Rendering:", discussion);
            const row =
                document.createElement("tr");

            row.innerHTML = `

                <td>${discussion.id}</td>

                <td>${discussion.decision_id}</td>

                <td>${discussion.user_id}</td>

                <td>${discussion.comment}</td>

                <td>

                    ${new Date(
                        discussion.created_at
                    ).toLocaleDateString()}

                </td>

                <td>

                    <button
                        class="action-btn edit">

                        <i class="bi bi-pencil"></i>

                    </button>

                    <button
                        class="action-btn delete">

                        <i class="bi bi-trash"></i>

                    </button>

                </td>

            `;

            table.appendChild(row);

            attachEdit(

                row,

                discussion

            );

            attachDelete(

                row,

                discussion.id

            );

            // ==========================================
            // RBAC
            // ==========================================

            const editBtn =
                row.querySelector(".edit");

            const deleteBtn =
                row.querySelector(".delete");

            if (isReviewer()) {

                editBtn.style.display =
                    "none";

                deleteBtn.style.display =
                    "none";

            }

        });

    }

    catch (error) {

        console.error(error);

        alert(

            "Unable to load discussions."

        );

    }

}
// =====================================================
// SAVE DISCUSSION
// =====================================================

saveDiscussionBtn.addEventListener("click", async () => {

    if (saveDiscussionBtn.disabled) {

    return;

}
    const decisionId =
        document.getElementById("decisionId").value;

    const comment =
        document.getElementById("discussionComment").value.trim();

    if (decisionId === "" || comment === "") {

    alert("Please fill all fields.");

    return;

}

if (comment.length < 10) {

    alert(

        "Comment must contain at least 10 characters."

    );

    return;

}

    saveDiscussionBtn.disabled = true;

    saveDiscussionBtn.innerHTML = `

        <span class="spinner-border spinner-border-sm"></span>

        Saving...

    `;

    try {

        const url = editingDiscussionId

            ? `/discussion/${editingDiscussionId}`

            : "/discussion/";

        const method = editingDiscussionId

            ? "PUT"

            : "POST";

        const body = editingDiscussionId

            ? {

                comment: comment

            }

            : {

                decision_id: Number(decisionId),

                comment: comment

            };

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

                body: JSON.stringify(body)

            }

        );

        const data =
    await response.json();

if (!response.ok) {

    saveDiscussionBtn.disabled = false;

    saveDiscussionBtn.innerHTML = `
        <i class="bi bi-chat-left-text"></i>
        Save Discussion
    `;

    alert(

        data.detail ||

        "Something went wrong."

    );

    return;

}

discussionModal.hide();

successToast.show();

editingDiscussionId = null;

document
    .getElementById("discussionForm")
    ?.reset();

saveDiscussionBtn.disabled = false;

saveDiscussionBtn.innerHTML = `
    <i class="bi bi-chat-left-text"></i>
    Save Discussion
`;

await loadDiscussions();
    }

    catch (error) {

        console.error(error);

        saveDiscussionBtn.disabled = false;

        saveDiscussionBtn.innerHTML = `

            <i class="bi bi-chat-left-text"></i>

            Save Discussion

        `;

        alert(

            "Unable to save discussion."

        );

    }

});

// =====================================================
// EDIT DISCUSSION
// =====================================================

function attachEdit(row, discussion) {

    row.querySelector(".edit").addEventListener("click", () => {

        if (isReviewer()) {

            alert(
                "Reviewers cannot edit discussions."
            );

            return;

        }

        editingDiscussionId =
            discussion.id;

        document.getElementById("discussionId").value =
            discussion.id;

        document.getElementById("decisionId").value =
            discussion.decision_id;

        document.getElementById("discussionComment").value =
            discussion.comment;

        saveDiscussionBtn.innerHTML = `

            <i class="bi bi-pencil-square"></i>

            Update Discussion

        `;

        discussionModal.show();

    });

}

// =====================================================
// DELETE DISCUSSION
// =====================================================

function attachDelete(row, discussionId) {

    row.querySelector(".delete").addEventListener("click", async () => {

        if (isReviewer()) {

            alert(
                "Reviewers cannot delete discussions."
            );

            return;

        }

        const confirmDelete = confirm(

            "Delete this discussion?"

        );

        if (!confirmDelete) {

            return;

        }

        try {

            const response = await fetch(

                `/discussion/${discussionId}`,

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

            loadDiscussions();

        }

        catch (error) {

            console.error(error);

            alert(

                "Unable to delete discussion."

            );

        }

    });

}
// =====================================================
// SEARCH
// =====================================================

function filterTable() {

    const search =
        searchInput.value.toLowerCase();

    const rows =
        document.querySelectorAll(
            "#discussionTable tr"
        );

    rows.forEach(row => {

        const text =
            row.innerText.toLowerCase();

        row.style.display =

            text.includes(search)

                ? ""

                : "none";

    });

}

searchInput?.addEventListener(

    "input",

    filterTable

);

// =====================================================
// ROLE BASED ACCESS
// =====================================================

function applyDiscussionPermissions() {

    // Employees

    if (isEmployee()) {

        // Employees can create, edit and delete
        // their discussions (backend should enforce ownership)

    }

    // Reviewer

    if (isReviewer()) {

        const newBtn =
            document.getElementById(
                "newDiscussionBtn"
            );

        if (newBtn) {

            newBtn.style.display =
                "none";

        }

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

function startDiscussionRefresh() {

    setInterval(async () => {

        if (!isLoggedIn()) {

            return;

        }

        try {

            await loadDiscussions();

        }

        catch (error) {

            console.error(error);

        }

    }, 300000);

}

// =====================================================
// PAGE PROTECTION
// =====================================================

function protectDiscussionPage() {

    if (!isLoggedIn()) {

        logout();

        return;

    }

    const role =
        getCurrentRole();

    if (

        role !== "Employee" &&

        role !== "Reviewer" &&

        role !== "Manager" &&

        role !== "Administrator"

    ) {

        alert(

            "You are not authorized to access this page."

        );

        window.location.href =
            "/dashboard-page";

    }

}

// =====================================================
// INITIALIZATION
// =====================================================

protectDiscussionPage();

loadDiscussions();

startDiscussionRefresh();

// =====================================================
// CONSOLE
// =====================================================

console.info(

    "[Discussion] Module Loaded"

);

});