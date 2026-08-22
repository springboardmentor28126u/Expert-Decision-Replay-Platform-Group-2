// ======================================================
// Expert Decision Replay Platform
// Profile JavaScript
// ======================================================

document.addEventListener("DOMContentLoaded", function () {

    // ==================================================
    // SIDEBAR TOGGLE
    // ==================================================

    const sidebar = document.getElementById("sidebar");
    const toggleButton = document.getElementById("toggleSidebar");

    if (sidebar && toggleButton) {

        toggleButton.addEventListener("click", function () {

            sidebar.classList.toggle("collapsed");

        });

    }


    // ==================================================
    // AUTHENTICATION
    // ==================================================

    const token = localStorage.getItem("token");

    if (!token) {

        window.location.href = "/login";

        return;

    }


    // ==================================================
    // INITIALIZE PROFILE
    // ==================================================

    initializeEvents();

    loadProfile();

});
// ======================================================
// INITIALIZE EVENTS
// ======================================================

function initializeEvents() {

    document
        .getElementById("profileForm")
        ?.addEventListener(
            "submit",
            saveProfile
        );

    document
        .getElementById("cancelBtn")
        ?.addEventListener(
            "click",
            () => loadProfile()
        );

    document
        .getElementById("uploadPhoto")
        ?.addEventListener(
            "click",
            showUploadMessage
        );

    document
        .getElementById("phone")
        ?.addEventListener(
            "input",
            validatePhone
        );

    document
        .getElementById("fullName")
        ?.addEventListener(
            "blur",
            validateName
        );

}

// ======================================================
// LOAD PROFILE
// ======================================================

async function loadProfile() {

    const token = localStorage.getItem("token");

    try {

        const response = await fetch("/users/profile", {

            headers: {

                Authorization: "Bearer " + token

            }

        });

        if (!response.ok) {

            throw new Error("Unable to load profile.");

        }

        const user = await response.json();

        displayProfile(user);

    }

    catch (error) {

        console.error(error);

        alert("Unable to load profile.");

    }

}
// ======================================================
// DISPLAY PROFILE
// ======================================================

function displayProfile(user) {

    // ==========================================
    // Header
    // ==========================================

    document.getElementById("profileName").innerText =
        user.full_name || "-";

    document.getElementById("profileRole").innerText =
        user.role || "-";

    document.getElementById("profileStatus").innerText =
        user.is_active ? "Active" : "Inactive";

    // ==========================================
    // Profile Image
    // ==========================================

    document.getElementById("profileImage").src =
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
            user.full_name || "User"
        )}&background=2563eb&color=fff&size=180`;

    // ==========================================
    // Personal Information
    // ==========================================

    document.getElementById("fullName").value =
        user.full_name || "";

    document.getElementById("employeeId").value =
        user.employee_id || "";

    document.getElementById("email").value =
        user.email || "";

    document.getElementById("phone").value =
        user.phone || "";

    document.getElementById("department").value =
        user.department || "IT";

    document.getElementById("role").value =
        user.role || "";

    document.getElementById("status").value =
        user.is_active ? "Active" : "Inactive";

    document.getElementById("createdAt").value =
        user.created_at
            ? new Date(user.created_at).toLocaleDateString()
            : "-";

    // ==========================================
    // Account Information
    // ==========================================

    document.getElementById("userId").innerText =
        user.id || "-";

    document.getElementById("accountRole").innerText =
        user.role || "-";

    document.getElementById("accountDepartment").innerText =
        user.department || "-";

    document.getElementById("accountStatus").innerText =
        user.is_active ? "Active" : "Inactive";

    document.getElementById("joinedDate").innerText =
        user.created_at
            ? new Date(user.created_at).toLocaleDateString()
            : "-";

    // ==========================================
    // Role Permissions
    // ==========================================

    if (
        user.role === "Employee" ||
        user.role === "Reviewer"
    ) {

        document.getElementById("department").disabled = true;

    }

}
// ======================================================
// SAVE PROFILE
// ======================================================

async function saveProfile(e) {

    e.preventDefault();

    const token = localStorage.getItem("token");

    const profileData = {

        full_name:
            document.getElementById("fullName").value.trim(),

        phone:
            document.getElementById("phone").value.trim(),

        department:
            document.getElementById("department").value

    };

    // ==========================================
    // Validation
    // ==========================================

    if (profileData.full_name.length < 3) {

        alert("Full Name must contain at least 3 characters.");

        return;

    }

    if (
        profileData.phone !== "" &&
        profileData.phone.length !== 10
    ) {

        alert("Phone Number must contain exactly 10 digits.");

        return;

    }

    const button =
        document.getElementById("saveProfileBtn");

    button.disabled = true;

    button.innerHTML = `
        <span class="spinner-border spinner-border-sm"></span>
        Saving...
    `;

    try {

        const response = await fetch(

            "/users/profile",

            {

                method: "PUT",

                headers: {

                    "Content-Type": "application/json",

                    "Authorization":
                        "Bearer " + token

                },

                body: JSON.stringify(profileData)

            }

        );

        const data = await response.json();

        button.disabled = false;

        button.innerHTML = `
            <i class="bi bi-floppy-fill"></i>
            Save Changes
        `;

        if (!response.ok) {

            alert(data.detail);

            return;

        }

        // Update Local Storage

        localStorage.setItem(

            "user",

            JSON.stringify(data)

        );

        alert("Profile updated successfully.");

        loadProfile();

    }

    catch (error) {

        console.error(error);

        button.disabled = false;

        button.innerHTML = `
            <i class="bi bi-floppy-fill"></i>
            Save Changes
        `;

        alert("Unable to update profile.");

    }

}
// ======================================================
// UPLOAD PHOTO
// ======================================================

function showUploadMessage() {

    alert(
        "Profile photo upload will be available in a future update."
    );

}

// ======================================================
// PHONE VALIDATION
// ======================================================

function validatePhone() {

    this.value = this.value.replace(/[^0-9]/g, "");

    if (this.value.length > 10) {

        this.value = this.value.substring(0, 10);

    }

}

// ======================================================
// NAME VALIDATION
// ======================================================

function validateName() {

    if (this.value.trim() === "") {

        alert("Full Name cannot be empty.");

        this.focus();

        return;

    }

    if (this.value.trim().length < 3) {

        alert("Full Name must contain at least 3 characters.");

        this.focus();

    }

}

// ======================================================
// REFRESH PROFILE
// ======================================================

function refreshProfile() {

    loadProfile();

}

// ======================================================
// AUTO REFRESH EVERY 5 MINUTES
// ======================================================

setInterval(() => {

    if (localStorage.getItem("token")) {

        refreshProfile();

    }

}, 300000);

// ======================================================
// LOGOUT
// ======================================================

function logoutSession() {

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";

}

// ======================================================
// CONSOLE
// ======================================================

console.info("[Profile] Module Loaded Successfully");