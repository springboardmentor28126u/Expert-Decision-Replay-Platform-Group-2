"""Test the decide endpoint to reproduce the 'Failed to update request' error."""
import time
import requests
import json

BASE = "http://localhost:8000/api/v1"
CID = "2379598a-f4a7-4e6e-9137-a01c4eafe8a8"

def login(email, password, ctx="admin"):
    time.sleep(2)
    r = requests.post(f"{BASE}/auth/login",
                      data={"username": email, "password": password, "login_context": ctx})
    print(f"  Login {email}: {r.status_code}")
    if r.status_code != 200:
        print(f"    Response: {r.text[:200]}")
        return None
    return r.json()["access_token"]

def hdrs(token):
    return {"Authorization": f"Bearer {token}", "X-Company-ID": CID}

# Login as Admin
print("=== Login ===")
admin_tok = login("admin@edrp.com", "Admin@123", "admin")
emp_tok = login("alice@demo.com", "Demo@123", "employee")

if not admin_tok or not emp_tok:
    print("Login failed, aborting")
    exit(1)

# Get admin's groups
print("\n=== Get admin groups ===")
r = requests.get(f"{BASE}/admin/groups", headers=hdrs(admin_tok))
print(f"  Status: {r.status_code}")
groups = r.json()
print(f"  Groups: {json.dumps(groups, indent=2)[:500]}")

if not groups:
    print("No groups found, aborting")
    exit(1)

group_id = groups[0]["id"]
print(f"  Using group: {group_id} ({groups[0]['name']})")

# Have alice join the group
print("\n=== Alice join request ===")
r = requests.post(f"{BASE}/groups/{group_id}/join-request", headers=hdrs(emp_tok), json={"message": "test"})
print(f"  Status: {r.status_code}")
print(f"  Response: {r.text[:300]}")

# Get the pending request ID
print("\n=== Get pending requests ===")
r = requests.get(f"{BASE}/group-requests?status=pending", headers=hdrs(admin_tok))
print(f"  Status: {r.status_code}")
pending = r.json()
print(f"  Pending: {json.dumps(pending, indent=2)[:500]}")

if not pending:
    print("No pending requests, aborting")
    exit(1)

request_id = pending[0]["id"]
print(f"  Using request: {request_id}")

# Now try to accept the request
print("\n=== Accept request ===")
r = requests.post(f"{BASE}/group-requests/{request_id}/decide", 
                   headers=hdrs(admin_tok), 
                   json={"decision": "accept"})
print(f"  Status: {r.status_code}")
print(f"  Response body: {r.text[:500]}")
