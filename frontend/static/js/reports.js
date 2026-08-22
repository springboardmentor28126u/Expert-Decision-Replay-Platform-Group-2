// ======================================================
// Expert Decision Replay Platform
// Reports & Analytics JavaScript
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
    // Role Validation
    // =====================================================

    protectReportsPage();

    // =====================================================
    // Controls
    // =====================================================

    const refreshBtn =
        document.getElementById("refreshReports");

    const exportPdfBtn =
        document.getElementById("exportPdf");

    const exportExcelBtn =
        document.getElementById("exportExcel");

    // =====================================================
    // Dashboard Cards
    // =====================================================

    const totalUsers =
        document.getElementById("totalUsers");

    const totalDecisions =
        document.getElementById("totalDecisions");

    const totalApprovals =
        document.getElementById("totalApprovals");

    const totalDiscussions =
        document.getElementById("totalDiscussions");

    const totalKnowledge =
        document.getElementById("totalKnowledge");

    // =====================================================
    // Charts
    // =====================================================

    let decisionChart = null;

    let roleChart = null;

    let departmentChart = null;

    let approvalChart = null;
    // =====================================================
// Helper
// =====================================================

async function fetchData(url) {

    const response = await fetch(

        url,

        {

            headers: {

                Authorization:
                    `Bearer ${getToken()}`

            }

        }

    );

    if (!response.ok) {

        throw new Error(

            `Unable to fetch ${url}`

        );

    }

    return await response.json();

}
// ======================================================
// REPORT DATE FILTER
// ======================================================

function filterByReportPeriod(data, filter) {

    if (filter === "all") {
        return data;
    }

    const now = new Date();

    let startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);

    if (filter === "today") {

        // Today
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);

    }

    else if (filter === "week") {

        // Start of current week - Monday
        const day = now.getDay();

        const daysFromMonday =
            day === 0 ? 6 : day - 1;

        startDate.setDate(
            now.getDate() - daysFromMonday
        );

        startDate.setHours(0, 0, 0, 0);

    }

    else if (filter === "month") {

        // Start of current month
        startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

        startDate.setHours(0, 0, 0, 0);
    }

    return data.filter(item => {

        const dateValue =
            item.created_at ||
            item.updated_at ||
            item.date;

        if (!dateValue) {
            return false;
        }

        const itemDate =
            new Date(dateValue);

        return (
            !isNaN(itemDate.getTime()) &&
            itemDate >= startDate &&
            itemDate <= now
        );
    });
}
// ======================================================
// LOAD REPORT DATA
// ======================================================

