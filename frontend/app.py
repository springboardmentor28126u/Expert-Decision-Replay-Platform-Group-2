import os
from flask import Flask, render_template, request, redirect, url_for, flash, make_response
import httpx
from dotenv import load_dotenv

# Load env variables from root .env if present
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
else:
    load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "frontend_flask_secret_key_12345")

BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:8000")

def get_backend_headers():
    token = request.cookies.get("access_token")
    if token:
        return {"Authorization": f"Bearer {token}"}
    return {}

def get_current_user():
    headers = get_backend_headers()
    if not headers:
        return None
    try:
        with httpx.Client() as client:
            response = client.get(f"{BACKEND_API_URL}/users/me", headers=headers, timeout=5.0)
            if response.status_code == 200:
                return response.json()
    except Exception as e:
        app.logger.error(f"Error fetching current user from backend: {e}")
    return None

@app.route("/")
def index():
    user = get_current_user()
    if user:
        return redirect(url_for("dashboard"))
    return redirect(url_for("login"))

@app.route("/login", methods=["GET", "POST"])
def login():
    if get_current_user():
        return redirect(url_for("dashboard"))
        
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        
        try:
            with httpx.Client() as client:
                response = client.post(
                    f"{BACKEND_API_URL}/auth/login",
                    json={"email": email, "password": password},
                    timeout=5.0
                )
                
            if response.status_code == 200:
                token_data = response.json()
                access_token = token_data.get("access_token")
                
                # Fetch details to flash user welcome message
                headers = {"Authorization": f"Bearer {access_token}"}
                with httpx.Client() as client:
                    user_resp = client.get(f"{BACKEND_API_URL}/users/me", headers=headers)
                
                flash_msg = "Logged in successfully!"
                if user_resp.status_code == 200:
                    flash_msg = f"Welcome back, {user_resp.json().get('full_name')}!"
                
                resp = make_response(redirect(url_for("dashboard")))
                # Set HTTP-only cookie for access token
                resp.set_cookie("access_token", access_token, httponly=True, max_age=7200) # 2 hours
                flash(flash_msg, "success")
                return resp
            else:
                detail = response.json().get("detail", "Invalid email or password.")
                flash(detail, "danger")
        except Exception as e:
            flash(f"Connection to authentication service failed: {e}", "danger")
            
    return render_template("auth/login.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if get_current_user():
        return redirect(url_for("dashboard"))
        
    # We will fetch available teams from the backend to display on registration form
    teams = []
    try:
        # Retrieve teams listing anonymously or temporarily bypass
        # For simplicity, we can fetch all teams from backend
        with httpx.Client() as client:
            response = client.get(f"{BACKEND_API_URL}/users/teams")
            if response.status_code == 200:
                teams = response.json()
    except Exception:
        pass
        
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        full_name = request.form.get("full_name")
        role = request.form.get("role")
        team_id = request.form.get("team_id")
        
        payload = {
            "email": email,
            "password": password,
            "full_name": full_name,
            "role": role,
        }
        if team_id:
            payload["team_id"] = team_id
            
        try:
            with httpx.Client() as client:
                response = client.post(
                    f"{BACKEND_API_URL}/auth/register",
                    json=payload,
                    timeout=5.0
                )
            if response.status_code == 201:
                flash("Registration successful! Please login.", "success")
                return redirect(url_for("login"))
            else:
                detail = response.json().get("detail", "Registration failed.")
                if isinstance(detail, list):
                    # Handle Pydantic validation list errors
                    detail = ", ".join([f"{err.get('loc')[-1]}: {err.get('msg')}" for err in detail])
                flash(detail, "danger")
        except Exception as e:
            flash(f"Connection to authentication service failed: {e}", "danger")
            
    return render_template("auth/register.html", teams=teams)

@app.route("/logout")
def logout():
    resp = make_response(redirect(url_for("login")))
    resp.delete_cookie("access_token")
    flash("You have been logged out.", "info")
    return resp

@app.route("/dashboard")
def dashboard():
    user = get_current_user()
    if not user:
        flash("Please log in to access the dashboard.", "warning")
        return redirect(url_for("login"))
        
    role = user.get("role")
    headers = get_backend_headers()
    
    # 1. Fetch unread notifications for sidebar
    notifications = []
    try:
        with httpx.Client() as client:
            notif_resp = client.get(f"{BACKEND_API_URL}/decisions/notifications", headers=headers)
            if notif_resp.status_code == 200:
                notifications = [n for n in notif_resp.json() if not n.get("is_read")][:5]
    except Exception:
        pass

    # 2. Fetch decisions list to compute statistics
    decisions = []
    try:
        with httpx.Client() as client:
            dec_resp = client.get(f"{BACKEND_API_URL}/decisions", headers=headers)
            if dec_resp.status_code == 200:
                decisions = dec_resp.json()
    except Exception:
        pass

    # Calculate general statistics
    my_decisions = [d for d in decisions if d.get("creator_id") == user.get("id")]
    draft_count = len([d for d in my_decisions if d.get("status") == "draft"])
    under_review_count = len([d for d in my_decisions if d.get("status") == "under_review"])
    approved_count = len([d for d in my_decisions if d.get("status") == "approved"])
    
    stats = {
        "total": len(my_decisions),
        "draft": draft_count,
        "under_review": under_review_count,
        "approved": approved_count
    }

    if role == "administrator":
        users_list = []
        logs_list = []
        try:
            with httpx.Client() as client:
                resp = client.get(f"{BACKEND_API_URL}/users/all", headers=headers)
                if resp.status_code == 200:
                    users_list = resp.json()
                    
                log_resp = client.get(f"{BACKEND_API_URL}/decisions/audit-logs", headers=headers)
                if log_resp.status_code == 200:
                    logs_list = log_resp.json()[:10]  # Limit to 10 logs
        except Exception:
            pass
        return render_template(
            "dashboard/admin.html",
            user=user,
            users_list=users_list,
            logs_list=logs_list,
            notifications=notifications
        )
        
    elif role == "manager":
        # Fetch team members (users whose team_id equals user's team_id)
        team_members = []
        try:
            with httpx.Client() as client:
                users_resp = client.get(f"{BACKEND_API_URL}/users/all", headers=headers)
                if users_resp.status_code == 200:
                    team_members = [u for u in users_resp.json() if u.get("team_id") == user.get("team_id")]
        except Exception:
            pass
            
        # Manager stats track all team decisions
        team_decisions = [d for d in decisions if d.get("team_id") == user.get("team_id")]
        team_stats = {
            "total": len(team_decisions),
            "pending": len([d for d in team_decisions if d.get("status") == "under_review"]),
            "approved": len([d for d in team_decisions if d.get("status") == "approved"])
        }
        
        return render_template(
            "dashboard/manager.html",
            user=user,
            team_members=team_members,
            team_stats=team_stats,
            team_decisions=team_decisions,
            notifications=notifications
        )
        
    elif role == "reviewer":
        # Fetch pending reviews assigned
        pending_reviews = []
        try:
            with httpx.Client() as client:
                rev_resp = client.get(f"{BACKEND_API_URL}/decisions/approvals/pending", headers=headers)
                if rev_resp.status_code == 200:
                    pending_reviews = rev_resp.json()
        except Exception:
            pass
            
        return render_template(
            "dashboard/reviewer.html",
            user=user,
            pending_reviews=pending_reviews,
            notifications=notifications
        )
        
    else:  # employee
        return render_template(
            "dashboard/employee.html",
            user=user,
            stats=stats,
            my_decisions=my_decisions,
            notifications=notifications
        )


@app.route("/profile", methods=["GET", "POST"])
def profile():
    user = get_current_user()
    if not user:
        return redirect(url_for("login"))
        
    teams = []
    try:
        with httpx.Client() as client:
            resp = client.get(f"{BACKEND_API_URL}/users/teams", headers=get_backend_headers())
            if resp.status_code == 200:
                teams = resp.json()
    except Exception:
        pass
        
    if request.method == "POST":
        full_name = request.form.get("full_name")
        email = request.form.get("email")
        team_id = request.form.get("team_id")
        password = request.form.get("password")
        
        payload = {}
        if full_name: payload["full_name"] = full_name
        if email: payload["email"] = email
        if team_id: payload["team_id"] = team_id
        if password: payload["password"] = password
        
        try:
            headers = get_backend_headers()
            with httpx.Client() as client:
                response = client.put(
                    f"{BACKEND_API_URL}/users/me",
                    json=payload,
                    headers=headers,
                    timeout=5.0
                )
            if response.status_code == 200:
                flash("Profile updated successfully!", "success")
                return redirect(url_for("profile"))
            else:
                detail = response.json().get("detail", "Failed to update profile.")
                flash(detail, "danger")
        except Exception as e:
            flash(f"Connection to user service failed: {e}", "danger")
            
    return render_template("auth/profile.html", user=user, teams=teams)

@app.route("/teams/create", methods=["POST"])
def create_team_route():
    user = get_current_user()
    if not user or user.get("role") != "administrator":
        return {"detail": "Forbidden. Admin only."}, 403
        
    data = request.get_json()
    name = data.get("name")
    description = data.get("description")
    
    headers = get_backend_headers()
    try:
        with httpx.Client() as client:
            response = client.post(
                f"{BACKEND_API_URL}/users/teams",
                json={"name": name, "description": description},
                headers=headers,
                timeout=5.0
            )
        if response.status_code in [200, 201]:
            return response.json(), response.status_code
        else:
            return response.json(), response.status_code
    except Exception as e:
        return {"detail": f"Failed to connect to backend: {e}"}, 500

@app.route("/decisions")
def list_decisions_route():
    user = get_current_user()
    if not user:
        flash("Please log in to view decisions.", "warning")
        return redirect(url_for("login"))
    headers = get_backend_headers()
    decisions = []
    categories = []
    try:
        with httpx.Client() as client:
            cat_resp = client.get(f"{BACKEND_API_URL}/decisions/categories", headers=headers)
            if cat_resp.status_code == 200:
                categories = cat_resp.json()
                
            params = {}
            cat_id = request.args.get("category_id")
            status_filter = request.args.get("status")
            if cat_id: params["category_id"] = int(cat_id)
            if status_filter: params["status"] = status_filter
            
            resp = client.get(f"{BACKEND_API_URL}/decisions", headers=headers, params=params)
            if resp.status_code == 200:
                decisions = resp.json()
    except Exception as e:
        flash(f"Could not load decisions from backend: {e}", "danger")
        
    return render_template("decisions/list.html", user=user, decisions=decisions, categories=categories)

@app.route("/decisions/create", methods=["GET", "POST"])
def create_decision_route():
    user = get_current_user()
    if not user:
        return redirect(url_for("login"))
        
    headers = get_backend_headers()
    categories = []
    try:
        with httpx.Client() as client:
            resp = client.get(f"{BACKEND_API_URL}/decisions/categories", headers=headers)
            if resp.status_code == 200:
                categories = resp.json()
    except Exception as e:
        flash(f"Could not load categories: {e}", "danger")
        
    if request.method == "POST":
        title = request.form.get("title")
        problem_statement = request.form.get("problem_statement")
        evaluation_criteria = request.form.get("evaluation_criteria")
        category_id = request.form.get("category_id")
        
        alternatives = []
        i = 0
        while True:
            alt_title = request.form.get(f"alt_title_{i}")
            if not alt_title:
                break
            cost_val = request.form.get(f"alt_cost_{i}", "0")
            try:
                cost_estimate = float(cost_val) if cost_val else 0.0
            except ValueError:
                cost_estimate = 0.0
            
            alternatives.append({
                "title": alt_title,
                "description": request.form.get(f"alt_desc_{i}", ""),
                "pros": request.form.get(f"alt_pros_{i}", ""),
                "cons": request.form.get(f"alt_cons_{i}", ""),
                "cost_estimate": cost_estimate,
                "feasibility_analysis": request.form.get(f"alt_feasibility_{i}", ""),
                "risk_assessment": request.form.get(f"alt_risk_{i}", ""),
                "is_chosen": request.form.get(f"alt_chosen_{i}") == "true"
            })
            i += 1

        payload = {
            "title": title,
            "problem_statement": problem_statement,
            "evaluation_criteria": evaluation_criteria,
            "category_id": int(category_id) if category_id else 0,
            "alternatives": alternatives
        }
        
        try:
            with httpx.Client() as client:
                resp = client.post(f"{BACKEND_API_URL}/decisions", json=payload, headers=headers)
            if resp.status_code == 201:
                flash("Decision created successfully as draft!", "success")
                return redirect(url_for("list_decisions_route"))
            else:
                detail = resp.json().get("detail", "Failed to create decision.")
                flash(f"Error: {detail}", "danger")
        except Exception as e:
            flash(f"Connection failed: {e}", "danger")
            
    return render_template("decisions/create.html", user=user, categories=categories)

@app.route("/decisions/<uuid:decision_id>")
def view_decision_route(decision_id):
    user = get_current_user()
    if not user:
        return redirect(url_for("login"))
        
    headers = get_backend_headers()
    decision = None
    try:
        with httpx.Client() as client:
            resp = client.get(f"{BACKEND_API_URL}/decisions/{decision_id}", headers=headers)
            if resp.status_code == 200:
                decision = resp.json()
            else:
                flash("Decision not found.", "warning")
                return redirect(url_for("list_decisions_route"))
    except Exception as e:
        flash(f"Connection error: {e}", "danger")
        return redirect(url_for("list_decisions_route"))
        
    reviewers = []
    try:
        with httpx.Client() as client:
            rev_resp = client.get(f"{BACKEND_API_URL}/users/reviewers/list", headers=headers)
            if rev_resp.status_code == 200:
                reviewers = rev_resp.json()
    except Exception:
        pass
        
    return render_template("decisions/detail.html", user=user, decision=decision, reviewers=reviewers)


@app.route("/decisions/<uuid:decision_id>/edit", methods=["GET", "POST"])
def edit_decision_route(decision_id):
    user = get_current_user()
    if not user:
        return redirect(url_for("login"))
        
    headers = get_backend_headers()
    decision = None
    categories = []
    try:
        with httpx.Client() as client:
            resp = client.get(f"{BACKEND_API_URL}/decisions/{decision_id}", headers=headers)
            if resp.status_code == 200:
                decision = resp.json()
            else:
                flash("Decision not found.", "warning")
                return redirect(url_for("list_decisions_route"))
                
            cat_resp = client.get(f"{BACKEND_API_URL}/decisions/categories", headers=headers)
            if cat_resp.status_code == 200:
                categories = cat_resp.json()
    except Exception as e:
        flash(f"Connection error: {e}", "danger")
        return redirect(url_for("list_decisions_route"))
        
    if request.method == "POST":
        title = request.form.get("title")
        problem_statement = request.form.get("problem_statement")
        evaluation_criteria = request.form.get("evaluation_criteria")
        category_id = request.form.get("category_id")
        status_val = request.form.get("status")
        
        payload = {
            "title": title,
            "problem_statement": problem_statement,
            "evaluation_criteria": evaluation_criteria,
            "category_id": int(category_id) if category_id else None,
            "status": status_val
        }
        
        try:
            with httpx.Client() as client:
                resp = client.put(f"{BACKEND_API_URL}/decisions/{decision_id}", json=payload, headers=headers)
            if resp.status_code == 200:
                flash("Decision updated successfully! Version history updated.", "success")
                return redirect(url_for("view_decision_route", decision_id=decision_id))
            else:
                detail = resp.json().get("detail", "Failed to update decision.")
                flash(f"Error: {detail}", "danger")
        except Exception as e:
            flash(f"Connection failed: {e}", "danger")
            
    return render_template("decisions/edit.html", user=user, decision=decision, categories=categories)

@app.route("/decisions/<uuid:decision_id>/comment", methods=["POST"])
def add_comment_route(decision_id):
    user = get_current_user()
    if not user:
        return redirect(url_for("login"))
        
    content = request.form.get("content")
    meeting_notes = request.form.get("meeting_notes")
    decision_rationale = request.form.get("decision_rationale")
    parent_id = request.form.get("parent_id")
    
    payload = {
        "content": content,
        "meeting_notes": meeting_notes if meeting_notes else None,
        "decision_rationale": decision_rationale if decision_rationale else None
    }
    if parent_id:
        payload["parent_id"] = parent_id
        
    headers = get_backend_headers()
    try:
        with httpx.Client() as client:
            resp = client.post(f"{BACKEND_API_URL}/decisions/{decision_id}/comments", json=payload, headers=headers)
        if resp.status_code == 201:
            flash("Comment posted successfully!", "success")
        else:
            detail = resp.json().get("detail", "Failed to post comment.")
            flash(f"Error: {detail}", "danger")
    except Exception as e:
        flash(f"Connection failed: {e}", "danger")
        
    return redirect(url_for("view_decision_route", decision_id=decision_id))

@app.route("/decisions/<uuid:decision_id>/upload", methods=["POST"])
def upload_attachment_route(decision_id):
    user = get_current_user()
    if not user:
        return redirect(url_for("login"))
        
    file = request.files.get("file")
    if not file or file.filename == "":
        flash("No file selected.", "warning")
        return redirect(url_for("view_decision_route", decision_id=decision_id))
        
    headers = get_backend_headers()
    files = {"file": (file.filename, file.stream, file.mimetype)}
    
    try:
        with httpx.Client() as client:
            resp = client.post(
                f"{BACKEND_API_URL}/decisions/{decision_id}/upload",
                files=files,
                headers=headers,
                timeout=15.0
            )
        if resp.status_code == 201:
            flash("Document uploaded successfully!", "success")
        else:
            detail = resp.json().get("detail", "Upload failed.")
            flash(f"Error: {detail}", "danger")
    except Exception as e:
        flash(f"Connection failed: {e}", "danger")
        
    return redirect(url_for("view_decision_route", decision_id=decision_id))

@app.route("/decisions/attachments/<uuid:attachment_id>")
def download_attachment_route(attachment_id):
    user = get_current_user()
    if not user:
        return redirect(url_for("login"))
        
    headers = get_backend_headers()
    try:
        with httpx.Client() as client:
            response = client.get(
                f"{BACKEND_API_URL}/decisions/attachments/{attachment_id}/download",
                headers=headers
            )
        if response.status_code == 200:
            flask_response = make_response(response.content)
            flask_response.headers["Content-Disposition"] = response.headers.get("Content-Disposition", f"attachment; filename={attachment_id}")
            flask_response.headers["Content-Type"] = response.headers.get("Content-Type", "application/octet-stream")
            return flask_response
        else:
            flash("Could not download file.", "danger")
            return redirect(url_for("list_decisions_route"))
    except Exception as e:
        flash(f"Error: {e}", "danger")
        return redirect(url_for("list_decisions_route"))

@app.route("/decisions/<uuid:decision_id>/reviewer", methods=["POST"])
def assign_reviewer_route(decision_id):
    user = get_current_user()
    if not user:
        return redirect(url_for("login"))
        
    reviewer_id = request.form.get("reviewer_id")
    stage = request.form.get("stage", "1")
    
    payload = {
        "reviewer_id": reviewer_id,
        "stage": int(stage) if stage else 1
    }
    
    headers = get_backend_headers()
    try:
        with httpx.Client() as client:
            resp = client.post(f"{BACKEND_API_URL}/decisions/{decision_id}/reviewer", json=payload, headers=headers)
        if resp.status_code == 201:
            flash("Reviewer assigned successfully. Decision is now Under Review!", "success")
        else:
            detail = resp.json().get("detail", "Failed to assign reviewer.")
            flash(f"Error: {detail}", "danger")
    except Exception as e:
        flash(f"Connection failed: {e}", "danger")
        
    return redirect(url_for("view_decision_route", decision_id=decision_id))

@app.route("/approvals/<uuid:approval_id>", methods=["POST"])
def action_approval_route(approval_id):
    user = get_current_user()
    if not user:
        return redirect(url_for("login"))
        
    status_val = request.form.get("status")
    comments = request.form.get("comments")
    decision_id = request.form.get("decision_id")
    
    payload = {
        "status": status_val,
        "comments": comments
    }
    
    headers = get_backend_headers()
    try:
        with httpx.Client() as client:
            resp = client.put(f"{BACKEND_API_URL}/decisions/approvals/{approval_id}", json=payload, headers=headers)
        if resp.status_code == 200:
            flash(f"Decision review submitted as: {status_val.upper()}", "success")
        else:
            detail = resp.json().get("detail", "Failed to submit review.")
            flash(f"Error: {detail}", "danger")
    except Exception as e:
        flash(f"Connection failed: {e}", "danger")
        
    if decision_id:
        return redirect(url_for("view_decision_route", decision_id=decision_id))
    return redirect(url_for("dashboard"))

@app.route("/notifications")
def list_notifications_route():
    user = get_current_user()
    if not user:
        return redirect(url_for("login"))
        
    headers = get_backend_headers()
    notifications = []
    try:
        with httpx.Client() as client:
            resp = client.get(f"{BACKEND_API_URL}/decisions/notifications", headers=headers)
            if resp.status_code == 200:
                notifications = resp.json()
    except Exception as e:
        flash(f"Connection error: {e}", "danger")
        
    return render_template("auth/notifications.html", user=user, notifications=notifications)

@app.route("/notifications/<uuid:notif_id>/read", methods=["POST"])
def mark_notification_read_route(notif_id):
    user = get_current_user()
    if not user:
        return redirect(url_for("login"))
        
    headers = get_backend_headers()
    try:
        with httpx.Client() as client:
            resp = client.put(f"{BACKEND_API_URL}/decisions/notifications/{notif_id}/read", headers=headers)
        if resp.status_code == 200:
            return {"status": "ok"}, 200
        else:
            return {"detail": "Failed"}, 400
    except Exception:
        return {"detail": "Error"}, 500

@app.route("/decisions/<uuid:decision_id>/export/pdf")
def export_pdf_route(decision_id):
    user = get_current_user()
    if not user:
        return redirect(url_for("login"))
        
    headers = get_backend_headers()
    try:
        with httpx.Client() as client:
            response = client.get(f"{BACKEND_API_URL}/decisions/{decision_id}/export/pdf", headers=headers)
        if response.status_code == 200:
            flask_response = make_response(response.content)
            flask_response.headers["Content-Disposition"] = f"attachment; filename=decision_report_{decision_id[:8]}.pdf"
            flask_response.headers["Content-Type"] = "application/pdf"
            return flask_response
        else:
            flash("Failed to generate PDF report.", "danger")
            return redirect(url_for("view_decision_route", decision_id=decision_id))
    except Exception as e:
        flash(f"Connection error: {e}", "danger")
        return redirect(url_for("view_decision_route", decision_id=decision_id))

@app.route("/decisions/export/excel")
def export_excel_route():
    user = get_current_user()
    if not user:
        return redirect(url_for("login"))
        
    headers = get_backend_headers()
    try:
        params = {}
        cat_id = request.args.get("category_id")
        status_filter = request.args.get("status")
        if cat_id: params["category_id"] = int(cat_id)
        if status_filter: params["status"] = status_filter
        
        with httpx.Client() as client:
            response = client.get(f"{BACKEND_API_URL}/decisions/export/excel", headers=headers, params=params)
        if response.status_code == 200:
            flask_response = make_response(response.content)
            flask_response.headers["Content-Disposition"] = "attachment; filename=decision_logs_export.xlsx"
            flask_response.headers["Content-Type"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            return flask_response
        else:
            flash("Failed to generate Excel report.", "danger")
            return redirect(url_for("list_decisions_route"))
    except Exception as e:
        flash(f"Connection error: {e}", "danger")
        return redirect(url_for("list_decisions_route"))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


