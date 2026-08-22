// ======================================================
// Expert Decision Replay Platform
// Approval Management JavaScript
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
    // Bootstrap Components
    // =====================================================

    const modalElement =
        document.getElementById("approvalModal");

    const toastElement =
        document.getElementById("successToast");

    const approvalModal =
        new bootstrap.Modal(modalElement);

    const successToast =
        new bootstrap.Toast(toastElement);

    // =====================================================
    // Controls
    // =====================================================

    const searchInput =
        document.getElementById("searchApproval");

    const statusFilter =
        document.getElementById("statusFilter");

    const saveApprovalBtn =
        document.getElementById("saveApprovalBtn");

    let selectedApproval = null;

    // =====================================================
    // RBAC
    // =====================================================

    applyApprovalPermissions();
    // =====================================================
// LOAD APPROVALS
// =====================================================

async function loadApprovals() {

    try {

        const response = await fetch(

            "/approvals/",

            {

                headers: {

                    Authorization:
                        `Bearer ${getToken()}`

                }

            }

        );

        if (!response.ok) {

            throw new Error(
                "Unable to load approvals."
            );

        }

        const approvals =
            await response.json();

        const table =
            document.getElementById(
                "approvalTable"
            );

        table.innerHTML = "";

        approvals.forEach(approval => {

            const row =
                document.createElement("tr");

            row.innerHTML = `

                <td>${approval.id}</td>

                <td>${approval.decision_id}</td>

                <td>${approval.approver_id}</td>

                <td>
                    <span
                        class="status ${approval.status.toLowerCase()}"
                        data-status="${approval.status}"
                    >
                        ${approval.status}
                    </span>
                </td>

                <td>
                    ${
                        approval.escalated
                            ? `
                                <span
                                    class="badge bg-danger"
                                    title="${
                                        approval.escalated_at
                                            ? "Escalated at " +
                                            new Date(
                                                approval.escalated_at
                                            ).toLocaleString()
                                            : "Approval escalated"
                                    }"
                                >
                                    <i class="bi bi-exclamation-triangle-fill"></i>
                                    Escalated
                                </span>
                            `
                            : `
                                <span class="badge bg-success">
                                    <i class="bi bi-check-circle-fill"></i>
                                    Normal
                                </span>
                            `
                    }
                </td>

                <td>
                    ${approval.comments || "-"}
                </td>
                <td>

                    ${approval.approved_at

                        ? new Date(
                            approval.approved_at
                          ).toLocaleDateString()

                        : "-"}

                </td>

                <td>

                    <button
                        class="btn btn-success btn-sm approve">

                        Approve

                    </button>

                    <button
                        class="btn btn-danger btn-sm reject">

                        Reject

                    </button>

                </td>

            `;

            table.appendChild(row);

            attachApprove(

                row,

                approval

            );

            attachReject(

                row,

                approval

            );

            // ==========================================
            // RBAC
            // ==========================================

            const approveBtn =
                row.querySelector(".approve");

            const rejectBtn =
                row.querySelector(".reject");

            if (isEmployee()) {

                approveBtn.style.display =
                    "none";

                rejectBtn.style.display =
                    "none";

            }

        });

    }

    catch (error) {

        console.error(error);

        alert(

            "Unable to load approvals."

        );

    }

}
// =====================================================
// APPROVE
// =====================================================

function attachApprove(row, approval) {

    row.querySelector(".approve").addEventListener("click", () => {

        if (isEmployee()) {

            alert(
                "Employees cannot approve decisions."
            );

            return;

        }

        selectedApproval = approval;

        document.getElementById("approvalId").value =
            approval.id;

        document.getElementById("decisionId").value =
            approval.decision_id;

        document.getElementById("approvalStatus").value =
            "Approved";

        document.getElementById("approvalComments").value =
            approval.comments || "";

        approvalModal.show();

    });

}

// =====================================================
// REJECT
// =====================================================

function attachReject(row, approval) {

    row.querySelector(".reject").addEventListener("click", () => {

        if (isEmployee()) {

            alert(
                "Employees cannot reject decisions."
            );

            return;

        }

        selectedApproval = approval;

        document.getElementById("approvalId").value =
            approval.id;

        document.getElementById("decisionId").value =
            approval.decision_id;

        document.getElementById("approvalStatus").value =
            "Rejected";

        document.getElementById("approvalComments").value =
            approval.comments || "";

        approvalModal.show();

    });

}

// =====================================================
// SAVE APPROVAL
// =====================================================

