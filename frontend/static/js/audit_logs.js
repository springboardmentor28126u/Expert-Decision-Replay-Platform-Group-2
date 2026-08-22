// ======================================================
// Expert Decision Replay Platform
// Audit Logs JavaScript
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    loadAuditLogs();

});


// ======================================================
// LOAD AUDIT LOGS
// ======================================================

async function loadAuditLogs() {

    const token = localStorage.getItem("token");

    // Check login
    if (!token) {

        window.location.href = "/login";

        return;
    }

    try {

        const response = await fetch("/audit/", {

            method: "GET",

            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }

        });


        // Unauthorized
        if (response.status === 401) {

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.location.href = "/login";

            return;
        }


        if (!response.ok) {

            throw new Error(
                "Unable to load audit logs."
            );

        }


        const logs = await response.json();


        const tableBody =
            document.getElementById(
                "auditTableBody"
            );


        tableBody.innerHTML = "";


        if (!logs || logs.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="7"
                        class="text-center">
                        No audit logs found.
                    </td>
                </tr>
            `;

            return;
        }


        logs.forEach(log => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${log.id}
                </td>

                <td>
                    ${log.username || "-"}
                </td>

                <td>
                    ${log.role || "-"}
                </td>

                <td>
                    ${log.module || "-"}
                </td>

                <td>
                    ${log.action || "-"}
                </td>

                <td>
                    ${log.description || "-"}
                </td>

                <td>
                    ${
                        log.created_at
                            ? new Date(
                                log.created_at
                              ).toLocaleString()
                            : "-"
                    }
                </td>

            `;


            tableBody.appendChild(row);

        });

    }

    catch (error) {

        console.error(
            "Audit Log Error:",
            error
        );


        const tableBody =
            document.getElementById(
                "auditTableBody"
            );


        tableBody.innerHTML = `

            <tr>

                <td colspan="7"
                    class="text-center text-danger">

                    Unable to load audit logs.

                </td>

            </tr>

        `;

    }

}