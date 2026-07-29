"""End-to-end permission matrix test for Group CRUD + Join Request flow."""
import json
import time
import uuid
import requests

BASE = "http://localhost:8000/api/v1"
CID = "2379598a-f4a7-4e6e-9137-a01c4eafe8a8"
UNIQUE = uuid.uuid4().hex[:8]

def login(email, password, ctx="admin"):
    time.sleep(2)
    r = requests.post(f"{BASE}/auth/login",
                      data={"username": email, "password": password, "login_context": ctx})
    if r.status_code != 200:
        print(f"  LOGIN FAILED for {email}: {r.status_code} {r.text}")
        return None
    return r.json()["access_token"]

def hdrs(token):
    return {"Authorization": f"Bearer {token}", "X-Company-ID": CID}

def req(method, url, tok, body=None):
    h = hdrs(tok)
    try:
        if method == "GET":
            r = requests.get(url, headers=h, timeout=5)
        else:
            r = requests.post(url, headers=h, json=body, timeout=5)
        return r.status_code, r.text
    except Exception as e:
        return "ERR", str(e)[:80]

passed = 0
failed = 0

def check(label, code, expected, body=""):
    global passed, failed
    status = "PASS" if code == expected else "FAIL"
    detail = body[:100] if body else ""
    print(f"  {status}: {label} => {code} (expect {expected}) {detail}")
    if code == expected:
        passed += 1
    else:
        failed += 1

print("=== LOGGING IN ===")
admin_tok = login("admin@edrp.com", "Admin@123", "admin")
mgr_tok   = login("dave@demo.com",  "Demo@123", "employee")
emp_tok   = login("alice@demo.com", "Demo@123", "employee")
rev_tok   = login("bob@demo.com",   "Demo@123", "employee")

for name, tok in [("Admin", admin_tok), ("Manager", mgr_tok), ("Employee", emp_tok), ("Reviewer", rev_tok)]:
    if tok:
        me = requests.get(f"{BASE}/auth/me", headers=hdrs(tok)).json()
        print(f"  {name}: {me['email']} (user_role={me['role']})")
    else:
        print(f"  {name}: LOGIN FAILED")

if not all([admin_tok, mgr_tok, emp_tok, rev_tok]):
    print("Aborting - logins failed")
    exit(1)

print("\n=== 1. Admin CRUD ===")
c, b = req("GET", f"{BASE}/admin/groups", admin_tok)
check("Admin list groups", c, 200, b)
c, b = req("POST", f"{BASE}/admin/groups", admin_tok, {"name": f"Admin G {UNIQUE}", "description": "e2e"})
check("Admin create group", c, 201, b)
c, b = req("GET", f"{BASE}/group-requests", admin_tok)
check("Admin list requests", c, 200, b)
c, b = req("GET", f"{BASE}/group-requests/pending-count", admin_tok)
check("Admin pending count", c, 200, b)

print("\n=== 2. Manager CRUD ===")
c, b = req("GET", f"{BASE}/admin/groups", mgr_tok)
check("Manager list groups", c, 200, b)
c, b = req("POST", f"{BASE}/admin/groups", mgr_tok, {"name": f"Mgr G {UNIQUE}", "description": "e2e"})
check("Manager create group", c, 201, b)
c, b = req("GET", f"{BASE}/group-requests", mgr_tok)
check("Manager list requests", c, 200, b)
c, b = req("GET", f"{BASE}/group-requests/pending-count", mgr_tok)
check("Manager pending count", c, 200, b)

print("\n=== 3. Admin/Manager CANNOT browse or join (403) ===")
c, _ = req("GET", f"{BASE}/groups?company_id={CID}", admin_tok)
check("Admin browse groups (403)", c, 403)
c, _ = req("GET", f"{BASE}/groups?company_id={CID}", mgr_tok)
check("Manager browse groups (403)", c, 403)

admin_groups = json.loads(req("GET", f"{BASE}/admin/groups", admin_tok)[1])
gid = admin_groups[0]["id"]
c, _ = req("POST", f"{BASE}/groups/{gid}/join-request", admin_tok, {})
check("Admin join request (403)", c, 403)
c, _ = req("POST", f"{BASE}/groups/{gid}/join-request", mgr_tok, {})
check("Manager join request (403)", c, 403)

print("\n=== 4. Employee/Reviewer CAN browse, CANNOT create/admin ===")
c, b = req("GET", f"{BASE}/groups?company_id={CID}", emp_tok)
check("Employee browse groups", c, 200, b)
c, b = req("GET", f"{BASE}/groups?company_id={CID}", rev_tok)
check("Reviewer browse groups", c, 200, b)
c, _ = req("POST", f"{BASE}/admin/groups", emp_tok, {"name": "Nope"})
check("Employee create group (403)", c, 403)
c, _ = req("POST", f"{BASE}/admin/groups", rev_tok, {"name": "Nope"})
check("Reviewer create group (403)", c, 403)
c, _ = req("GET", f"{BASE}/group-requests", emp_tok)
check("Employee list requests (403)", c, 403)
c, _ = req("GET", f"{BASE}/group-requests", rev_tok)
check("Reviewer list requests (403)", c, 403)

print("\n=== 5. Join-request + Decide flow ===")
c, b = req("POST", f"{BASE}/groups/{gid}/join-request", emp_tok, {})
check("Employee join request", c, 201, b)
req_id = json.loads(b)["id"] if c == 201 else None

c, b = req("GET", f"{BASE}/group-requests", admin_tok)
has_req = req_id in b if req_id else False
check("Admin sees pending request", c, 200, "found" if has_req else "NOT FOUND")

c, b = req("GET", f"{BASE}/my-requests", emp_tok)
check("Employee sees own requests", c, 200, b)

c, b = req("POST", f"{BASE}/group-requests/{req_id}/decide", admin_tok, {"decision": "accept"})
check("Admin accept request", c, 200, b[:100])

c, b = req("POST", f"{BASE}/groups/{gid}/join-request", rev_tok, {})
check("Reviewer join request", c, 201, b)
rev_req_id = json.loads(b)["id"] if c == 201 else None

c, b = req("POST", f"{BASE}/group-requests/{rev_req_id}/decide", admin_tok, {"decision": "reject"})
check("Admin reject request", c, 200, b[:100])

print("\n=== 6. Duplicate name -> 409 ===")
c, b = req("POST", f"{BASE}/admin/groups", admin_tok, {"name": f"Admin G {UNIQUE}", "description": "dup"})
check("Duplicate group name", c, 409, b)

print(f"\n{'='*50}")
print(f"RESULTS: {passed} passed, {failed} failed out of {passed+failed}")
if failed > 0:
    exit(1)