async function loadReports() {

    try {

        const [
            users,
            decisions,
            approvals,
            discussions,
            knowledge
        ] = await Promise.all([
            fetchData("/users/all"),
            fetchData("/decisions/"),
            fetchData("/approvals/"),
            fetchData("/discussion/"),
            fetchData("/knowledge/")
        ]);

        // ======================================================
        // APPLY SELECTED REPORT FILTER
        // ======================================================

        const selectedFilter =
            document.getElementById("reportFilter")?.value || "all";

        const filteredUsers =
            filterByReportPeriod(users, selectedFilter);

        const filteredDecisions =
            filterByReportPeriod(decisions, selectedFilter);

        const filteredApprovals =
            filterByReportPeriod(approvals, selectedFilter);

        const filteredDiscussions =
            filterByReportPeriod(discussions, selectedFilter);

        const filteredKnowledge =
            filterByReportPeriod(knowledge, selectedFilter);
        // ==========================================
        // Dashboard Cards
        // ==========================================

        if (totalUsers)
            totalUsers.innerText =
                filteredUsers.length;

        if (totalDecisions)
            totalDecisions.innerText =
                filteredDecisions.length;

        if (totalApprovals)
            totalApprovals.innerText =
                filteredApprovals.length;

        if (totalDiscussions)
            totalDiscussions.innerText =
                filteredDiscussions.length;

        if (totalKnowledge)
            totalKnowledge.innerText =
                filteredKnowledge.length;
        // ==========================================
        // QUICK STATISTICS
        // ==========================================

        const decisionStats =
            getDecisionStatistics(decisions);

        const approvalStats =
            getApprovalStatistics(approvals);

        const employeeTotal =
            document.getElementById("employeeTotal");

        const reviewerTotal =
            document.getElementById("reviewerTotal");

        const managerTotal =
            document.getElementById("managerTotal");

        const adminTotal =
            document.getElementById("adminTotal");

        const draftCount =
            document.getElementById("draftCount");

        const pendingCount =
            document.getElementById("pendingCount");

        const approvedCount =
            document.getElementById("approvedCount");

        const rejectedCount =
            document.getElementById("rejectedCount");

        // User Distribution

        if (employeeTotal)
            employeeTotal.innerText =
                users.filter(u => u.role === "Employee").length;

        if (reviewerTotal)
            reviewerTotal.innerText =
                users.filter(u => u.role === "Reviewer").length;

        if (managerTotal)
            managerTotal.innerText =
                users.filter(u => u.role === "Manager").length;

        if (adminTotal)
            adminTotal.innerText =
                users.filter(u => u.role === "Administrator").length;

        // Decision Statistics

        if (draftCount)
            draftCount.innerText =
                decisionStats.draft;

        if (pendingCount)
            pendingCount.innerText =
                decisionStats.pending;

        if (approvedCount)
            approvedCount.innerText =
                decisionStats.approved;

        if (rejectedCount)
            rejectedCount.innerText =
                decisionStats.rejected;
        // ==========================================
        // Update Charts
        // ==========================================

        updateDecisionChart(filteredDecisions);

        updateRoleChart(filteredUsers);

        updateDepartmentChart(filteredDecisions);

        updateApprovalChart(filteredApprovals);

        // ==========================================
        // RECENT APPROVALS
        // ==========================================

        const recentApprovalTable =
            document.getElementById("recentApprovalTable");

        if (recentApprovalTable) {

            if (!approvals || approvals.length === 0) {

                recentApprovalTable.innerHTML = `
                    <tr>
                        <td colspan="4"
                            class="text-center text-muted">
                            No data available
                        </td>
                    </tr>
                `;

            } else {

                recentApprovalTable.innerHTML =
                    approvals
                        .slice(0, 5)
                        .map(approval => `
                            <tr>

                                <td>
                                    ${approval.id ?? "-"}
                                </td>

                                <td>
                                    ${approval.decision_id ?? "-"}
                                </td>

                                <td>
                                    ${approval.status ?? "-"}
                                </td>

                                <td>
                                    ${approval.created_at
                                        ? new Date(
                                            approval.created_at
                                        ).toLocaleDateString()
                                        : "-"
                                    }
                                </td>

                            </tr>
                        `)
                        .join("");
            }
        }


        }
        catch (error) {
        console.error(error);

        alert(

            error.message ||

            "Unable to load reports."

);

    }

}
// ======================================================
// DECISION STATISTICS
// ======================================================

function getDecisionStatistics(decisions) {

    return {

        draft:

            decisions.filter(

                d => d.status === "Draft"

            ).length,

        pending:

            decisions.filter(

                d => d.status === "Pending"

            ).length,

        approved:

            decisions.filter(

                d => d.status === "Approved"

            ).length,

        rejected:

            decisions.filter(

                d => d.status === "Rejected"

            ).length

    };

}
// ======================================================
// USER ROLE STATISTICS
// ======================================================

function getRoleStatistics(users) {

    return {

        employees:

            users.filter(

                u => u.role === "Employee"

            ).length,

        reviewers:

            users.filter(

                u => u.role === "Reviewer"

            ).length,

        managers:

            users.filter(

                u => u.role === "Manager"

            ).length,

        admins:

            users.filter(

                u => u.role === "Administrator"

            ).length

    };

}
// ======================================================
// APPROVAL STATISTICS
// ======================================================

function getApprovalStatistics(approvals) {

    return {

        pending:

            approvals.filter(

                a => a.status === "Pending"

            ).length,

        approved:

            approvals.filter(

                a => a.status === "Approved"

            ).length,

        rejected:

            approvals.filter(

                a => a.status === "Rejected"

            ).length

    };

}
// ======================================================
// DECISION STATUS CHART
// ======================================================

