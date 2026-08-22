const API_URL = "/alternatives";
const DECISION_API = "/decisions";

let alternatives = [];
let decisions = [];

document.addEventListener("DOMContentLoaded", () => {

    // Sidebar Toggle
    const sidebar = document.getElementById("sidebar");
    const toggleSidebar = document.getElementById("toggleSidebar");

    if (toggleSidebar && sidebar) {

        toggleSidebar.addEventListener("click", () => {
            sidebar.classList.toggle("collapsed");
        });

    }


    loadDecisions();
    loadAlternatives();

    document
        .getElementById("alternativeForm")
        .addEventListener("submit", saveAlternative);

    document
        .getElementById("searchInput")
        .addEventListener("input", filterAlternatives);

    document
        .getElementById("decisionFilter")
        .addEventListener("change", filterAlternatives);

});
// -----------------------------
// Get JWT Token
// -----------------------------

function getAuthHeaders() {

    const token = getToken();

    return {

        "Content-Type": "application/json",

        "Authorization": `Bearer ${token}`

    };

}

// -----------------------------
// Load Decisions
// -----------------------------

async function loadDecisions() {

    try {

        const response = await fetch(DECISION_API, {

            headers: getAuthHeaders()

        });

        if (!response.ok) {

            throw new Error("Unable to load decisions.");

        }

        decisions = await response.json();

        const select = document.getElementById("decisionSelect");

        const filter = document.getElementById("decisionFilter");

        select.innerHTML =
            '<option value="">Select Decision</option>';

        filter.innerHTML =
            '<option value="">All Decisions</option>';

        decisions.forEach(decision => {

            select.innerHTML += `
                <option value="${decision.id}">
                    ${decision.title}
                </option>
            `;

            filter.innerHTML += `
                <option value="${decision.id}">
                    ${decision.title}
                </option>
            `;

        });

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

// -----------------------------
// Load Alternatives
// -----------------------------

async function loadAlternatives() {

    try {

        const response = await fetch(API_URL, {

            headers: getAuthHeaders()

        });

        if (!response.ok) {

            throw new Error("Unable to load alternatives.");

        }

        alternatives = await response.json();

        renderTable(alternatives);

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

// -----------------------------
// Save Alternative
// -----------------------------

async function saveAlternative(e) {

    e.preventDefault();

    const id =
        document.getElementById("alternativeId").value;

    const decisionId =
        document.getElementById("decisionSelect").value;

    if (!decisionId) {

        alert("Please select a decision.");

        return;

    }

    const score =
        parseInt(document.getElementById("score").value);

    if (isNaN(score) || score < 0 || score > 100) {

        alert("Score must be between 0 and 100.");

        return;

    }

    const data = {

        decision_id: parseInt(decisionId),

        alternative_name:
            document.getElementById("alternativeName").value,

        description:
            document.getElementById("description").value,

        advantages:
            document.getElementById("advantages").value,

        disadvantages:
            document.getElementById("disadvantages").value,

        estimated_cost:
            document.getElementById("estimatedCost").value,

        risk_level:
            document.getElementById("riskLevel").value,

        score: score

    };

    const url = id
        ? `${API_URL}/${id}`
        : API_URL;

    const method = id
        ? "PUT"
        : "POST";

    try {

        const response = await fetch(url, {

            method,

            headers: getAuthHeaders(),

            body: JSON.stringify(data)

        });

        if (response.ok) {

            alert("Saved Successfully");

            document
                .getElementById("alternativeForm")
                .reset();

            document
                .getElementById("alternativeId")
                .value = "";

            loadAlternatives();

        }

        else {

            const error =
                await response.text();

            alert(error || "Error Saving");

        }

    }

    catch (error) {

        console.error(error);

        alert("Server Error");

    }

}

// -----------------------------
// Edit Alternative
// -----------------------------

function editAlternative(id) {

    const alt = alternatives.find(
        a => a.id === id
    );

    if (!alt) {
        alert("Alternative not found.");
        return;
    }

    // Store ID
    document.getElementById(
        "alternativeId"
    ).value = alt.id;

    // Fill Decision
    document.getElementById(
        "decisionSelect"
    ).value = alt.decision_id;

    // Fill Alternative Name
    document.getElementById(
        "alternativeName"
    ).value = alt.alternative_name || "";

    // Fill Description
    document.getElementById(
        "description"
    ).value = alt.description || "";

    // Fill Advantages
    document.getElementById(
        "advantages"
    ).value = alt.advantages || "";

    // Fill Disadvantages
    document.getElementById(
        "disadvantages"
    ).value = alt.disadvantages || "";

    // Fill Estimated Cost
    document.getElementById(
        "estimatedCost"
    ).value = alt.estimated_cost || "";

    // Fill Risk
    document.getElementById(
        "riskLevel"
    ).value = alt.risk_level || "Medium";

    // Fill Score
    document.getElementById(
        "score"
    ).value = alt.score ?? 0;

    // Change button text
    const submitButton =
        document.querySelector(
            "#alternativeForm button[type='submit']"
        );

    if (submitButton) {

        submitButton.innerHTML = `
            <i class="bi bi-pencil-square"></i>
            Update Alternative
        `;

    }

    // Scroll to edit form
    document
        .getElementById("alternativeForm")
        .scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    // Focus on name
    document
        .getElementById("alternativeName")
        .focus();

}
// -----------------------------
// Delete Alternative
// -----------------------------

async function deleteAlternative(id) {

    if (!confirm("Delete this alternative?"))
        return;

    try {

        const response = await fetch(

            `${API_URL}/${id}`,

            {

                method: "DELETE",

                headers: getAuthHeaders()

            }

        );

        if (response.ok) {

            alert("Alternative deleted successfully.");

            loadAlternatives();

        }

        else {

            alert("Unable to delete alternative.");

        }

    }

    catch (error) {

        console.error(error);

        alert("Server Error");

    }

}

// -----------------------------
// Search & Filter
// -----------------------------

function filterAlternatives() {

    const search =
        document
            .getElementById("searchInput")
            .value
            .toLowerCase();

    const decision =
        document
            .getElementById("decisionFilter")
            .value;

    const filtered =
        alternatives.filter(a => {

            const matchSearch =
                a.alternative_name
                    .toLowerCase()
                    .includes(search);

            const matchDecision =
                !decision ||
                a.decision_id == decision;

            return matchSearch && matchDecision;

        });

    renderTable(filtered);

}

// -----------------------------
// Render Table
// -----------------------------

function renderTable(data) {

    const tbody =
        document.getElementById("alternativeTable");

    tbody.innerHTML = "";

    if (data.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    No Alternatives Found
                </td>
            </tr>
        `;

        return;

    }

    data.forEach(item => {

        let badge = "secondary";

        if (item.risk_level === "Low")
            badge = "success";

        else if (item.risk_level === "Medium")
            badge = "warning";

        else if (item.risk_level === "High")
            badge = "danger";

        const decision =
            decisions.find(
                d => d.id === item.decision_id
            );

        tbody.innerHTML += `

        <tr>

            <td>${item.id}</td>

            <td>${decision ? decision.title : "-"}</td>

            <td>${item.alternative_name}</td>

            <td>

                <span class="badge bg-${badge}">

                    ${item.risk_level}

                </span>

            </td>

            <td>${item.estimated_cost || "-"}</td>

            <td>${item.score}</td>

            <td>

                <button
                    class="btn btn-sm btn-warning"
                    onclick="editAlternative(${item.id})">

                    Edit

                </button>

                <button
                    class="btn btn-sm btn-danger"
                    onclick="deleteAlternative(${item.id})">

                    Delete

                </button>

            </td>

        </tr>

        `;

    });

}