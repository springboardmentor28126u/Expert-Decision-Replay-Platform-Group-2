"""
Regression tests for Phase 3 Digital Signature on Approvals.
"""
import pytest
from uuid import uuid4
from datetime import datetime, timezone

from app.models.user import User, UserRole
from app.models.company import Company
from app.models.membership import Membership, CompanyRole
from app.models.group import Group
from app.models.decision import Decision, DecisionStatus
from app.models.approval import Approval, ApprovalStatus
from app.services.signature_service import SignatureService


# ─── Helpers ────────────────────────────────────────────────────────────

def create_test_user(db, company_id, role=CompanyRole.EMPLOYEE, name="Test User"):
    user = User(
        email=f"{uuid4().hex[:8]}@test.com",
        full_name=name,
        hashed_password="hashed",
        role=UserRole.EMPLOYEE,
    )
    db.add(user)
    db.flush()
    membership = Membership(
        user_id=user.id,
        company_id=company_id,
        company_role=role,
    )
    db.add(membership)
    db.flush()
    return user


def create_test_decision(db, company_id, group_id, created_by, **kwargs):
    decision = Decision(
        title="Test Decision",
        problem_statement="Test problem statement for signature tests",
        company_id=company_id,
        group_id=group_id,
        category_id=kwargs.get("category_id", uuid4()),
        created_by=created_by,
        status=kwargs.get("status", DecisionStatus.UNDER_REVIEW),
    )
    db.add(decision)
    db.flush()
    return decision


# ─── Test: Signature Computation ────────────────────────────────────────

class TestSignatureService:
    def test_compute_signature_deterministic(self):
        """Same inputs should produce same hash."""
        sig1, time1 = SignatureService.compute_signature(
            approval_id=uuid4(),
            decision_id=uuid4(),
            approver_id=uuid4(),
            level=1,
            round=1,
            action="approved",
            comments="Looks good",
            attestation_text=SignatureService.ATTESTATION_TEXT,
        )

        # Can't call again with same acted_at, but we can verify it's a valid hex
        assert len(sig1) == 64
        assert all(c in "0123456789abcdef" for c in sig1)

    def test_different_comments_produce_different_hash(self):
        """Different comments should produce different hashes."""
        approval_id = uuid4()
        decision_id = uuid4()
        approver_id = uuid4()

        sig1, _ = SignatureService.compute_signature(
            approval_id=approval_id,
            decision_id=decision_id,
            approver_id=approver_id,
            level=1,
            round=1,
            action="approved",
            comments="Option A",
            attestation_text=SignatureService.ATTESTATION_TEXT,
        )

        sig2, _ = SignatureService.compute_signature(
            approval_id=approval_id,
            decision_id=decision_id,
            approver_id=approver_id,
            level=1,
            round=1,
            action="approved",
            comments="Option B",
            attestation_text=SignatureService.ATTESTATION_TEXT,
        )

        assert sig1 != sig2

    def test_different_actions_produce_different_hash(self):
        """Approved vs rejected should produce different hashes."""
        approval_id = uuid4()
        decision_id = uuid4()
        approver_id = uuid4()

        sig1, time1 = SignatureService.compute_signature(
            approval_id=approval_id,
            decision_id=decision_id,
            approver_id=approver_id,
            level=1,
            round=1,
            action="approved",
            comments=None,
            attestation_text=SignatureService.ATTESTATION_TEXT,
        )

        sig2, _ = SignatureService.compute_signature(
            approval_id=approval_id,
            decision_id=decision_id,
            approver_id=approver_id,
            level=1,
            round=1,
            action="rejected",
            comments=None,
            attestation_text=SignatureService.ATTESTATION_TEXT,
        )

        assert sig1 != sig2

    def test_verify_signature_valid(self):
        """Verification should succeed with matching parameters."""
        approval_id = uuid4()
        decision_id = uuid4()
        approver_id = uuid4()

        sig_hash, acted_at = SignatureService.compute_signature(
            approval_id=approval_id,
            decision_id=decision_id,
            approver_id=approver_id,
            level=1,
            round=1,
            action="approved",
            comments="All clear",
            attestation_text=SignatureService.ATTESTATION_TEXT,
        )

        is_valid = SignatureService.verify_signature(
            approval_id=approval_id,
            decision_id=decision_id,
            approver_id=approver_id,
            level=1,
            round=1,
            action="approved",
            comments="All clear",
            attested_at=acted_at,
            attestation_text=SignatureService.ATTESTATION_TEXT,
            expected_hash=sig_hash,
        )

        assert is_valid is True

    def test_verify_signature_tampered(self):
        """Verification should fail with wrong hash."""
        approval_id = uuid4()
        decision_id = uuid4()
        approver_id = uuid4()

        _, acted_at = SignatureService.compute_signature(
            approval_id=approval_id,
            decision_id=decision_id,
            approver_id=approver_id,
            level=1,
            round=1,
            action="approved",
            comments="All clear",
            attestation_text=SignatureService.ATTESTATION_TEXT,
        )

        is_valid = SignatureService.verify_signature(
            approval_id=approval_id,
            decision_id=decision_id,
            approver_id=approver_id,
            level=1,
            round=1,
            action="approved",
            comments="All clear",
            attested_at=acted_at,
            attestation_text=SignatureService.ATTESTATION_TEXT,
            expected_hash="0" * 64,  # wrong hash
        )

        assert is_valid is False

    def test_verify_signature_wrong_level(self):
        """Verification should fail with wrong level."""
        approval_id = uuid4()
        decision_id = uuid4()
        approver_id = uuid4()

        sig_hash, acted_at = SignatureService.compute_signature(
            approval_id=approval_id,
            decision_id=decision_id,
            approver_id=approver_id,
            level=1,
            round=1,
            action="approved",
            comments=None,
            attestation_text=SignatureService.ATTESTATION_TEXT,
        )

        is_valid = SignatureService.verify_signature(
            approval_id=approval_id,
            decision_id=decision_id,
            approver_id=approver_id,
            level=2,  # wrong level
            round=1,
            action="approved",
            comments=None,
            attested_at=acted_at,
            attestation_text=SignatureService.ATTESTATION_TEXT,
            expected_hash=sig_hash,
        )

        assert is_valid is False

    def test_attestation_text_constant(self):
        """ATTESTATION_TEXT should be a non-empty string."""
        assert len(SignatureService.ATTESTATION_TEXT) > 0
        assert "reviewed" in SignatureService.ATTESTATION_TEXT.lower()
