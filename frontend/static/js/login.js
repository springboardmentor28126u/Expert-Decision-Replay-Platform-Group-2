// ======================================================
// Expert Decision Replay Platform
// Login JavaScript
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");

    loginForm.addEventListener("submit", login);

});

// ======================================================
// LOGIN
// ======================================================

async function login(e) {

    e.preventDefault();

    const employeeId =
        document.getElementById("employeeId").value.trim();

    const password =
        document.getElementById("password").value;

    if (employeeId === "" || password === "") {

        alert("Please enter Employee ID and Password.");

        return;

    }

    const formData = new URLSearchParams();

    // OAuth2PasswordRequestForm expects "username"
    formData.append("username", employeeId);

    formData.append("password", password);

    try {

        // ==========================================
        // LOGIN
        // ==========================================

        const response = await fetch(

            "/users/login",

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/x-www-form-urlencoded"

                },

                body: formData

            }

        );

        const data = await response.json();

        if (!response.ok) {

            alert(data.detail);

            return;

        }

        // ==========================================
        // SAVE TOKEN
        // ==========================================

        setToken(data.access_token);

        // ==========================================
        // LOAD CURRENT USER
        // ==========================================

        const user = await loadCurrentUser();

        if (!user) {

            alert("Unable to load user details.");

            return;

        }

        // Save user in localStorage

        localStorage.setItem(

            "user",

            JSON.stringify(user)

        );

        alert(

            "Welcome " +

            user.full_name +

            " (" +

            user.role +

            ")"

        );

        // ==========================================
        // REDIRECT
        // ==========================================

        window.location.href = "/dashboard-page";

    }

    catch (error) {

        console.error("Login Error:", error);

        alert("Unable to connect to server.");

    }

}

// ======================================================
// CONSOLE
// ======================================================

console.log(
    "Login Module Loaded Successfully"
);