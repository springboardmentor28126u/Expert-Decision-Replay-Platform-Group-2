# REST API Documentation

The **Expert Decision Replay Platform** exposes a comprehensive FastAPI REST API. The complete schema specification can be explored interactively via Swagger UI at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## 🔐 1. Authentication Module

### Register User
*   **Endpoint**: `POST /auth/register`
*   **Request Body**:
    ```json
    {
      "email": "user@company.com",
      "password": "securepassword",
      "full_name": "John Doe",
      "role": "employee",
      "team_id": null
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "id": "e583b6be-4f6e-4c91-a3a9-063603ecd2cf",
      "email": "user@company.com",
      "full_name": "John Doe",
      "role": "employee",
      "team_id": null,
      "is_active": true,
      "created_at": "2026-07-19T00:00:00"
    }
    ```

### User Login
*   **Endpoint**: `POST /auth/login`
*   **Request Body**:
    ```json
    {
      "email": "user@company.com",
      "password": "securepassword"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "access_token": "eyJhbGciOi...",
      "token_type": "bearer"
    }
    ```

---

## 📁 2. User & Team Management

### Get Current User Profile
*   **Endpoint**: `GET /users/me`
*   **Headers**: `Authorization: Bearer <token>`
*   **Response (200 OK)**: User profile details with nested team information.

### Create Team (Admin Only)
*   **Endpoint**: `POST /users/teams`
*   **Headers**: `Authorization: Bearer <admin-token>`
*   **Request Body**:
    ```json
    {
      "name": "Design Board",
      "description": "System design reviews"
    }
    ```

---

## 📝 3. Decision Repository

### Create Decision Draft
*   **Endpoint**: `POST /decisions`
*   **Headers**: `Authorization: Bearer <token>`
*   **Request Body**:
    ```json
    {
      "title": "Migrate to Tailwind CSS",
      "problem_statement": "Reducing css bundle file weights.",
      "evaluation_criteria": "Build performance, bundle sizing.",
      "category_id": 1,
      "alternatives": [
        {
          "title": "Option A: Tailwind",
          "description": "Utility CSS utility framework",
          "pros": "Highly optimized styles compilation",
          "cons": "Learning curve, class bloat",
          "cost_estimate": 0.0,
          "feasibility_analysis": "High feasibility",
          "risk_assessment": "Low risk",
          "is_chosen": true
        }
      ]
    }
    ```

### Update Decision details
*   **Endpoint**: `PUT /decisions/{decision_id}`
*   **Headers**: `Authorization: Bearer <token>`
*   **Description**: Updates details and automatically archives the previous version inside `DecisionVersion` history.

---

## 🤝 4. Workflow, Notifications, & Audit Logs

### Assign Reviewer
*   **Endpoint**: `POST /decisions/{decision_id}/reviewer`
*   **Headers**: `Authorization: Bearer <creator-token>`
*   **Request Body**:
    ```json
    {
      "reviewer_id": "reviewer-uuid",
      "stage": 1
    }
    ```

### Action Approval Verdict
*   **Endpoint**: `PUT /decisions/approvals/{approval_id}`
*   **Headers**: `Authorization: Bearer <reviewer-token>`
*   **Request Body**:
    ```json
    {
      "status": "approved",
      "comments": "Approved. Design conforms to standard guidelines."
    }
    ```

### Fetch Audit Logs (Admin Only)
*   **Endpoint**: `GET /decisions/audit-logs`
*   **Headers**: `Authorization: Bearer <admin-token>`
*   **Response**: Compliance audit log history array.
