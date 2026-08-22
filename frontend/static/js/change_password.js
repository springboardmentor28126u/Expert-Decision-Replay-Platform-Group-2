// ======================================================
// Expert Decision Replay Platform
// Change Password JavaScript
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("token");

    if (!token) {

        window.location.href = "/login";

        return;

    }

    initializePasswordToggle();

    initializeStrengthMeter();

    initializeForm();

});

// ======================================================
// SHOW / HIDE PASSWORD
// ======================================================

function initializePasswordToggle() {

    const buttons = document.querySelectorAll(".togglePassword");

    buttons.forEach(button => {

        button.addEventListener("click", () => {

            const input = button.previousElementSibling;

            const icon = button.querySelector("i");

            if (input.type === "password") {

                input.type = "text";

                icon.className = "bi bi-eye-slash";

            }

            else {

                input.type = "password";

                icon.className = "bi bi-eye";

            }

        });

    });

}

// ======================================================
// PASSWORD STRENGTH
// ======================================================

function initializeStrengthMeter() {

    const password =
        document.getElementById("newPassword");

    password.addEventListener("input", () => {

        updateStrength(password.value);

    });

}

function updateStrength(password) {

    const bar =
        document.getElementById("passwordStrength");

    if (password.length === 0) {

        bar.style.width = "0%";

        bar.className = "progress-bar";

        bar.innerText = "";

        return;

    }

    let score = 0;

    if (password.length >= 8)
        score++;

    if (/[A-Z]/.test(password))
        score++;

    if (/[a-z]/.test(password))
        score++;

    if (/[0-9]/.test(password))
        score++;

    if (/[^A-Za-z0-9]/.test(password))
        score++;

    switch (score) {

        case 0:
        case 1:

            bar.style.width = "20%";
            bar.className = "progress-bar bg-danger";
            bar.innerText = "Very Weak";

            break;

        case 2:

            bar.style.width = "40%";
            bar.className = "progress-bar bg-warning";
            bar.innerText = "Weak";

            break;

        case 3:

            bar.style.width = "60%";
            bar.className = "progress-bar bg-info";
            bar.innerText = "Medium";

            break;

        case 4:

            bar.style.width = "80%";
            bar.className = "progress-bar bg-primary";
            bar.innerText = "Strong";

            break;

        case 5:

            bar.style.width = "100%";
            bar.className = "progress-bar bg-success";
            bar.innerText = "Very Strong";

            break;

    }

}

// ======================================================
// FORM
// ======================================================

function initializeForm(){

    document
        .getElementById("changePasswordForm")
        .addEventListener(
            "submit",
            changePassword
        );

}
async function changePassword(e) {

    e.preventDefault();

    const currentPassword =
        document.getElementById("currentPassword").value;

    const newPassword =
        document.getElementById("newPassword").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    // ==========================================
    // Validation
    // ==========================================

    if (
        currentPassword === "" ||
        newPassword === "" ||
        confirmPassword === ""
    ) {

        alert("Please fill all fields.");
        return;

    }

    if (newPassword !== confirmPassword) {

        alert("New Password and Confirm Password do not match.");
        return;

    }

    if (currentPassword === newPassword) {

        alert("New password cannot be the same as the current password.");
        return;

    }

    const strongPassword =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!strongPassword.test(newPassword)) {

        alert(
            "Password must contain:\n\n" +
            "• One Uppercase Letter\n" +
            "• One Lowercase Letter\n" +
            "• One Number\n" +
            "• One Special Character"
        );

        return;

    }

    // ==========================================
    // Loading Button
    // ==========================================

    const button =
        document.getElementById("updatePasswordBtn");

    button.disabled = true;

    button.innerHTML = `
        <span class="spinner-border spinner-border-sm"></span>
        Updating...
    `;

    const token =
        localStorage.getItem("token");

    try {

        const response = await fetch(
            "/users/change-password",
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            button.disabled = false;

            button.innerHTML = `
                <i class="bi bi-key-fill"></i>
                Update Password
            `;

            alert(data.detail);

            return;

        }

        button.disabled = false;

        button.innerHTML = `
            <i class="bi bi-key-fill"></i>
            Update Password
        `;

       alert("Password updated successfully!");

        clearForm();

        logoutAfterPasswordChange();

    }

    catch (error) {

        console.error(error);

        button.disabled = false;

        button.innerHTML = `
            <i class="bi bi-key-fill"></i>
            Update Password
        `;

        alert("Unable to connect to server.");

    }

}
// ======================================================
// AUTO LOGOUT AFTER PASSWORD CHANGE
// ======================================================

function logoutAfterPasswordChange() {

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    setTimeout(() => {

        alert("Please login again using your new password.");

        window.location.href = "/login";

    }, 1000);

}

// ======================================================
// RESET PASSWORD STRENGTH BAR
// ======================================================

function resetStrengthBar() {

    const bar =
        document.getElementById("passwordStrength");

    bar.style.width = "0%";

    bar.className = "progress-bar";

    bar.innerText = "";

}

// ======================================================
// CLEAR FORM
// ======================================================

function clearForm() {

    document
        .getElementById("changePasswordForm")
        .reset();

    resetStrengthBar();

}


// ======================================================
// CONSOLE
// ======================================================

console.info("[Change Password] Module Loaded");