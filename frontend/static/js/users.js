// ======================================================
// Expert Decision Replay Platform
// User Management
// Part 1
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {

    checkAuthentication();

    const currentUser = await loadCurrentUser();

    if (!currentUser) return;

    //----------------------------------------------------
    // Bootstrap Modals
    //----------------------------------------------------

    const userModal = new bootstrap.Modal(
        document.getElementById("userModal")
    );

    const deleteModal = new bootstrap.Modal(
        document.getElementById("deleteUserModal")
    );

    const viewModal = new bootstrap.Modal(
        document.getElementById("viewUserModal")
    );

    //----------------------------------------------------
    // Variables
    //----------------------------------------------------

    let editingUserId = null;
    let deletingUserId = null;

    //----------------------------------------------------
    // Controls
    //----------------------------------------------------

    const addUserBtn = document.getElementById("addUserBtn");
    const saveUserBtn = document.getElementById("saveUserBtn");
    const refreshBtn = document.getElementById("refreshUsers");

    const searchBox = document.getElementById("searchUser");
    const roleFilter = document.getElementById("roleFilter");
    const statusFilter = document.getElementById("statusFilter");

    //----------------------------------------------------
    // Permission
    //----------------------------------------------------

    if (!isManager() && !isAdmin()) {

        alert("Access Denied.");

        window.location.href = "/dashboard-page";

        return;

    }

    if (isManager()) {

        addUserBtn.style.display = "none";

    }

    //----------------------------------------------------
    // Add User
    //----------------------------------------------------

    addUserBtn?.addEventListener("click", () => {

        if (!isAdmin()) {

            alert("Only Administrators can create users.");

            return;

        }

        editingUserId = null;

        document.getElementById("modalTitle").innerText = "Add New User";

        document.getElementById("userForm").reset();

        userModal.show();

    });

    //----------------------------------------------------
    // Load Users
    //----------------------------------------------------

    async function loadUsers() {

        try {

            const response = await fetch("/users/all", {

                headers: {

                    Authorization: `Bearer ${getToken()}`

                }

            });

            if (!response.ok)

                throw new Error("Unable to load users.");

            const users = await response.json();

            populateTable(users);

            updateStatistics(users);

        }

        catch (err) {

            console.error(err);

            alert("Unable to load users.");

        }

    }

    //----------------------------------------------------
    // Populate Table
    //----------------------------------------------------

    function populateTable(users) {

        const tbody = document.getElementById("usersTable");

        tbody.innerHTML = "";

        users.forEach(user => {

            const tr = document.createElement("tr");

            tr.innerHTML = `

                <td>${user.id}</td>

                <td>${user.employee_id}</td>

                <td>${user.full_name}</td>

                <td>${user.email}</td>

                <td>${user.department ?? "-"}</td>

                <td>${user.role}</td>

                <td>

                    <span class="badge ${user.is_active ? "bg-success" : "bg-danger"}">

                        ${user.is_active ? "Active" : "Inactive"}

                    </span>

                </td>

                <td>

                    ${new Date(user.created_at).toLocaleDateString()}

                </td>

                <td>

                    <button

                        class="btn btn-info btn-sm viewBtn"

                        data-id="${user.id}">

                        <i class="bi bi-eye-fill"></i>

                    </button>

                    <button

                        class="btn btn-warning btn-sm editBtn"

                        data-id="${user.id}">

                        <i class="bi bi-pencil-fill"></i>

                    </button>

                    <button

                        class="btn btn-danger btn-sm deleteBtn"

                        data-id="${user.id}">

                        <i class="bi bi-trash-fill"></i>

                    </button>

                </td>

            `;

            tbody.appendChild(tr);

        });

        if (isManager()) {

            document

                .querySelectorAll(".editBtn")

                .forEach(btn => btn.style.display = "none");

            document

                .querySelectorAll(".deleteBtn")

                .forEach(btn => btn.style.display = "none");

        }

    }

    //----------------------------------------------------
    // Statistics
    //----------------------------------------------------

    function updateStatistics(users) {

        document.getElementById("totalUsers").innerText = users.length;

        document.getElementById("employeeCount").innerText =

            users.filter(x => x.role === "Employee").length;

        document.getElementById("managerCount").innerText =

            users.filter(x => x.role === "Manager").length;

        document.getElementById("adminCount").innerText =

            users.filter(x => x.role === "Administrator").length;

    }
        //----------------------------------------------------
    // View User
    //----------------------------------------------------

    document.addEventListener("click", async (e) => {

        const button = e.target.closest(".viewBtn");

        if (!button) return;

        const userId = button.dataset.id;

        try {

            const response = await fetch(`/users/details/${userId}`, {

                headers: {

                    Authorization: `Bearer ${getToken()}`

                }

            });

            if (!response.ok)

                throw new Error("Unable to load user.");

            const user = await response.json();

            document.getElementById("viewEmployeeId").innerText =
                user.employee_id || "-";

            document.getElementById("viewFullName").innerText =
                user.full_name || "-";

            document.getElementById("viewEmail").innerText =
                user.email || "-";

            document.getElementById("viewDepartment").innerText =
                user.department || "-";

            document.getElementById("viewRole").innerText =
                user.role || "-";

            document.getElementById("viewStatus").innerHTML =
                user.is_active
                    ? '<span class="badge bg-success">Active</span>'
                    : '<span class="badge bg-danger">Inactive</span>';

            document.getElementById("viewCreatedAt").innerText =
                new Date(user.created_at).toLocaleDateString();

            viewModal.show();

        }

        catch (err) {

            console.error(err);

            alert("Unable to load user details.");

        }

    });

    //----------------------------------------------------
    // Edit User
    //----------------------------------------------------

    document.addEventListener("click", async (e) => {

        const button = e.target.closest(".editBtn");

        if (!button) return;

        if (!isAdmin()) {

            alert("Only Administrators can edit users.");

            return;

        }

        editingUserId = button.dataset.id;

        try {

            const response = await fetch(

                `/users/details/${editingUserId}`,

                {

                    headers: {

                        Authorization: `Bearer ${getToken()}`

                    }

                }

            );

            if (!response.ok)

                throw new Error("Unable to fetch user.");

            const user = await response.json();

            document.getElementById("modalTitle").innerText =
                "Update User";

            document.getElementById("employeeId").value =
                user.employee_id || "";

            document.getElementById("fullName").value =
                user.full_name || "";

            document.getElementById("email").value =
                user.email || "";

            document.getElementById("department").value =
                user.department || "IT";

            document.getElementById("role").value =
                user.role || "Employee";

            // FIXED
            document.getElementById("isActive").value =
                user.is_active ? "true" : "false";

            document.getElementById("password").value = "";

            userModal.show();

        }

        catch (err) {

            console.error(err);

            alert("Unable to load user.");

        }

    });
        //----------------------------------------------------
    // Save User
    //----------------------------------------------------

    saveUserBtn.addEventListener("click", async () => {

        if (saveUserBtn.disabled) return;

        if (!isAdmin()) {

            alert("Only Administrators can save users.");

            return;

        }

        const employee_id =
            document.getElementById("employeeId").value.trim();

        const full_name =
            document.getElementById("fullName").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const department =
            document.getElementById("department").value;

        const role =
            document.getElementById("role").value;

        const password =
            document.getElementById("password").value;
        
        const security_question =
            document.getElementById("securityQuestion")?.value || "";

        const security_answer =
            document.getElementById("securityAnswer")?.value.trim() || "";

        // FIXED
        const is_active =
            document.getElementById("isActive").value === "true";

        //------------------------------------------------

        if (

            employee_id === "" ||

            full_name === "" ||

            email === "" ||

            role === ""

        ) {

            alert("Please fill all required fields.");

            return;

        }

        saveUserBtn.disabled = true;

        saveUserBtn.innerHTML = `

            <span class="spinner-border spinner-border-sm"></span>

            Saving...

        `;

        try {

            let url;
            let method;
            let body;

            //--------------------------------------------
            // Update User
            //--------------------------------------------

            if (editingUserId !== null) {

                url = `/users/${editingUserId}`;

                method = "PUT";

                body = {

                    employee_id,

                    full_name,

                    email,

                    department,

                    role,

                    is_active

                };

            }

            //--------------------------------------------
            // Create User
            //--------------------------------------------

            else {

                url = "/users/admin/create";

                method = "POST";

                body = {

                    employee_id,

                    full_name,

                    email,

                    password,

                    department,

                    role,
                    
                    security_question,
                    
                    security_answer,

                    is_active

                };

            }

            //--------------------------------------------

            const response = await fetch(

                url,

                {

                    method,

                    headers: {

                        "Content-Type": "application/json",

                        Authorization: `Bearer ${getToken()}`

                    },

                    body: JSON.stringify(body)

                }

            );


            const isEdit = editingUserId !== null;

            editingUserId = null;

            userModal.hide();

            document

                .getElementById("userForm")

                .reset();

            await loadUsers();

            alert(

                isEdit

                    ? "User updated successfully."

                    : "User created successfully."

            );

        }

        catch (err) {

            console.error(err);

            alert(

                err.message ||

                "Unable to save user."

            );

        }

        finally {

            saveUserBtn.disabled = false;

            saveUserBtn.innerHTML = `

                <i class="bi bi-check-circle"></i>

                Save User

            `;

        }

    });
        //----------------------------------------------------
    // Delete User
    //----------------------------------------------------

    document.addEventListener("click", (e) => {

        const button = e.target.closest(".deleteBtn");

        if (!button) return;

        if (!isAdmin()) {

            alert("Only Administrators can delete users.");

            return;

        }

        deletingUserId = button.dataset.id;

        deleteModal.show();

    });

    //----------------------------------------------------
    // Confirm Delete
    //----------------------------------------------------

    document.getElementById("confirmDeleteBtn")
        .addEventListener("click", async () => {

        if (!deletingUserId) return;

        try {

            const response = await fetch(

                `/users/${deletingUserId}`,

                {

                    method: "DELETE",

                    headers: {

                        Authorization: `Bearer ${getToken()}`

                    }

                }

            );

            if (!response.ok)

                throw new Error("Unable to delete user.");

            deleteModal.hide();

            deletingUserId = null;

            await loadUsers();

            alert("User deleted successfully.");

        }

        catch (err) {

            console.error(err);

            alert(

                err.message ||

                "Unable to delete user."

            );

        }

    });

    //----------------------------------------------------
    // Search & Filters
    //----------------------------------------------------

    function filterUsers() {

        const search =
            searchBox.value.toLowerCase().trim();

        const role =
            roleFilter.value;

        const status =
            statusFilter.value;

        document

            .querySelectorAll("#usersTable tr")

            .forEach(row => {

                const text =
                    row.innerText.toLowerCase();

                const rowRole =
                    row.children[5]?.innerText.trim();

                const rowStatus =
                    row.children[6]?.innerText
                        .trim()
                        .toLowerCase();

                let visible = true;

                if (

                    search &&

                    !text.includes(search)

                ) {

                    visible = false;

                }

                if (

                    role &&

                    rowRole !== role

                ) {

                    visible = false;

                }

                if (

                    status === "true" &&

                    rowStatus !== "active"

                ) {

                    visible = false;

                }

                if (

                    status === "false" &&

                    rowStatus !== "inactive"

                ) {

                    visible = false;

                }

                row.style.display =
                    visible ? "" : "none";

            });

    }

    //----------------------------------------------------
    // Search Events
    //----------------------------------------------------

    searchBox?.addEventListener(

        "input",

        filterUsers

    );

    roleFilter?.addEventListener(

        "change",

        filterUsers

    );

    statusFilter?.addEventListener(

        "change",

        filterUsers

    );

    //----------------------------------------------------
    // Refresh
    //----------------------------------------------------

    refreshBtn?.addEventListener("click", async () => {

        if (refreshBtn.disabled)

            return;

        refreshBtn.disabled = true;

        refreshBtn.innerHTML = `

            <span class="spinner-border spinner-border-sm"></span>

            Refreshing...

        `;

        await loadUsers();

        refreshBtn.disabled = false;

        refreshBtn.innerHTML = `

            <i class="bi bi-arrow-clockwise"></i>

            Refresh

        `;

    });

    //----------------------------------------------------
    // Auto Refresh (5 Minutes)
    //----------------------------------------------------

    setInterval(async () => {

        if (!isLoggedIn())

            return;

        try {

            await loadUsers();

        }

        catch (err) {

            console.error(err);

        }

    }, 300000);

    //----------------------------------------------------
    // Initial Page Load
    //----------------------------------------------------

    await loadUsers();

    console.info(

        "[Users] Module Loaded Successfully"

    );

});
