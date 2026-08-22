// ======================================================
// Expert Decision Replay Platform
// Authentication Helper
// ======================================================

// ==========================================
// TOKEN
// ==========================================

function getToken() {

    return localStorage.getItem("token");

}

function setToken(token) {

    localStorage.setItem(

        "token",

        token

    );

}

function removeToken() {

    localStorage.removeItem("token");

}

// ==========================================
// USER DETAILS
// ==========================================

function setCurrentUser(user) {

    localStorage.setItem(

        "employeeId",

        user.employee_id

    );

    localStorage.setItem(

        "userName",

        user.full_name

    );

    localStorage.setItem(

        "userRole",

        user.role

    );

    localStorage.setItem(

        "department",

        user.department || ""

    );

    localStorage.setItem(

        "email",

        user.email

    );

}

function getCurrentRole() {

    return localStorage.getItem(

        "userRole"

    );

}

function getCurrentName() {

    return localStorage.getItem(

        "userName"

    );

}

function getEmployeeId() {

    return localStorage.getItem(

        "employeeId"

    );

}

function getDepartment() {

    return localStorage.getItem(

        "department"

    );

}
// ======================================================
// ROLE CHECKS
// ======================================================

function isEmployee() {

    return getCurrentRole() === "Employee";

}

function isReviewer() {

    return getCurrentRole() === "Reviewer";

}

function isManager() {

    return getCurrentRole() === "Manager";

}

function isAdmin() {

    return getCurrentRole() === "Administrator";

}

// ======================================================
// AUTHENTICATION
// ======================================================

function isLoggedIn() {

    return getToken() !== null;

}

function checkAuthentication() {

    if (!isLoggedIn()) {

        window.location.href = "/login";

    }

}

// ======================================================
// LOAD CURRENT USER
// ======================================================

async function loadCurrentUser() {

    const token = getToken();

    if (!token) {

        return null;

    }

    try {

        const response = await fetch(

            "/users/me",

            {

                headers: {

                    Authorization:

                        `Bearer ${token}`

                }

            }

        );

        if (!response.ok) {

            logout();

            return null;

        }

        const user = await response.json();

        setCurrentUser(user);

        return user;

    }

    catch (error) {

        console.error(error);

        logout();

        return null;

    }

}

// ======================================================
// LOGOUT
// ======================================================

function logout() {

    localStorage.removeItem("token");

    localStorage.removeItem("employeeId");

    localStorage.removeItem("userName");

    localStorage.removeItem("userRole");

    localStorage.removeItem("department");

    localStorage.removeItem("email");

    sessionStorage.clear();

    window.location.href = "/login";

}

// ======================================================
// CONSOLE
// ======================================================

console.log(
    "Authentication Helper Loaded Successfully"
);