saveApprovalBtn.addEventListener("click", async () => {
    if (saveApprovalBtn.disabled) {

    return;

}

    if (!selectedApproval) {

        alert("Please select an approval.");

        return;

    }
    const comments =

    document
        .getElementById("approvalComments")
        .value
        .trim();

if (comments.length < 10) {

    alert(

        "Comments must contain at least 10 characters."

    );

    return;

}

    saveApprovalBtn.disabled = true;
    

    saveApprovalBtn.innerHTML = `

        <span class="spinner-border spinner-border-sm"></span>

        Saving...

    `;

    try {

        const response = await fetch(

            `/approvals/${selectedApproval.id}`,

            {

                method: "PUT",

                headers: {

                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${getToken()}`

                },

                body: JSON.stringify({

                    status:

                        document.getElementById(
                            "approvalStatus"
                        ).value,

                    comments:

                        document.getElementById(
                            "approvalComments"
                        ).value

                })

            }

        );

        const data =
    await response.json();

if (!response.ok) {

    saveApprovalBtn.disabled = false;

    saveApprovalBtn.innerHTML = `

        <i class="bi bi-check-circle"></i>

        Save Approval

    `;

    alert(

        data.detail ||

        "Something went wrong."

    );

    return;

}

approvalModal.hide();

document
    .getElementById("approvalForm")
    .reset();

selectedApproval = null;

successToast.show();

await loadApprovals();

saveApprovalBtn.disabled = false;

saveApprovalBtn.innerHTML = `

    <i class="bi bi-check-circle"></i>

    Save Approval

`;
    }

    catch (error) {

        console.error(error);

        saveApprovalBtn.disabled = false;

        saveApprovalBtn.innerHTML = `

            <i class="bi bi-check-circle"></i>

            Save Approval

        `;

        alert(

            "Unable to update approval."

        );

    }

});
// =====================================================
// SEARCH & STATUS FILTER
// =====================================================

function filterTable() {

    const search =
        (searchInput?.value || "")
            .trim()
            .toLowerCase();

    const selectedStatus =
        (statusFilter?.value || "")
            .trim()
            .toLowerCase();

    const rows =
        document.querySelectorAll(
            "#approvalTable tr"
        );

    rows.forEach(row => {

        const text =
            (row.textContent || "")
                .trim()
                .toLowerCase();

        const statusElement =
            row.querySelector(".status");

        const rowStatus =
            statusElement
                ? statusElement.textContent
                    .trim()
                    .toLowerCase()
                : "";

        const searchMatch =
            search === "" ||
            text.includes(search);

        const statusMatch =
            selectedStatus === "" ||
            rowStatus === selectedStatus;

        row.style.display =
            searchMatch && statusMatch
                ? ""
                : "none";
    });
}
searchInput?.addEventListener(
    "input",
    filterTable
);

statusFilter?.addEventListener(
    "change",
    filterTable
);
// =====================================================
// ROLE BASED ACCESS
// =====================================================

function applyApprovalPermissions() {

    // Employees cannot access approvals

    if (isEmployee()) {

        const newApprovalBtn =
            document.getElementById("newApprovalBtn");

        if (newApprovalBtn) {

            newApprovalBtn.style.display =
                "none";

        }

    }

    // Reviewer

    if (isReviewer()) {

        // Reviewer can approve/reject

    }

    // Manager

    if (isManager()) {

        // Full Access

    }

    // Administrator

    if (isAdmin()) {

        // Full Access

    }

}

// =====================================================
// AUTO REFRESH
// =====================================================

function startApprovalRefresh() {

    setInterval(async () => {

        if (!isLoggedIn()) {

            return;

        }

        try {

            await loadApprovals();

        }

        catch (error) {

            console.error(error);

        }

    }, 300000);

}

// =====================================================
// PAGE PROTECTION
// =====================================================

function protectApprovalPage() {

    if (!isLoggedIn()) {

        logout();

        return;

    }

    const role =
        getCurrentRole();

    if (

        role !== "Reviewer" &&

        role !== "Manager" &&

        role !== "Administrator"

    ) {

        alert(
            "You are not authorized to access the Approval Management page."
        );

        window.location.href =
            "/dashboard-page";

        return;

    }

}

// =====================================================
// INITIALIZATION
// =====================================================

protectApprovalPage();

loadApprovals();

startApprovalRefresh();

// =====================================================
// CONSOLE
// =====================================================

console.info(

    "[Approval] Module Loaded"

);

});