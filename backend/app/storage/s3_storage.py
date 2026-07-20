"""AWS S3 storage backend stub.

This is a placeholder implementation. To enable S3 storage:
1. Install boto3: pip install boto3
2. Add AWS credentials to .env (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME)
3. Implement the methods below
4. Switch the storage dependency in dependencies.py
"""

from typing import BinaryIO, Optional

from app.storage.base import StorageBackend


class S3Storage(StorageBackend):
    """AWS S3 storage backend (placeholder for future integration)."""

    def __init__(self):
        raise NotImplementedError(
            "S3 storage is not yet configured. "
            "Install boto3 and provide AWS credentials to enable S3 storage."
        )

    def save(self, file: BinaryIO, filename: str, subfolder: str = "") -> str:
        """Upload file to S3 bucket."""
        raise NotImplementedError("S3 storage not implemented yet.")

    def get(self, filepath: str) -> Optional[str]:
        """Generate a presigned URL for the S3 object."""
        raise NotImplementedError("S3 storage not implemented yet.")

    def delete(self, filepath: str) -> bool:
        """Delete object from S3 bucket."""
        raise NotImplementedError("S3 storage not implemented yet.")

    def exists(self, filepath: str) -> bool:
        """Check if object exists in S3 bucket."""
        raise NotImplementedError("S3 storage not implemented yet.")
