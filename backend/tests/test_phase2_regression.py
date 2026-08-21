"""
Regression tests for Phase 2 Benchmarking and Routing Rules.
"""
import pytest
from uuid import uuid4
from datetime import datetime, timezone
from decimal import Decimal

from app.models.user import User, UserRole
from app.models.company import Company
from app.models.membership import Membership, CompanyRole
from app.models.group import Group
from app.models.decision import Decision, DecisionStatus
from app.models.approval_routing_rule import ApprovalRoutingRule, Operator, InsertPosition
from app.services.benchmark_service import BenchmarkService
from app.services.approval_routing_service import ApprovalRoutingService


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
        problem_statement="Test problem statement for benchmark tests",
        company_id=company_id,
        group_id=group_id,
        category_id=kwargs.get("category_id", uuid4()),
        created_by=created_by,
        status=kwargs.get("status", DecisionStatus.DRAFT),
        financial_impact=kwargs.get("financial_impact"),
        risk_score=kwargs.get("risk_score"),
        impact_level=kwargs.get("impact_level", "medium"),
    )
    db.add(decision)
    db.flush()
    return decision


# ─── Test: Routing Rules ────────────────────────────────────────────────

class TestApprovalRoutingService:
    def test_evaluate_condition_gte(self, db_session):
        """financial_impact >= 50000 should return True."""
        company = Company(id=uuid4(), name="Co")
        db_session.add(company)
        db_session.flush()

        decision = Decision(
            title="D", problem_statement="P",
            company_id=company.id, group_id=uuid4(),
            category_id=uuid4(), created_by=uuid4(),
            financial_impact=Decimal("75000"),
        )
        db_session.add(decision)
        db_session.flush()

        rule = ApprovalRoutingRule(
            company_id=company.id, category="budget",
            condition_field="financial_impact", operator=Operator.GTE,
            condition_value="50000", inserted_role="legal",
            insert_position=InsertPosition.APPEND, priority=1, active=True,
        )
        db_session.add(rule)
        db_session.flush()

        assert ApprovalRoutingService.evaluate_condition(decision, rule) is True

    def test_evaluate_condition_lte(self, db_session):
        """financial_impact <= 10000 should return True."""
        company = Company(id=uuid4(), name="Co2")
        db_session.add(company)
        db_session.flush()

        decision = Decision(
            title="D", problem_statement="P",
            company_id=company.id, group_id=uuid4(),
            category_id=uuid4(), created_by=uuid4(),
            financial_impact=Decimal("5000"),
        )
        db_session.add(decision)
        db_session.flush()

        rule = ApprovalRoutingRule(
            company_id=company.id, category="budget",
            condition_field="financial_impact", operator=Operator.LTE,
            condition_value="10000", inserted_role="legal",
            insert_position=InsertPosition.APPEND, priority=1, active=True,
        )
        db_session.add(rule)
        db_session.flush()

        assert ApprovalRoutingService.evaluate_condition(decision, rule) is True

    def test_evaluate_condition_eq(self, db_session):
        """risk_score == 3 should return True."""
        company = Company(id=uuid4(), name="Co3")
        db_session.add(company)
        db_session.flush()

        decision = Decision(
            title="D", problem_statement="P",
            company_id=company.id, group_id=uuid4(),
            category_id=uuid4(), created_by=uuid4(),
            risk_score=3,
        )
        db_session.add(decision)
        db_session.flush()

        rule = ApprovalRoutingRule(
            company_id=company.id, category="budget",
            condition_field="risk_score", operator=Operator.EQ,
            condition_value="3", inserted_role="security",
            insert_position=InsertPosition.APPEND, priority=1, active=True,
        )
        db_session.add(rule)
        db_session.flush()

        assert ApprovalRoutingService.evaluate_condition(decision, rule) is True

    def test_evaluate_condition_no_match(self, db_session):
        """Condition that doesn't match should return False."""
        company = Company(id=uuid4(), name="Co4")
        db_session.add(company)
        db_session.flush()

        decision = Decision(
            title="D", problem_statement="P",
            company_id=company.id, group_id=uuid4(),
            category_id=uuid4(), created_by=uuid4(),
            financial_impact=Decimal("5000"),
        )
        db_session.add(decision)
        db_session.flush()

        rule = ApprovalRoutingRule(
            company_id=company.id, category="budget",
            condition_field="financial_impact", operator=Operator.GTE,
            condition_value="50000", inserted_role="legal",
            insert_position=InsertPosition.APPEND, priority=1, active=True,
        )
        db_session.add(rule)
        db_session.flush()

        assert ApprovalRoutingService.evaluate_condition(decision, rule) is False

    def test_resolve_approval_chain_insert_after(self, db_session):
        """Rule with insert_after should insert role at correct position."""
        company = Company(id=uuid4(), name="Test Co")
        group = Group(id=uuid4(), company_id=company.id, name="Grp")
        db_session.add_all([company, group])
        db_session.flush()

        user = create_test_user(db_session, company.id)
        cat_id = uuid4()

        decision = create_test_decision(
            db_session, company.id, group.id, user.id,
            category_id=cat_id, financial_impact=Decimal("75000"),
        )

        rule = ApprovalRoutingRule(
            company_id=company.id, category="budget",
            condition_field="financial_impact", operator=Operator.GTE,
            condition_value="50000", inserted_role="legal",
            insert_position=InsertPosition.APPEND, priority=10, active=True,
        )
        db_session.add(rule)
        db_session.flush()

        base_levels = [{"level": 1, "role": "manager"}, {"level": 2, "role": "director"}]

        result = ApprovalRoutingService.resolve_approval_chain(
            db_session, decision, base_levels, "budget",
        )

        assert len(result) == 3
        assert result[0]["role"] == "manager"
        assert result[1]["role"] == "director"
        assert result[2]["role"] == "legal"
        assert result[2].get("source") == "routing_rule"

    def test_resolve_approval_chain_insert_before(self, db_session):
        """Rule with insert_before should insert role before specified level."""
        company = Company(id=uuid4(), name="Test Co 2")
        group = Group(id=uuid4(), company_id=company.id, name="Grp2")
        db_session.add_all([company, group])
        db_session.flush()

        user = create_test_user(db_session, company.id)
        cat_id = uuid4()

        decision = create_test_decision(
            db_session, company.id, group.id, user.id,
            category_id=cat_id, risk_score=8,
        )

        rule = ApprovalRoutingRule(
            company_id=company.id, category="budget",
            condition_field="risk_score", operator=Operator.GTE,
            condition_value="7", inserted_role="security",
            insert_position=InsertPosition.INSERT_BEFORE,
            insert_before_level=2, priority=5, active=True,
        )
        db_session.add(rule)
        db_session.flush()

        base_levels = [{"level": 1, "role": "manager"}, {"level": 2, "role": "director"}]

        result = ApprovalRoutingService.resolve_approval_chain(
            db_session, decision, base_levels, "budget",
        )

        assert len(result) == 3
        assert result[0]["role"] == "manager"
        assert result[1]["role"] == "security"
        assert result[2]["role"] == "director"

    def test_resolve_approval_chain_no_match(self, db_session):
        """Rule that doesn't match should leave chain unchanged."""
        company = Company(id=uuid4(), name="Test Co 3")
        group = Group(id=uuid4(), company_id=company.id, name="Grp3")
        db_session.add_all([company, group])
        db_session.flush()

        user = create_test_user(db_session, company.id)
        cat_id = uuid4()

        decision = create_test_decision(
            db_session, company.id, group.id, user.id,
            category_id=cat_id, financial_impact=Decimal("25000"),
        )

        rule = ApprovalRoutingRule(
            company_id=company.id, category="budget",
            condition_field="financial_impact", operator=Operator.GTE,
            condition_value="100000", inserted_role="legal",
            insert_position=InsertPosition.APPEND, priority=1, active=True,
        )
        db_session.add(rule)
        db_session.flush()

        base_levels = [{"level": 1, "role": "manager"}, {"level": 2, "role": "director"}]

        result = ApprovalRoutingService.resolve_approval_chain(
            db_session, decision, base_levels, "budget",
        )

        assert len(result) == 2
        assert result[0]["role"] == "manager"
        assert result[1]["role"] == "director"

    def test_resolve_approval_chain_inactive_rule_skipped(self, db_session):
        """Inactive rules should not be applied."""
        company = Company(id=uuid4(), name="Test Co 4")
        group = Group(id=uuid4(), company_id=company.id, name="Grp4")
        db_session.add_all([company, group])
        db_session.flush()

        user = create_test_user(db_session, company.id)
        cat_id = uuid4()

        decision = create_test_decision(
            db_session, company.id, group.id, user.id,
            category_id=cat_id, financial_impact=Decimal("75000"),
        )

        rule = ApprovalRoutingRule(
            company_id=company.id, category="budget",
            condition_field="financial_impact", operator=Operator.GTE,
            condition_value="50000", inserted_role="legal",
            insert_position=InsertPosition.APPEND, priority=1, active=False,
        )
        db_session.add(rule)
        db_session.flush()

        base_levels = [{"level": 1, "role": "manager"}, {"level": 2, "role": "director"}]

        result = ApprovalRoutingService.resolve_approval_chain(
            db_session, decision, base_levels, "budget",
        )

        assert len(result) == 2


