import requests

BASE_URL = "http://127.0.0.1:8000"

# Step 1: Login 
login_response = requests.post(f"{BASE_URL}/login", json={
    "email": "employee.test@example.com",
    "password": "test1234"
})

print("Login status:", login_response.status_code)
token = login_response.json()["access_token"]
print("Token received:", token[:30], "...")

# Step 2: Access protected /me endpoint using the token
headers = {"Authorization": f"Bearer {token}"}
me_response = requests.get(f"{BASE_URL}/me", headers=headers)
print("Me status:", me_response.status_code)
print("Me response:", me_response.json())

# Step 3: Try accessing /users as employee (should be blocked)
users_response = requests.get(f"{BASE_URL}/users", headers=headers)
print("Users list status:", users_response.status_code)
print("Response:", users_response.json())

# Step 4: Try to update a user's role
role_update_response = requests.put(
    f"{BASE_URL}/users/8/role",
    json={"role": "manager"},
    headers=headers
)
print("Role update status:", role_update_response.status_code)
print("Response:", role_update_response.json())

# Step 5: Create a decision
decision_response = requests.post(
    f"{BASE_URL}/decisions",
    json={
        "title": "Migrate to cloud database",
        "problem_statement": "Team members were using separate local databases, making collaboration difficult.",
        "category": "Technical"
    },
    headers=headers
)
print("Create decision status:", decision_response.status_code)
print("Response:", decision_response.json())

# Step 6: List all decisions
list_response = requests.get(f"{BASE_URL}/decisions", headers=headers)
print("List decisions status:", list_response.status_code)
print("Response:", list_response.json())

# Step 7: Try to update decision status
status_response = requests.put(
    f"{BASE_URL}/decisions/1/status",
    json={"status": "under_review"},
    headers=headers
)
print("Update status (as employee):", status_response.status_code)
print("Response:", status_response.json())

# Step 8: View a single decision
single_decision_response = requests.get(f"{BASE_URL}/decisions/999", headers=headers)
print("Get single decision status:", single_decision_response.status_code)
print("Response:", single_decision_response.json())