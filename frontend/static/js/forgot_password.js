// ======================================================
// Expert Decision Replay Platform
// Forgot Password JavaScript
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    const form =
        document.getElementById("forgotPasswordForm");

    form.addEventListener(

        "submit",

        forgotPassword

    );

});

// ======================================================
// VERIFY USER
// ======================================================

async function forgotPassword(e) {

    e.preventDefault();

    const employee_id =
        document.getElementById("employeeId")
        .value.trim();

    const email =
        document.getElementById("email")
        .value.trim();

    const security_question =
        document.getElementById("securityQuestion")
        .value;

    const security_answer =
        document.getElementById("securityAnswer")
        .value.trim();

    // ==========================================
    // Validation
    // ==========================================

    if (

        employee_id === "" ||

        email === "" ||

        security_question === "" ||

        security_answer === ""

    ) {

        alert("Please fill all fields.");

        return;

    }

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {

        alert("Please enter a valid email.");

        return;

    }
        // ==========================================
    // Loading Button
    // ==========================================

    const button =
        document.getElementById("verifyBtn");

    button.disabled = true;

    button.innerHTML = `

        <span class="spinner-border spinner-border-sm"></span>

        Verifying...

    `;

    try {

        const response = await fetch(

            "/users/forgot-password",

            {

                method: "POST",

                headers: {

                    "Content-Type":

                    "application/json"

                },

                body: JSON.stringify({

                    employee_id: employee_id,

                    email: email,

                    security_question: security_question,

                    security_answer: security_answer

                })

            }

        );

        const data =
            await response.json();

        if (!response.ok) {

            button.disabled = false;

            button.innerHTML = `

                <i class="bi bi-check-circle-fill"></i>

                Verify Identity

            `;

            alert(data.detail);

            return;

        }

        alert(

            "Identity verified successfully.\n\nYou can now reset your password."

        );

        // Store values for reset password page

        sessionStorage.setItem(
            "employee_id",
            employee_id
        );

        sessionStorage.setItem(
            "email",
            email
        );

        window.location.href =
            "/reset-password";

    }

    catch(error){

        console.error(error);

        button.disabled = false;

        button.innerHTML = `

            <i class="bi bi-check-circle-fill"></i>

            Verify Identity

        `;

        alert(
            "Unable to connect to server."
        );

    }

}

// ======================================================
// Console
// ======================================================

console.log(
    "Forgot Password Module Loaded Successfully"
);