# ─── Test: Benchmarking ─────────────────────────────────────────────────

class TestBenchmarkService:
    def test_insufficient_data(self, db_session):
        """Should return insufficient_data when fewer than 3 similar decisions."""
        company = Company(id=uuid4(), name="Bench Co")
        group = Group(id=uuid4(), company_id=company.id, name="Test Group")
        db_session.add_all([company, group])
        db_session.flush()

        user = create_test_user(db_session, company.id)
        cat_id = uuid4()

        # Only 2 decisions
        create_test_decision(db_session, company.id, group.id, user.id,
                           category_id=cat_id, status=DecisionStatus.APPROVED)
        create_test_decision(db_session, company.id, group.id, user.id,
                           category_id=cat_id, status=DecisionStatus.APPROVED)

        result = BenchmarkService.compute_benchmark(
            db_session, company.id, cat_id, 25000
        )

        assert result["insufficient_data"] is True
        assert result["similar_decision_count"] == 2
        assert result["avg_cost"] is None

    def test_sufficient_data(self, db_session):
        """Should compute averages when >= 3 similar decisions exist."""
        company = Company(id=uuid4(), name="Bench Co 2")
        group = Group(id=uuid4(), company_id=company.id, name="Test Group 2")
        db_session.add_all([company, group])
        db_session.flush()

        user = create_test_user(db_session, company.id)
        cat_id = uuid4()

        for cost in [10000, 20000, 30000]:
            create_test_decision(db_session, company.id, group.id, user.id,
                               category_id=cat_id, status=DecisionStatus.APPROVED,
                               financial_impact=cost)

        result = BenchmarkService.compute_benchmark(
            db_session, company.id, cat_id, 25000
        )

        assert result["insufficient_data"] is False
        assert result["similar_decision_count"] == 3
        assert result["avg_cost"] == 20000.0
        assert result["delta_pct"] == 25.0  # (25000 - 20000) / 20000 * 100

    def test_category_trends(self, db_session):
        """Should return per-category trends."""
        company = Company(id=uuid4(), name="Bench Co 3")
        group = Group(id=uuid4(), company_id=company.id, name="Test Group 3")
        db_session.add_all([company, group])
        db_session.flush()

        user = create_test_user(db_session, company.id)
        cat_id = uuid4()

        for cost in [5000, 15000, 25000]:
            create_test_decision(db_session, company.id, group.id, user.id,
                               category_id=cat_id, status=DecisionStatus.APPROVED,
                               financial_impact=cost)

        trends = BenchmarkService.compute_category_trends(db_session, company.id, 12)

        # Should have at least one trend for our category
        assert len(trends) >= 1
        trend = next(t for t in trends if t["category_id"] == str(cat_id))
        assert trend["decision_count"] == 3
        assert trend["avg_cost"] == 15000.0
