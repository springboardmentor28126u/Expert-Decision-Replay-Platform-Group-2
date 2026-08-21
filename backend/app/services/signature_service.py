"""
Expert Decision Replay Platform - Digital Signature Service

Computes SHA-256 hashes of approval attestation payloads and verifies integrity.
"""

import hashlib
import json
from datetime import datetime, timezone
from uuid import UUID


class SignatureService:
    """
    Service for computing and verifying digital signatures on approvals.
    
    The signature hash is a SHA-256 of a canonical JSON payload containing:
    - approval_id
    - decision_id
    - approver_id
    - level
    - round
    - action (approve/reject)
    - comments
    - acted_at (ISO format)
    - attestation_text
    """

    ATTESTATION_TEXT = (
        "I confirm that I have reviewed this decision in its entirety, "
        "considered the alternatives presented, and my approval or rejection "
        "is based on my professional judgment and the information available to me."
    )

    @staticmethod
    def compute_signature(
        approval_id: UUID,
        decision_id: UUID,
        approver_id: UUID,
        level: int,
        round: int,
        action: str,
        comments: str | None,
        attestation_text: str,
    ) -> tuple[str, datetime]:
        """
        Compute a SHA-256 signature hash for an approval action.
        
        Returns:
            Tuple of (signature_hash_hex, acted_at_timestamp)
        """
        acted_at = datetime.now(timezone.utc)

        payload = {
            "approval_id": str(approval_id),
            "decision_id": str(decision_id),
            "approver_id": str(approver_id),
            "level": level,
            "round": round,
            "action": action,
            "comments": comments,
            "acted_at": acted_at.isoformat(),
            "attestation_text": attestation_text,
        }

        # Canonical JSON: sorted keys, no whitespace
        canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        signature_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()

        return signature_hash, acted_at

    @staticmethod
    def verify_signature(
        approval_id: UUID,
        decision_id: UUID,
        approver_id: UUID,
        level: int,
        round: int,
        action: str,
        comments: str | None,
        attested_at: datetime,
        attestation_text: str,
        expected_hash: str,
    ) -> bool:
        """
        Verify that a stored signature hash matches the expected computation.
        
        Returns True if the hash is valid, False otherwise.
        """
        payload = {
            "approval_id": str(approval_id),
            "decision_id": str(decision_id),
            "approver_id": str(approver_id),
            "level": level,
            "round": round,
            "action": action,
            "comments": comments,
            "acted_at": attested_at.isoformat(),
            "attestation_text": attestation_text,
        }

        canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        computed_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()

        return computed_hash == expected_hash
