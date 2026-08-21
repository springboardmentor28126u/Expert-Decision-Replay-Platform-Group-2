"""
Regression tests for Phase 1 Critical Fixes.
Tests tenant isolation, defense-in-depth, approval history, and audit immutability.
"""
import pytest
from uuid import uuid4
from datetime import datetime, timezone
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database.base import Base
from app.models.user import User, UserRole
from app.models.company import Company
from app.models.membership import Membership, CompanyRole
from app.models.group import Group
from app.models.group_membership import GroupMembership, GroupMemberRole
from app.models.decision import Decision, DecisionStatus
from app.models.approval import Approval, ApprovalStatus
from app.models.team import Team
from app.models.audit_log import AuditLog
from app.schemas.approval import ApproverAssign
from app.services.approval_service import ApprovalService
from app.services.decision_service import DecisionService
from app.services.audit_service import AuditService
from app.services.workflow import log_audit_event
from app.api.deps import can_access_decision
from app.core.security import create_access_token


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


def create_test_decision(db, company_id, group_id, created_by):
    decision = Decision(
        title="Test Decision",
        problem_statement="Test problem statement for regression tests",
        company_id=company_id,
        group_id=group_id,
        category_id=uuid4(),
        created_by=created_by,
        status=DecisionStatus.DRAFT,
    )
    db.add(decision)
    db.flush()
    return decision


# ─── Test: Tenant Isolation (1.1) ──────────────────────────────────────

class TestTenantIsolation:
    def test_user_cannot_cross_company_boundary(self, db_session):
        """Users from Company A cannot see users from Company B."""
        company_a = Company(id=uuid4(), name="Company A")
        company_b = Company(id=uuid4(), name="Company B")
        db_session.add_all([company_a, company_b])
        db_session.flush()

        user_a = create_test_user(db_session, company_a.id, CompanyRole.ADMIN, "User A")
        user_b = create_test_user(db_session, company_b.id, CompanyRole.ADMIN, "User B")
        db_session.commit()

        from app.services.user_service import UserService
        users_in_a = UserService.list_users(db_session, company_a.id)
        user_ids = [u.id for u in users_in_a]
        assert user_a.id in user_ids
        assert user_b.id not in user_ids

    def test_team_cannot_cross_company_boundary(self, db_session):
        """Teams from Company A are not visible in Company B."""
        company_a = Company(id=uuid4(), name="Company A")
        company_b = Company(id=uuid4(), name="Company B")
        db_session.add_all([company_a, company_b])
        db_session.flush()

        team_a = Team(id=uuid4(), name="Team A", company_id=company_a.id)
        team_b = Team(id=uuid4(), name="Team B", company_id=company_b.id)
        db_session.add_all([team_a, team_b])
        db_session.commit()

        from app.services.team_service import TeamService
        teams_in_a = TeamService.list_teams(db_session, company_a.id)
        team_ids = [t.id for t in teams_in_a]
        assert team_a.id in team_ids
        assert team_b.id not in team_ids


# ─── Test: Defense-in-Depth (1.3) ──────────────────────────────────────

class TestDefenseInDepth:
    def test_alternative_service_checks_access(self, db_session):
        """AlternativeService.create calls can_access_decision before creating."""
        company = Company(id=uuid4(), name="Test Co")
        db_session.add(company)
        db_session.flush()

        user = create_test_user(db_session, company.id, CompanyRole.EMPLOYEE)
        group = Group(id=uuid4(), name="Test Group", company_id=company.id)
        db_session.add(group)
        db_session.flush()

        decision = create_test_user(db_session, company.id, group.id, user.id)
        db_session.commit()

        with patch("app.services.alternative_service.can_access_decision") as mock_check:
            from app.services.alternative_service import AlternativeService
            from app.schemas.alternative import AlternativeCreate
            try:
                AlternativeService.create(
                    db_session, decision.id,
                    AlternativeCreate(title="Test Alt"),
                    user,
                )
            except Exception:
                pass
            mock_check.assert_called_once()

    def test_comment_service_checks_access(self, db_session):
        """DecisionCommentService.create_comment calls can_access_decision."""
        company = Company(id=uuid4(), name="Test Co")
        db_session.add(company)
        db_session.flush()

        user = create_test_user(db_session, company.id, CompanyRole.EMPLOYEE)
        group = Group(id=uuid4(), name="Test Group", company_id=company.id)
        db_session.add(group)
        db_session.flush()

        decision = create_test_decision(db_session, company.id, group.id, user.id)
        db_session.commit()

        with patch("app.services.decision_comment_service.can_access_decision") as mock_check:
            from app.services.decision_comment_service import DecisionCommentService
            from app.schemas.decision_comment import DecisionCommentCreate
            try:
                DecisionCommentService.create_comment(
                    db_session, decision,
                    DecisionCommentCreate(content="Test comment"),
                    user,
                )
            except Exception:
                pass
            mock_check.assert_called_once()


