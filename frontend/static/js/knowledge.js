// ======================================================
// Expert Decision Replay Platform
// Knowledge Repository JavaScript
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {

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
        document.getElementById("knowledgeModal");

    const toastElement =
        document.getElementById("successToast");

    const knowledgeModal =
        new bootstrap.Modal(modalElement);

    const successToast =
        new bootstrap.Toast(toastElement);

    // =====================================================
    // Controls
    // =====================================================

    const newKnowledgeBtn =
        document.getElementById("newKnowledgeBtn");

    const saveKnowledgeBtn =
        document.getElementById("saveKnowledgeBtn");

    const searchInput =
        document.getElementById("searchKnowledge");

    let editingKnowledgeId = null;

    // =====================================================
    // Role Permissions
    // =====================================================

    applyKnowledgePermissions();

    // =====================================================
    // New Article
    // =====================================================

    if (newKnowledgeBtn) {

    newKnowledgeBtn.addEventListener("click", () => {

        editingKnowledgeId = null;

        document.getElementById("knowledgeForm").reset();
        document.getElementById("knowledgeId").value = "";
        document.getElementById("knowledgeCategory").value = "Technology";

        saveKnowledgeBtn.innerHTML = `
            <i class="bi bi-book"></i>
            Save Article
        `;

        knowledgeModal.show();

    });

}
    // =====================================================
// LOAD KNOWLEDGE ARTICLES
// =====================================================

async function loadKnowledge() {

    try {

        const response = await fetch(

            "/knowledge/",

            {

                headers: {

                    Authorization:
                        `Bearer ${getToken()}`

                }

            }

        );

        if (!response.ok) {

            throw new Error(
                "Unable to load knowledge articles."
            );

        }

        const articles =
            await response.json();

        const table =
            document.getElementById(
                "knowledgeTable"
            );

        table.innerHTML = "";

        articles.forEach(article => {

            const row =
                document.createElement("tr");

            row.innerHTML = `

                <td>${article.id}</td>

                <td>${article.title}</td>

                <td>${article.category}</td>

                <td>${article.tags || "-"}</td>

                <td>${article.created_by}</td>

                <td>

                    ${new Date(
                        article.created_at
                    ).toLocaleDateString()}

                </td>

                <td>

                    <button
                        class="action-btn edit">

                        <i class="bi bi-pencil-square"></i>

                    </button>

                    <button
                        class="action-btn delete">

                        <i class="bi bi-trash-fill"></i>

                    </button>

                </td>

            `;

            table.appendChild(row);

            attachEdit(

                row,

                article

            );

            attachDelete(

                row,

                article.id

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

            "Unable to load knowledge articles."

        );

    }

}
// =====================================================
// SAVE ARTICLE
// =====================================================

saveKnowledgeBtn.addEventListener("click", async () => {
    if (saveKnowledgeBtn.disabled) {

    return;

}

    const title =
        document.getElementById("knowledgeTitle").value.trim();

    const category =
        document.getElementById("knowledgeCategory").value;

    const tags =
        document.getElementById("knowledgeTags").value.trim();

    const content =
        document.getElementById("knowledgeContent").value.trim();

    // ==========================================
    // Validation
    // ==========================================

    if (

        title === "" ||

        category === "" ||

        content === ""

    ) {

        alert("Please fill all required fields.");

        return;

    }
    if (title.length < 5) {

    alert(

        "Title must contain at least 5 characters."

    );

    return;

}

if (content.length < 20) {

    alert(

        "Content must contain at least 20 characters."

    );

    return;

}

    saveKnowledgeBtn.disabled = true;

    saveKnowledgeBtn.innerHTML = `

        <span class="spinner-border spinner-border-sm"></span>

        Saving...

    `;

    try {

        const url = editingKnowledgeId

            ? `/knowledge/${editingKnowledgeId}`

            : "/knowledge/";

        const method = editingKnowledgeId

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

                    category: category,

                    tags: tags,

                    content: content

                })

            }

        );

        const data =
            await response.json();

        if (!response.ok) {

            saveKnowledgeBtn.disabled = false;

            saveKnowledgeBtn.innerHTML = `

                <i class="bi bi-book"></i>

                Save Article

            `;

            alert(

                data.detail ||

                "Something went wrong."

);
            return;  
}
            knowledgeModal.hide();
        successToast.show();

        editingKnowledgeId = null;

        document
            .getElementById("knowledgeForm")
            ?.reset();

        saveKnowledgeBtn.disabled = false;

        saveKnowledgeBtn.innerHTML = `

            <i class="bi bi-book"></i>

            Save Article

        `;

        await loadKnowledge();

    }

    catch (error) {

        console.error(error);

        saveKnowledgeBtn.disabled = false;

        saveKnowledgeBtn.innerHTML = `

            <i class="bi bi-book"></i>

            Save Article

        `;

        alert(

            "Unable to save article."

        );

    }

});