function updateDecisionChart(decisions) {

    const stats =
        getDecisionStatistics(decisions);

    const ctx =
        document.getElementById("decisionChart");

    if (!ctx) return;

    // Destroy any existing Chart.js instance
    const existingChart = Chart.getChart(ctx);

    if (existingChart) {
        existingChart.destroy();
    }

    decisionChart = new Chart(ctx, {
        type: "pie",

        data: {

            labels: [

                "Draft",

                "Pending",

                "Approved",

                "Rejected"

            ],

            datasets: [{

                data: [

                    stats.draft,

                    stats.pending,

                    stats.approved,

                    stats.rejected

                ],

                backgroundColor: [

                    "#6c757d",

                    "#ffc107",

                    "#198754",

                    "#dc3545"

                ]

            }]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {

                    position: "bottom"

                }

            }

        }

    });

}
// ======================================================
// USER ROLE CHART
// ======================================================

function updateRoleChart(users) {

    const stats =
        getRoleStatistics(users);

    const ctx =
        document.getElementById("roleChart");

    if (!ctx) return;

    const existingChart = Chart.getChart(ctx);

    if (existingChart) {
        existingChart.destroy();
    }

    roleChart = new Chart(ctx, {
        type: "doughnut",

        data: {

            labels: [

                "Employee",

                "Reviewer",

                "Manager",

                "Administrator"

            ],

            datasets: [{

                data: [

                    stats.employees,

                    stats.reviewers,

                    stats.managers,

                    stats.admins

                ],

                backgroundColor: [

                    "#0d6efd",

                    "#20c997",

                    "#ffc107",

                    "#dc3545"

                ]

            }]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {

                    position: "bottom"

                }

            }

        }

    });

}
// ======================================================
// DEPARTMENT CHART
// ======================================================

function updateDepartmentChart(decisions) {

    const departments = {};

    decisions.forEach(decision => {

        departments[decision.department] =
            (departments[decision.department] || 0) + 1;

    });

    const ctx =
        document.getElementById("departmentChart");

    if (!ctx) return;

    const existingChart = Chart.getChart(ctx);

    if (existingChart) {
        existingChart.destroy();
    }

    departmentChart = new Chart(ctx, {
        type: "bar",

        data: {

            labels:

                Object.keys(departments),

            datasets: [{

                label: "Decisions",

                data:

                    Object.values(departments)

            }]

        },

        options: {

            responsive: true,

            scales: {

                y: {

                    beginAtZero: true

                }

            }

        }

    });

}
// ======================================================
// APPROVAL STATUS CHART
// ======================================================

function updateApprovalChart(approvals) {

    const stats =
        getApprovalStatistics(approvals);

    const ctx =
        document.getElementById("approvalChart");

    if (!ctx) return;

    const existingChart = Chart.getChart(ctx);

    if (existingChart) {
        existingChart.destroy();
    }

    approvalChart = new Chart(ctx, {
        type: "pie",

        data: {

            labels: [

                "Pending",

                "Approved",

                "Rejected"

            ],

            datasets: [{

                data: [

                    stats.pending,

                    stats.approved,

                    stats.rejected

                ],

                backgroundColor: [

                    "#ffc107",

                    "#198754",

                    "#dc3545"

                ]

            }]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {

                    position: "bottom"

                }

            }

        }

    });

}
// ======================================================
// REFRESH REPORTS
// ======================================================

if (refreshBtn) {

    refreshBtn.addEventListener("click", async () => {
        if (refreshBtn.disabled) {

            return;

}

        refreshBtn.disabled = true;

        refreshBtn.innerHTML = `

            <span class="spinner-border spinner-border-sm"></span>

            Refreshing...

        `;

        try {

            await loadReports();

        }

        catch (error) {

            console.error(error);

        }

        refreshBtn.disabled = false;

        refreshBtn.innerHTML = `

            <i class="bi bi-arrow-clockwise"></i>

            Refresh Reports

        `;

    });

}

// ======================================================
// EXPORT PDF
// ======================================================

