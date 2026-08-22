// ======================================================
// Expert Decision Replay Platform
// Reset Password JavaScript
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    initializePasswordToggle();

    initializeStrengthMeter();

    // If user didn't verify identity, don't allow access

    if (

        !sessionStorage.getItem("employee_id") ||

        !sessionStorage.getItem("email")

    ) {

        alert(

            "Please verify your identity first."

        );

        window.location.href = "/forgot-password";

        return;

    }

    document
        .getElementById("resetPasswordForm")
        .addEventListener(
            "submit",
            resetPassword
        );

});

// ======================================================
// SHOW / HIDE PASSWORD
// ======================================================

function initializePasswordToggle() {

    const buttons =
        document.querySelectorAll(".togglePassword");

    buttons.forEach(button => {

        button.addEventListener("click", () => {

            const input =
                button.previousElementSibling;

            const icon =
                button.querySelector("i");

            if (input.type === "password") {

                input.type = "text";

                icon.className =
                    "bi bi-eye-slash";

            }

            else {

                input.type = "password";

                icon.className =
                    "bi bi-eye";

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

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const widths = [
        "0%",
        "20%",
        "40%",
        "60%",
        "80%",
        "100%"
    ];

    const labels = [
    "",
    "Very Weak",
    "Weak",
    "Medium",
    "Strong",
    "Very Strong"
];
    const colors = [
        "",
        "bg-danger",
        "bg-warning",
        "bg-info",
        "bg-primary",
        "bg-success"
    ];

    bar.style.width = widths[score];
    bar.className = "progress-bar " + colors[score];
    bar.innerText = labels[score];

}

// ======================================================
// RESET PASSWORD
// ======================================================

async function resetPassword(e) {

    e.preventDefault();

    const employee_id =
        sessionStorage.getItem("employee_id");

    const email =
        sessionStorage.getItem("email");

    const newPassword =
        document.getElementById("newPassword").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    if (

        newPassword === "" ||

        confirmPassword === ""

    ) {

        alert("Please fill all fields.");

        return;

    }

    if (newPassword !== confirmPassword) {

        alert("Passwords do not match.");

        return;

    }

    const strongPassword =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!strongPassword.test(newPassword)) {

        alert(

            "Password must contain:\n\n" +

            "• At least 8 characters\n" +

            "• One uppercase letter\n" +

            "• One lowercase letter\n" +

            "• One number\n" +

            "• One special character"

        );

        return;

    }

    const button =
        document.getElementById("resetPasswordBtn");

    button.disabled = true;

    button.innerHTML = `

        <span class="spinner-border spinner-border-sm"></span>

        Updating Password...
    `;

    try {

        const response = await fetch(

            "/users/reset-password",

            {

                method: "PUT",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    employee_id: employee_id,

                    email: email,

                    new_password: newPassword

                })

            }

        );

        const data =
            await response.json();

        if (!response.ok) {

            button.disabled = false;

            button.innerHTML = `

                <i class="bi bi-shield-lock-fill"></i>

                Reset Password

            `;

            alert(data.detail);

            return;

        }

        // Clear verification session

        sessionStorage.removeItem("employee_id");

        sessionStorage.removeItem("email");
        button.disabled = false;

        button.innerHTML = `
            <i class="bi bi-shield-lock-fill"></i>
            Reset Password
`   ;

       alert("✅ Password reset successfully!");

    setTimeout(() => {
        window.location.href = "/login";
    }, 800);

    }

    catch (error) {

        console.error(error);

        button.disabled = false;

        button.innerHTML = `

            <i class="bi bi-shield-lock-fill"></i>

            Reset Password

        `;

        alert(

            "Unable to connect to server."

        );

    }

}

// ======================================================
// Console
// ======================================================

console.info("Reset Password Module Loaded");