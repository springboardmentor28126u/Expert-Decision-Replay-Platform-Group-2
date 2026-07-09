import requests

BASE_URL = "http://127.0.0.1:8000"

# Step 1: Login 
login_response = requests.post(f"{BASE_URL}/login", json={
    "email": "umme@example.com",
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
print("Users list status (as employee):", users_response.status_code)
print("Response:", users_response.json())