if (exportPdfBtn) {

    exportPdfBtn.addEventListener("click", async () => {

        console.log("PDF Clicked");

        try {

            const response = await fetch(
                "/reports/export/pdf",
                {
                    headers: {
                        Authorization:
                            "Bearer " + localStorage.getItem("token")
                    }
                }
            );

            console.log(
                "PDF Status:",
                response.status
            );

            if (!response.ok) {

                throw new Error(
                    "Unable to export PDF."
                );

            }

            const blob =
                await response.blob();

            const url =
                window.URL.createObjectURL(blob);

            const a =
                document.createElement("a");

            a.href = url;

            a.download = "Reports.pdf";

            document.body.appendChild(a);

            a.click();

            a.remove();

            window.URL.revokeObjectURL(url);

            console.log(
                "PDF downloaded successfully."
            );

        }

        catch (error) {

            console.error(
                "PDF Export Error:",
                error
            );

            alert(error.message);

        }

    });

}
// ======================================================
// EXPORT EXCEL
// ======================================================

if (exportExcelBtn) {

    exportExcelBtn.addEventListener("click", async () => {

        try {

            const response = await fetch("/reports/export/excel", {

                headers: {
                    Authorization: `Bearer ${getToken()}`
                }

            });

            if (!response.ok) {

                throw new Error("Unable to export Excel.");

            }

            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");

            a.href = url;

            a.download = "Reports.xlsx";

            document.body.appendChild(a);

            a.click();

            a.remove();

            window.URL.revokeObjectURL(url);

        }

        catch (error) {

            console.error(error);

            alert(error.message);

        }

    });

}
// ======================================================
// FILTER REPORTS
// ======================================================

const reportFilter =
    document.getElementById("reportFilter");

if (reportFilter) {

    reportFilter.addEventListener("change", () => {

        loadReports();

    });

}
// ======================================================
// ROLE BASED ACCESS
// ======================================================

function applyReportPermissions() {

    // ==========================================
    // Employee
    // ==========================================

    if (isEmployee()) {

        // Employees can only view reports

        if (exportPdfBtn) {

            exportPdfBtn.style.display = "none";

        }

        if (exportExcelBtn) {

            exportExcelBtn.style.display = "none";

        }

    }

    // ==========================================
    // Reviewer
    // ==========================================

    if (isReviewer()) {

        // Reviewers can view reports only

        if (exportPdfBtn) {

            exportPdfBtn.style.display = "none";

        }

        if (exportExcelBtn) {

            exportExcelBtn.style.display = "none";

        }

    }

    // ==========================================
    // Manager
    // ==========================================

    if (isManager()) {

        // Full access

    }

    // ==========================================
    // Administrator
    // ==========================================

    if (isAdmin()) {

        // Full access

    }

}

// ======================================================
// AUTO REFRESH
// ======================================================

function startReportRefresh() {

    setInterval(async () => {

        if (!isLoggedIn()) {

            return;

        }

        try {

            await loadReports();

        }

        catch (error) {

            console.error(error);

        }

    }, 300000);

}

// ======================================================
// PAGE PROTECTION
// ======================================================

function protectReportsPage() {

    if (!isLoggedIn()) {

        logout();

        return;

    }

    const role = getCurrentRole();

    if (

        role !== "Employee" &&

        role !== "Reviewer" &&

        role !== "Manager" &&

        role !== "Administrator"

    ) {

        alert(

            "You are not authorized to access Reports."

        );

        window.location.href = "/dashboard-page";

        return;

    }

}
// ======================================================
// INITIALIZATION
// ======================================================

applyReportPermissions();

await loadReports();
startReportRefresh();

// ======================================================
// WINDOW RESIZE
// ======================================================

window.addEventListener("resize", () => {

    if (decisionChart) {

        decisionChart.resize();

    }

    if (roleChart) {

        roleChart.resize();

    }

    if (departmentChart) {

        departmentChart.resize();

    }

    if (approvalChart) {

        approvalChart.resize();

    }

});

// ======================================================
// CONSOLE
// ======================================================

console.info(

    "[Reports] Module Loaded"

);

});