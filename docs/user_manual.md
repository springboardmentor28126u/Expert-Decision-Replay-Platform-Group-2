# User Manual & Operations Guide

This manual details how to perform role-based operations on the **Expert Decision Replay Platform**.

---

## 🔑 1. User Registration & Roles

The system uses role-based access control (RBAC). Upon loading [http://localhost:5001/register](http://localhost:5001/register), enter your name, email, password, select your organizational team, and assign your role:

*   **Employee**: Focuses on capturing new decisions, listing alternatives, updating details, and participating in discussion threads.
*   **Reviewer**: Acts as the compliance auditor. Approves or rejects decisions assigned to them in stages.
*   **Manager**: Monitors team decisions, assigns reviewers to drafts created by their members, and views team analytics.
*   **Administrator**: Manages global teams, registered user lists, and monitors security/operations audit logs.

---

## 📝 2. Documenting a Decision (Employee Workflow)

### Step 1: Create a Draft
1. Click the **"Create New Decision"** button on the dashboard.
2. Select a seeded category (e.g. *Technology, Finance, HR*).
3. Enter a descriptive **Title**, define the **Problem Statement**, and describe the **Evaluation Criteria** used to judge choices.

### Step 2: Add Alternative Options
1. Under "Alternatives Comparison", click **"Add Alternative Option"** to dynamically add options.
2. Fill in the alternative **Title**, **Pros & Cons**, estimated **Cost Estimate ($)**, **Feasibility analysis**, and **Risk assessment**.
3. Select which alternative is currently **Chosen**.
4. Click **"Save Decision Draft"**.

---

## 🤝 3. Approvals Workflow (Reviewer Assignment)

Decisions start in the **Draft** state.
1. To advance a decision to review, the Creator (or their Manager/Admin) must go to the **Approvals** tab on the decision page.
2. Select an available reviewer from the dropdown list, assign a review **Stage** (e.g., Stage 1, Stage 2), and click **"Assign Reviewer"**.
3. The decision status advances to **Under Review**.

---

## 🗳️ 4. Actioning a Review (Reviewer Workflow)

When you are assigned as a reviewer, the decision appears in your **Reviewer Dashboard** under "Pending Reviews".
1. Click **"Review"** to launch the verdict dialog box.
2. Select your verdict: **Approve** or **Reject**.
3. Input your remarks and comments, then click **"Submit Review"**.
    *   If **approved** at the final stage: Status advances to **Approved**.
    *   If **rejected**: Status updates to **Rejected**.
    *   The creator receives an immediate system notification with the comments.

---

## 💬 5. Discussion Threads & Document Uploads

On the Decision details page, click:
*   **Discussions Tab**: Submit threaded remarks. Check "Official Meeting Notes" or "Decision Rationale" to format important entries distinctly.
*   **Documents Tab**: Upload supporting reports, cost sheets, or architectural diagrams (up to 10MB). Click **"Download"** to fetch files locally.

---

## 📊 6. Dashboards, Audit Logs, & Reports Export

*   **Global Export**: Click **"Export PDF"** on any decision details page to download the dynamic corporate dossier. Click **"Export Logs"** on dashboards to extract Excel files.
*   **Compliance Audit**: Administrators can view real-time system logs under **Admin Dashboard -> Security & Operations Audit Logs** to verify login times, reviewer modifications, and download timestamps.
