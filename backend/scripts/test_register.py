import json
from urllib import request, error
import time

email = f"tryuser_{int(time.time())}@example.com"
payload = json.dumps({"full_name":"Try User","email":email,"password":"TryPass123!","role":"Employee"}).encode('utf-8')
req = request.Request('http://127.0.0.1:8000/auth/register', data=payload, headers={'Content-Type':'application/json'})
try:
    resp = request.urlopen(req, timeout=10)
    print('Status:', resp.getcode())
    print(resp.read().decode())
except error.HTTPError as e:
    print('Status:', e.code)
    try:
        print(e.read().decode())
    except Exception:
        print('No body')
except Exception as e:
    print('Exception:', e)