// =====================================================
// EDIT ARTICLE
// =====================================================

function attachEdit(row, article) {

    row.querySelector(".edit").addEventListener("click", () => {

        if (isReviewer()) {

            alert(
                "Reviewers cannot edit knowledge articles."
            );

            return;

        }

        editingKnowledgeId =
            article.id;

        document.getElementById("knowledgeId").value =
            article.id;

        document.getElementById("knowledgeTitle").value =
            article.title;

        document.getElementById("knowledgeCategory").value =
            article.category;

        document.getElementById("knowledgeTags").value =
            article.tags || "";

        document.getElementById("knowledgeContent").value =
            article.content;

        saveKnowledgeBtn.innerHTML = `

            <i class="bi bi-pencil-square"></i>

            Update Article

        `;

        bootstrap.Modal.getOrCreateInstance(
            document.getElementById("knowledgeModal")
        ).show();
    });

}

// =====================================================
// DELETE ARTICLE
// =====================================================

function attachDelete(row, knowledgeId) {

    row.querySelector(".delete").addEventListener("click", async () => {

        if (isReviewer()) {

            alert(
                "Reviewers cannot delete knowledge articles."
            );

            return;

        }

        const confirmDelete = confirm(

            "Delete this knowledge article?"

        );

        if (!confirmDelete) {

            return;

        }

        try {

            const response = await fetch(

                `/knowledge/${knowledgeId}`,

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

            await loadKnowledge();

        }

        catch (error) {

            console.error(error);

            alert(

                "Unable to delete article."

            );

        }

    });

}
// =====================================================
// SEARCH ARTICLES
// =====================================================

function filterTable() {

    const search =
        searchInput.value.toLowerCase();

    const rows =
        document.querySelectorAll(
            "#knowledgeTable tr"
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

function applyKnowledgePermissions() {

    // ==========================================
    // Employee
    // ==========================================

    if (isEmployee()) {

        // Employees can create and manage
        // their own knowledge articles.

    }

    // ==========================================
    // Reviewer
    // ==========================================

    if (isReviewer()) {

        const newBtn =
            document.getElementById(
                "newKnowledgeBtn"
            );

        if (newBtn) {

            newBtn.style.display =
                "none";

        }

    }

    // ==========================================
    // Manager
    // ==========================================

    if (isManager()) {

        // Full Access

    }

    // ==========================================
    // Administrator
    // ==========================================

    if (isAdmin()) {

        // Full Access

    }

}

// =====================================================
// AUTO REFRESH
// =====================================================

function startKnowledgeRefresh() {

    setInterval(async () => {

        if (!isLoggedIn()) {

            return;

        }

        try {

            await loadKnowledge();

        }

        catch (error) {

            console.error(error);

        }

    }, 300000);

}

// =====================================================
// PAGE PROTECTION
// =====================================================

function protectKnowledgePage() {

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

        return;

    }

}

// =====================================================
// INITIALIZATION
// =====================================================

protectKnowledgePage();

loadKnowledge();

startKnowledgeRefresh();

// =====================================================
// CONSOLE
// =====================================================

console.log(

    "Knowledge Repository Module Loaded Successfully"

);

});