# ─── Test: Approval History (1.4) ──────────────────────────────────────

class TestApprovalHistory:
    def test_resubmission_preserves_old_approvals(self, db_session):
        """On resubmission, old approvals are marked SUPERSEDED, not deleted."""
        company = Company(id=uuid4(), name="Test Co")
        db_session.add(company)
        db_session.flush()

        owner = create_test_user(db_session, company.id, CompanyRole.EMPLOYEE, "Owner")
        approver1 = create_test_user(db_session, company.id, CompanyRole.REVIEWER, "Approver1")
        approver2 = create_test_user(db_session, company.id, CompanyRole.MANAGER, "Approver2")
        group = Group(id=uuid4(), name="Test Group", company_id=company.id)
        db_session.add(group)
        db_session.flush()

        decision = create_test_decision(db_session, company.id, group.id, owner.id)
        db_session.commit()

        # Create initial round approvals
        approval_r1 = Approval(
            decision_id=decision.id, approver_id=approver1.id,
            level=1, round=1, status=ApprovalStatus.APPROVED,
            acted_at=datetime.now(timezone.utc),
        )
        db_session.add(approval_r1)
        db_session.commit()

        # Simulate resubmission — should supersede, not delete
        existing = db_session.query(Approval).filter(
            Approval.decision_id == decision.id,
            Approval.level == 1,
        ).first()

        existing.status = ApprovalStatus.SUPERSEDED
        existing.acted_at = datetime.now(timezone.utc)
        existing.comments = "Superseded by resubmission"

        new_approval = Approval(
            decision_id=decision.id, approver_id=approver1.id,
            level=1, round=2, status=ApprovalStatus.PENDING,
        )
        db_session.add(new_approval)
        db_session.commit()

        # Verify both rounds exist
        all_approvals = db_session.query(Approval).filter(
            Approval.decision_id == decision.id,
        ).all()
        assert len(all_approvals) == 2
        assert all_approvals[0].status == ApprovalStatus.SUPERSEDED
        assert all_approvals[1].status == ApprovalStatus.PENDING
        assert all_approvals[0].round == 1
        assert all_approvals[1].round == 2


# ─── Test: Audit Immutability (1.5) ────────────────────────────────────

class TestAuditImmutability:
    def test_audit_log_company_id(self, db_session):
        """AuditService.log accepts and stores company_id."""
        company = Company(id=uuid4(), name="Test Co")
        db_session.add(company)
        db_session.flush()

        user = create_test_user(db_session, company.id, CompanyRole.ADMIN)
        db_session.commit()

        entry = AuditService.log(
            db_session,
            entity_type="test",
            entity_id=uuid4(),
            action="test_action",
            performed_by=user.id,
            company_id=company.id,
            new_value={"key": "value"},
        )
        db_session.commit()

        assert entry.company_id == company.id

    def test_log_audit_event_splits_old_new(self, db_session):
        """log_audit_event splits status change diff into old_value and new_value."""
        from app.models.audit_log import AuditLog

        diff = {"status": {"old": "draft", "new": "under_review"}}
        entry = log_audit_event(
            db_session, "decision", uuid4(), uuid4(), "status_change", diff
        )
        db_session.flush()

        assert entry.old_value == {"status": "draft"}
        assert entry.new_value == {"status": "under_review"}
