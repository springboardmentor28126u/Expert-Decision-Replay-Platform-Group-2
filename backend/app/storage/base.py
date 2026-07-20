"""Abstract storage backend interface.

This module defines the interface that all storage backends must implement.
To switch from local storage to S3, simply implement the StorageBackend
interface and swap the dependency injection in dependencies.py.
"""

from abc import ABC, abstractmethod
from typing import BinaryIO, Optional


class StorageBackend(ABC):
    """Abstract base class for file storage backends."""

    @abstractmethod
    def save(self, file: BinaryIO, filename: str, subfolder: str = "") -> str:
        """Save a file and return the storage path.

        Args:
            file: File-like binary object to save.
            filename: Name to save the file as.
            subfolder: Optional subfolder within the storage root.

        Returns:
            The relative path where the file was saved.
        """
        pass

    @abstractmethod
    def get(self, filepath: str) -> Optional[str]:
        """Get the absolute path to a stored file.

        Args:
            filepath: The relative path returned by save().

        Returns:
            Absolute path to the file, or None if not found.
        """
        pass

    @abstractmethod
    def delete(self, filepath: str) -> bool:
        """Delete a stored file.

        Args:
            filepath: The relative path returned by save().

        Returns:
            True if deleted, False if file not found.
        """
        pass

    @abstractmethod
    def exists(self, filepath: str) -> bool:
        """Check if a file exists in storage.

        Args:
            filepath: The relative path returned by save().

        Returns:
            True if file exists, False otherwise.
        """
        pass
