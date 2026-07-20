"""Local filesystem storage backend."""

import os
import shutil
from pathlib import Path
from typing import BinaryIO, Optional

from app.storage.base import StorageBackend
from app.config import get_settings


class LocalStorage(StorageBackend):
    """Store files on the local filesystem."""

    def __init__(self):
        settings = get_settings()
        self.base_dir = Path(settings.upload_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save(self, file: BinaryIO, filename: str, subfolder: str = "") -> str:
        """Save a file to local disk.

        Args:
            file: File-like binary object.
            filename: Name for the file.
            subfolder: Optional subfolder (e.g., decision ID).

        Returns:
            Relative path from the uploads root.
        """
        target_dir = self.base_dir / subfolder if subfolder else self.base_dir
        target_dir.mkdir(parents=True, exist_ok=True)

        filepath = target_dir / filename
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file, buffer)

        return str(filepath.relative_to(self.base_dir))

    def get(self, filepath: str) -> Optional[str]:
        """Get absolute path to a local file.

        Args:
            filepath: Relative path within uploads directory.

        Returns:
            Absolute path string, or None if file doesn't exist.
        """
        full_path = self.base_dir / filepath
        if full_path.exists():
            return str(full_path.resolve())
        return None

    def delete(self, filepath: str) -> bool:
        """Delete a file from local disk.

        Args:
            filepath: Relative path within uploads directory.

        Returns:
            True if deleted, False if not found.
        """
        full_path = self.base_dir / filepath
        if full_path.exists():
            full_path.unlink()
            return True
        return False

    def exists(self, filepath: str) -> bool:
        """Check if file exists on local disk.

        Args:
            filepath: Relative path within uploads directory.

        Returns:
            True if exists.
        """
        return (self.base_dir / filepath).exists()
