import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("Starting Meeting Notes Feature Tests...")

    # Step 1: Login
    try:
        login_response = requests.post(f"{BASE_URL}/login", json={
            "email": "employee.test@example.com",
            "password": "test1234"
        })
        if login_response.status_code != 200:
            print(f"FAILED: Login failed: {login_response.status_code} {login_response.text}")
            sys.exit(1)
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("SUCCESS: Login successful!")
    except Exception as e:
        print(f"FAILED: Failed to connect to server: {e}")
        sys.exit(1)

    # Step 2: Create a Decision to test against
    decision_payload = {
        "title": "Database Optimization Meeting",
        "problem_statement": "We need to discuss and document indexes for query speedup.",
        "category": "Database"
    }
    dec_response = requests.post(f"{BASE_URL}/decisions", json=decision_payload, headers=headers)
    assert dec_response.status_code == 200, f"Failed to create decision: {dec_response.text}"
    decision = dec_response.json()
    decision_id = decision["id"]
    print(f"SUCCESS: Created test decision with ID {decision_id}")

    # Step 3: Create a regular comment
    comment_payload = {
        "decision_id": decision_id,
        "message": "This is a comment about optimization options."
    }
    comment_response = requests.post(f"{BASE_URL}/discussion", json=comment_payload, headers=headers)
    assert comment_response.status_code == 200, f"Failed to create comment: {comment_response.text}"
    comment = comment_response.json()
    print("SUCCESS: Created discussion comment:", comment["message"])
    assert comment["message_type"] == "comment", f"Expected type 'comment', got '{comment['message_type']}'"

    # Step 4: Create a meeting note
    note_payload = {
        "decision_id": decision_id,
        "message": "Meeting Notes 2026-07-18:\n1. Discussed composite indexes.\n2. Action item: add index on created_at."
    }
    note_response = requests.post(f"{BASE_URL}/discussion/meeting-note", json=note_payload, headers=headers)
    assert note_response.status_code == 200, f"Failed to create meeting note: {note_response.text}"
    note = note_response.json()
    print("SUCCESS: Created meeting note:", note["message"])
    assert note["message_type"] == "meeting_note", f"Expected type 'meeting_note', got '{note['message_type']}'"

    # Step 5: Get discussion thread and verify both are present
    thread_response = requests.get(f"{BASE_URL}/discussion/decision/{decision_id}", headers=headers)
    assert thread_response.status_code == 200, f"Failed to retrieve thread: {thread_response.text}"
    thread = thread_response.json()
    
    print(f"SUCCESS: Retrieved thread with {len(thread)} messages.")
    
    comment_found = False
    note_found = False
    
    for message in thread:
        if message["id"] == comment["id"]:
            assert message["message_type"] == "comment"
            comment_found = True
        elif message["id"] == note["id"]:
            assert message["message_type"] == "meeting_note"
            note_found = True
            
    assert comment_found, "Regular comment was not found in thread"
    assert note_found, "Meeting note was not found in thread"
    print("SUCCESS: Verified thread contains both comment and meeting note with correct types!")
    print("ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
