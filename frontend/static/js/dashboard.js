// =============================================
// Expert Decision Replay Platform
// Dashboard JavaScript
// =============================================

document.addEventListener("DOMContentLoaded", async () => {
    

    // ==========================================
    // Check Authentication
    // ==========================================

    checkAuthentication();

    // ==========================================
    // Load Current User
    // ==========================================

    const user = await loadCurrentUser();

    if (!user) {

        return;

    }

    // ==========================================
    // Profile Information
    // ==========================================
    
    const profileName = document.getElementById("profileName");
if (profileName) profileName.innerText = user.full_name;

const profileRole = document.getElementById("profileRole");
if (profileRole) profileRole.innerText = user.role;

const dropdownName = document.getElementById("dropdownName");
if (dropdownName) dropdownName.innerText = user.full_name;

const dropdownRole = document.getElementById("dropdownRole");
if (dropdownRole) dropdownRole.innerText = user.role;

const welcomeUser = document.getElementById("welcomeUser");
if (welcomeUser) {
    welcomeUser.innerHTML = `Welcome Back, ${user.full_name} (${user.role})`;
}

const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=2563eb&color=fff`;

const profileImage = document.getElementById("profileImage");
if (profileImage) {
    profileImage.src = avatar;
}

const dropdownAvatar = document.getElementById("dropdownAvatar");
if (dropdownAvatar) {
    dropdownAvatar.src = avatar;
}
    
    // ==========================================
    // Sidebar Toggle
    // ==========================================

    const sidebar =
        document.getElementById("sidebar");

    const toggleSidebar = document.getElementById("toggleSidebar");

    if (toggleSidebar && sidebar) {
        toggleSidebar.addEventListener("click", () => {
            sidebar.classList.toggle("collapsed");
        });
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }
    const logoutDropdown = document.getElementById("logoutDropdown");
    if (logoutDropdown) {
        logoutDropdown.addEventListener("click", logout);
    }

    // ==========================================
    // Role Based Menu
    // ==========================================

    applyRolePermissions();

    // ==========================================
    // Dashboard
    // ==========================================

    await loadDashboard();
    await loadNotifications();
});
    async function loadDashboard() {

    try {

        const token = getToken();

        if (!token) {
            console.log("No token found");
            return;
        }

        const response = await fetch("/dashboard/", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log("Dashboard Status:", response.status);

        const data = await response.json();

        console.log("Dashboard Data:", data);

        if (!response.ok) {
            throw new Error(data.detail || "Failed to load dashboard");
        }

        [
            ["totalUsers", data.total_users],
            ["totalDecisions", data.total_decisions],
            ["pendingApprovals", data.pending_approvals],
            ["approvedDecisions", data.approved_decisions],
            ["draftDecisions", data.draft_decisions],
            ["rejectedDecisions", data.rejected_decisions],
            ["totalDiscussions", data.total_discussions],
            ["knowledgeArticles", data.knowledge_articles],

            // Decision Summary
            ["summaryDecision", data.total_decisions],
            ["summaryApproved", data.approved_decisions],
            ["summaryPending", data.pending_approvals],
            ["summaryRejected", data.rejected_decisions]

        ].forEach(([id, value]) => {

            const el = document.getElementById(id);

            if (el) {
                el.innerText = value ?? 0;
            }

        });    
        // =====================================
        // DECISION SUMMARY
        // =====================================

        const summaryDecision =
            document.getElementById("summaryDecision");

        const summaryApproved =
            document.getElementById("summaryApproved");

        const summaryPending =
            document.getElementById("summaryPending");

        const summaryRejected =
            document.getElementById("summaryRejected");

        if (summaryDecision) {
            summaryDecision.innerText =
                data.total_decisions ?? 0;
        }

        if (summaryApproved) {
            summaryApproved.innerText =
                data.approved_decisions ?? 0;
        }

        if (summaryPending) {
            summaryPending.innerText =
                data.pending_approvals ?? 0;
        }

        if (summaryRejected) {
            summaryRejected.innerText =
                data.rejected_decisions ?? 0;
        }

        loadDecisionChart(data);
        loadApprovalChart(data);
        loadRecentActivities(data);

    }
    catch (error) {

        console.error(error);

        showDashboardError();

    }
    }
// =====================================================
// DECISION CHART
// =====================================================

function loadDecisionChart(data) {

    const canvas =
        document.getElementById("decisionChart");

    if (!canvas) {

        return;

    }

    const ctx = canvas.getContext("2d");

    if (window.decisionChart instanceof Chart) {

        window.decisionChart.destroy();

    }

    window.decisionChart = new Chart(ctx, {

        type: "doughnut",

        data: {

            labels: [

                "Draft",

                "Pending",

                "Approved",

                "Rejected"

            ],

            datasets: [

                {

                    data: [

                        data.draft_decisions || 0,

                        data.pending_decisions || 0,

                        data.approved_decisions || 0,

                        data.rejected_decisions || 0

                    ],

                    backgroundColor: [

                        "#6c757d",

                        "#ffc107",

                        "#198754",

                        "#dc3545"

                    ],

                    borderWidth: 1

                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    position: "bottom"

                }

            }

        }

    });

}

// =====================================================
// APPROVAL CHART
// =====================================================

function loadApprovalChart(data) {

    const canvas =
        document.getElementById("approvalChart");

    if (!canvas) {

        return;

    }

    const ctx = canvas.getContext("2d");

    if (window.approvalChart instanceof Chart) {

        window.approvalChart.destroy();

    }

    window.approvalChart = new Chart(ctx, {

        type: "bar",

        data: {

            labels: [

                "Pending",

                "Approved",

                "Rejected"

            ],

            datasets: [

                {

                    label: "Approvals",

                    data: [

                        data.pending_approvals || 0,

                        data.approved_approvals || 0,

                        data.rejected_approvals || 0

                    ]

                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            scales: {

                y: {

                    beginAtZero: true

                }

            }

        }

    });

}
// =====================================================
// RECENT ACTIVITIES
// =====================================================

function loadRecentActivities(data) {

    const table =
        document.getElementById("recentDecisionTable");

    if (!table) {

        return;

    }

    table.innerHTML = "";

    if (

        !data.recent_activities ||

        data.recent_activities.length === 0

    ) {

        table.innerHTML = `

            <tr>

                <td colspan="5" class="text-center">

                    No recent activities found.

                </td>

            </tr>

        `;

        return;

    }

    data.recent_activities.forEach(activity => {

        table.innerHTML += `

            <tr>

                <td>${activity.user}</td>

                <td>${activity.action}</td>

                <td>${activity.module}</td>

                <td>${activity.status}</td>

                <td>${activity.date}</td>

            </tr>

        `;

    });

}

// =====================================================
// SEARCH
// =====================================================

function initializeSearch() {

    const searchBox =
        document.getElementById("globalSearch");

    if (!searchBox) {

        return;

    }

    searchBox.addEventListener("keyup", function () {

        const value =
            this.value.toLowerCase();

        document
            .querySelectorAll(".dashboard-card")
            .forEach(card => {

                const text =
                    card.innerText.toLowerCase();

                card.style.display =
                    text.includes(value)
                        ? ""
                        : "none";

            });

    });

}

// =====================================================
// SHOW ERROR
// =====================================================

function showDashboardError() {

    document
        .querySelectorAll(".dashboard-value")
        .forEach(item => {

            item.innerText = "--";

        });

    console.error(

        "Dashboard could not be loaded."

    );

}
// =====================================================
// ROLE BASED ACCESS
// =====================================================
function applyRolePermissions() {

    const role = getCurrentRole();

    // Sidebar menus
    const approvalMenu =
        document.getElementById("approvalMenu");

    const reportsMenu =
        document.getElementById("reportsMenu");

    const usersMenu =
        document.getElementById("usersMenu");

    const knowledgeMenu =
        document.getElementById("knowledgeMenu");

    const alternativeMenu =
        document.getElementById("alternativeMenu");

    const profileSidebar =
        document.getElementById("profileSidebar");


    // ==========================================
    // EMPLOYEE
    // ==========================================

    if (role === "Employee") {

        if (approvalMenu)
            approvalMenu.style.display = "none";

        if (reportsMenu)
            reportsMenu.style.display = "none";

        if (usersMenu)
            usersMenu.style.display = "none";

    }


    // ==========================================
    // REVIEWER
    // ==========================================

    else if (role === "Reviewer") {

        if (reportsMenu)
            reportsMenu.style.display = "none";

        if (usersMenu)
            usersMenu.style.display = "none";

    }


    // ==========================================
    // MANAGER
    // ==========================================

    else if (role === "Manager") {

        // Manager can access normal modules

        if (alternativeMenu)
            alternativeMenu.style.display = "";

        if (profileSidebar)
            profileSidebar.style.display = "";

    }


    // ==========================================
    // ADMINISTRATOR
    // ==========================================

    else if (role === "Administrator") {

        // Administrator gets full access

        if (approvalMenu)
            approvalMenu.style.display = "";

        if (reportsMenu)
            reportsMenu.style.display = "";

        if (usersMenu)
            usersMenu.style.display = "";

        if (knowledgeMenu)
            knowledgeMenu.style.display = "";

        if (alternativeMenu)
            alternativeMenu.style.display = "";

        if (profileSidebar)
            profileSidebar.style.display = "";

    }

    else {

        logout();

    }
}
// =====================================================
// AUTO REFRESH DASHBOARD
// =====================================================

function startAutoRefresh() {

    setInterval(async () => {

        if (!isLoggedIn()) {

            return;

        }

        try {

            await loadDashboard();


        }

        catch (error) {

            console.error(error);

        }

    }, 300000); // 5 Minutes

}

// =====================================================
// REFRESH BUTTON
// =====================================================

function initializeRefreshButton() {

    const refreshBtn =
        document.getElementById("refreshDashboard");

    if (!refreshBtn) {

        return;

    }

    refreshBtn.addEventListener("click", async () => {

        refreshBtn.disabled = true;

        refreshBtn.innerHTML = `

            <span class="spinner-border spinner-border-sm"></span>

            Refreshing...

        `;

        try {

            await loadDashboard();


        }

        catch (error) {

            console.error(error);

        }

        refreshBtn.disabled = false;

        refreshBtn.innerHTML = `

            <i class="bi bi-arrow-clockwise"></i>

            Refresh

        `;

    });

}

// =====================================================
// PAGE PROTECTION
// =====================================================

function protectDashboard() {

    const role =
        getCurrentRole();

    if (

        role !== "Employee" &&

        role !== "Reviewer" &&

        role !== "Manager" &&

        role !== "Administrator"

    ) {

        logout();

    }

}

// =====================================================
// INITIALIZE
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    protectDashboard();

    applyRolePermissions();

    initializeSearch();

    initializeRefreshButton();

    startAutoRefresh();

});
// ==========================================
// Notification Dropdown
// ==========================================

const notificationBtn = document.getElementById("notificationBtn");
const notificationDropdown = document.getElementById("notificationDropdown");

if (notificationBtn && notificationDropdown) {

    notificationBtn.addEventListener("click", (e) => {

        e.stopPropagation();

        notificationDropdown.classList.toggle("d-none");

    });

    document.addEventListener("click", (e) => {

        if (
            !notificationBtn.contains(e.target) &&
            !notificationDropdown.contains(e.target)
        ) {

            notificationDropdown.classList.add("d-none");

        }

    });

}
// ==========================================
// Load Notifications
// ==========================================

async function loadNotifications() {

    try {

        const token = getToken();

        const response = await fetch("/notifications/", {

            headers: {
                Authorization: `Bearer ${token}`
            }

        });

        if (!response.ok) {
            throw new Error("Failed to load notifications");
        }

        const notifications = await response.json();

        const list = document.getElementById("notificationList");
        const badge = document.getElementById("notificationCount");

        list.innerHTML = "";

        if (notifications.length === 0) {

            list.innerHTML = `
                <div class="notification-item">
                    No notifications
                </div>
            `;

            badge.textContent = "0";
            return;
        }

        // Unread count
        const unread = notifications.filter(n => !n.is_read).length;
        badge.textContent = unread;

        notifications.forEach(n => {

            list.innerHTML += `

                <div class="notification-item ${n.is_read ? "" : "unread"}">

                    <div class="notification-content"
                        onclick="markNotificationRead(${n.id})">

                        <strong>${n.title}</strong>

                        <p>${n.message}</p>

                        <small>
                            ${new Date(n.created_at).toLocaleString()}
                        </small>

                    </div>

                    <button
                        class="delete-notification"
                        onclick="deleteNotification(event, ${n.id})">

                        🗑️

                    </button>

                </div>

            `;

        });
     }

    catch (err) {

        console.error(err);

    }

}

// ==========================================
// Mark Notification as Read
// ==========================================

async function markNotificationRead(id) {

    console.log("Clicked notification:", id);

    const token = getToken();

    const response = await fetch(`/notifications/${id}/read`, {

        method: "PUT",

        headers: {
            Authorization: `Bearer ${token}`
        }

    });

    console.log("Status:", response.status);

    const data = await response.json();

    console.log(data);

    loadNotifications();

}
// ==========================================
// Delete Notification
// ==========================================

async function deleteNotification(event, id) {

    event.stopPropagation();

    const token = getToken();

    const response = await fetch(

        `/notifications/${id}`,

        {

            method: "DELETE",

            headers: {
                Authorization: `Bearer ${token}`
            }

        }

    );

    if (response.ok) {

        loadNotifications();

    }

}
// =====================================================
// CONSOLE
// =====================================================

console.info(
    "[Dashboard] Module Loaded"
);