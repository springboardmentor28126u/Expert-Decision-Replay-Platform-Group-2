// ======================================================
// Expert Decision Replay Platform
// Register JavaScript
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    const registerForm =
        document.getElementById("registerForm");

    registerForm.addEventListener(

        "submit",

        registerUser

    );

});

// ======================================================
// REGISTER USER
// ======================================================

async function registerUser(e) {

    e.preventDefault();

    const employee_id =
        document.getElementById("employeeId")
        .value.trim();

    const full_name =
        document.getElementById("fullName")
        .value.trim();

    const email =
        document.getElementById("email")
        .value.trim();

    const department =
        document.getElementById("department")
        .value;

    const role =
        document.getElementById("role")
        .value;

    const password =
        document.getElementById("password")
        .value;

    const confirmPassword =
        document.getElementById("confirmPassword")
        .value;

    const security_question =
        document.getElementById("securityQuestion")
        .value;

    const security_answer =
        document.getElementById("securityAnswer")
        .value.trim();

    const terms =
        document.getElementById("terms")
        .checked;

    // ==========================================
    // Required Fields
    // ==========================================

    if (

        employee_id === "" ||

        full_name === "" ||

        email === "" ||

        department === "" ||

        role === "" ||

        password === "" ||

        confirmPassword === "" ||

        security_question === "" ||

        security_answer === ""

    ) {

        alert("Please fill all required fields.");

        return;

    }

    // ==========================================
    // Terms
    // ==========================================

    if (!terms) {

        alert(
            "Please accept the Terms & Conditions."
        );

        return;

    }

    // ==========================================
    // Confirm Password
    // ==========================================

    if (password !== confirmPassword) {

        alert("Passwords do not match.");

        return;

    }

    // ==========================================
    // Employee ID Validation
    // ==========================================

    if (employee_id.length < 4) {

        alert(
            "Employee ID is invalid."
        );

        return;

    }

    // ==========================================
    // Email Validation
    // ==========================================

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {

        alert(
            "Please enter a valid email."
        );

        return;

    }

    // ==========================================
    // Password Validation
    // ==========================================

    const strongPassword =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!strongPassword.test(password)) {

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
        // ==========================================
    // Loading Button
    // ==========================================

    const submitBtn =
        document.querySelector(
            "button[type='submit']"
        );

    submitBtn.disabled = true;

    submitBtn.innerHTML = `

        <span class="spinner-border spinner-border-sm"></span>

        Creating Account...

    `;

    // ==========================================
    // User Data
    // ==========================================

    const userData = {

        employee_id: employee_id,

        full_name: full_name,

        email: email,

        password: password,

        role: role,

        department: department,

        security_question: security_question,

        security_answer: security_answer

    };

    try {

        const response = await fetch(

            "/users/register",

            {

                method: "POST",

                headers: {

                    "Content-Type":

                        "application/json"

                },

                body: JSON.stringify(

                    userData

                )

            }

        );

        const data =
            await response.json();

        if (!response.ok) {

            submitBtn.disabled = false;

            submitBtn.innerHTML = `

                <i class="bi bi-person-check-fill"></i>

                Create Account

            `;

            alert(data.detail);

            return;

        }

        alert(

            "Registration Successful!\n\nPlease login to continue."

        );

        window.location.href =
            "/login";

    }

    catch (error) {

        console.error(error);

        submitBtn.disabled = false;

        submitBtn.innerHTML = `

            <i class="bi bi-person-check-fill"></i>

            Create Account

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
    "Register Module Loaded Successfully"
);s