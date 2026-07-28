import base64
import os
import hashlib
import urllib.parse
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class B2Client:
    def __init__(self):
        self.key_id = os.getenv("B2_KEY_ID")
        self.application_key = os.getenv("B2_APPLICATION_KEY")
        self.bucket_name = os.getenv("B2_BUCKET_NAME")
        
        self.account_id = None
        self.api_url = None
        self.download_url = None
        self.auth_token = None
        self.bucket_id = None

    def authorize(self):
        if not self.key_id or not self.application_key:
            raise ValueError("B2_KEY_ID and B2_APPLICATION_KEY environment variables must be set.")
            
        credentials = f"{self.key_id}:{self.application_key}"
        encoded_credentials = base64.b64encode(credentials.encode('utf-8')).decode('utf-8')
        headers = {
            "Authorization": f"Basic {encoded_credentials}"
        }
        url = "https://api.backblazeb2.com/b2api/v2/b2_authorize_account"
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        self.account_id = data["accountId"]
        self.api_url = data["apiUrl"]
        self.download_url = data["downloadUrl"]
        self.auth_token = data["authorizationToken"]

    def _get_bucket_id(self):
        if not self.bucket_name:
            raise ValueError("B2_BUCKET_NAME environment variable must be set.")
        if not self.auth_token:
            self.authorize()
            
        headers = {
            "Authorization": self.auth_token
        }
        url = f"{self.api_url}/b2api/v2/b2_list_buckets"
        response = requests.post(url, headers=headers, json={
            "accountId": self.account_id,
            "bucketName": self.bucket_name
        })
        response.raise_for_status()
        buckets = response.json().get("buckets", [])
        if not buckets:
            raise ValueError(f"Bucket '{self.bucket_name}' not found.")
        self.bucket_id = buckets[0]["bucketId"]
        return self.bucket_id

    def upload_file(self, content: bytes, filename: str, content_type: str = "b2/x-auto") -> str:
        # 1. Authorize
        self.authorize()
        # 2. Get bucket ID
        bucket_id = self._get_bucket_id()
        # 3. Get upload URL
        headers = {
            "Authorization": self.auth_token
        }
        url = f"{self.api_url}/b2api/v2/b2_get_upload_url"
        response = requests.post(url, headers=headers, json={
            "bucketId": bucket_id
        })
        response.raise_for_status()
        upload_data = response.json()
        upload_url = upload_data["uploadUrl"]
        upload_auth_token = upload_data["authorizationToken"]
        
        # 4. Upload file
        sha1_hash = hashlib.sha1(content).hexdigest()
        encoded_filename = urllib.parse.quote(filename)
        
        upload_headers = {
            "Authorization": upload_auth_token,
            "X-Bz-File-Name": encoded_filename,
            "Content-Type": content_type,
            "Content-Length": str(len(content)),
            "X-Bz-Content-Sha1": sha1_hash
        }
        
        upload_response = requests.post(upload_url, headers=upload_headers, data=content)
        upload_response.raise_for_status()
        
        return f"{self.download_url}/file/{self.bucket_name}/{filename}"

    def get_download_authorization(self, filename: str, valid_duration: int = 3600) -> str:
        # 1. Authorize
        self.authorize()
        # 2. Get bucket ID
        bucket_id = self._get_bucket_id()
        # 3. Get download authorization
        headers = {
            "Authorization": self.auth_token
        }
        url = f"{self.api_url}/b2api/v2/b2_get_download_authorization"
        response = requests.post(url, headers=headers, json={
            "bucketId": bucket_id,
            "fileNamePrefix": filename,
            "validDurationInSeconds": valid_duration
        })
        response.raise_for_status()
        data = response.json()
        return data["authorizationToken"]

# Global cache for download URL to speed up serving/redirection requests
_b2_download_url_cache = None

def get_b2_download_url(filename: str) -> str:
    global _b2_download_url_cache
    # Strip any leading slash to match the upload path structure
    clean_filename = filename.lstrip("/")
    client = B2Client()
    
    try:
        # Get download authorization token for this file (highly secure, time-limited)
        auth_token = client.get_download_authorization(clean_filename)
        encoded_filename = urllib.parse.quote(clean_filename, safe="/")
        return f"{client.download_url}/file/{client.bucket_name}/{encoded_filename}?Authorization={auth_token}"
    except Exception as e:
        # Fallback to standard URL if B2 call fails or config is incomplete
        if not _b2_download_url_cache:
            client.authorize()
            _b2_download_url_cache = client.download_url
        bucket_name = os.getenv("B2_BUCKET_NAME")
        encoded_filename = urllib.parse.quote(clean_filename, safe="/")
        return f"{_b2_download_url_cache}/file/{bucket_name}/{encoded_filename}"

def upload_to_b2(content: bytes, filename: str, content_type: str = "b2/x-auto") -> str:
    # Strip any leading slash to match the upload path structure
    clean_filename = filename.lstrip("/")
    client = B2Client()
    return client.upload_file(content, clean_filename, content_type)
