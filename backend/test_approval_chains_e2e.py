"""
End-to-End Verification Test for Approval Chain Configuration Feature.
Verifies all 4 verification scenarios from requirements:
1. Admin creates chain config for 'Finance' -> Manager -> Admin, 48hr SLA.
2. Employee submits decision with category 'Finance' -> 2 Approval rows created (L1: Manager, L2: Admin).
3. Employee submits decision with unconfigured category -> actionable specific error returned.
4. Cross-company isolation -> Admin of Company B gets 403 trying to access Company A's chains.
"""

import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database.session import get_db, engine
from app.database.base import Base
from app.models.user import User, UserRole, UserStatus
from app.models.company import Company
from app.models.group import Group
from app.models.membership import Membership, CompanyRole
from app.models.group_membership import GroupMembership
from app.models.decision_category import DecisionCategory
from app.models.approval import Approval, ApprovalStatus
from app.models.approval_chain import ApprovalChainConfig
from app.core.security import create_access_token, hash_password

client = TestClient(app)


def test_approval_chain_feature_end_to_end():
    # Setup test DB tables
    Base.metadata.create_all(bind=engine)

    from app.database.session import SessionLocal
    db: Session = SessionLocal()

    try:
        # Create Company A
        comp_a = Company(name="Test Company A", slug=f"comp-a-{uuid4().hex[:6]}")
        db.add(comp_a)
        db.flush()

        # Create Company B (for cross-tenant test)
        comp_b = Company(name="Test Company B", slug=f"comp-b-{uuid4().hex[:6]}")
        db.add(comp_b)
        db.flush()

        # Create Category: Finance, HR
        cat_finance = db.query(DecisionCategory).filter(DecisionCategory.name == "Finance").first()
        if not cat_finance:
            cat_finance = DecisionCategory(name="Finance", description="Finance category")
            db.add(cat_finance)

        cat_hr = db.query(DecisionCategory).filter(DecisionCategory.name == "HR").first()
        if not cat_hr:
            cat_hr = DecisionCategory(name="HR", description="HR category")
            db.add(cat_hr)
        db.flush()

        # Users in Company A
        admin_a = User(full_name="Admin A", email=f"admin_a_{uuid4().hex[:6]}@test.com", password_hash=hash_password("pass"), role=UserRole.ADMIN)
        manager_a = User(full_name="Manager A", email=f"mgr_a_{uuid4().hex[:6]}@test.com", password_hash=hash_password("pass"), role=UserRole.MANAGER)
        employee_a = User(full_name="Employee A", email=f"emp_a_{uuid4().hex[:6]}@test.com", password_hash=hash_password("pass"), role=UserRole.EMPLOYEE)

        # Users in Company B
        admin_b = User(full_name="Admin B", email=f"admin_b_{uuid4().hex[:6]}@test.com", password_hash=hash_password("pass"), role=UserRole.ADMIN)

        db.add_all([admin_a, manager_a, employee_a, admin_b])
        db.flush()

        # Memberships in Company A
        db.add(Membership(user_id=admin_a.id, company_id=comp_a.id, role=CompanyRole.ADMIN))
        db.add(Membership(user_id=manager_a.id, company_id=comp_a.id, role=CompanyRole.MANAGER))
        db.add(Membership(user_id=employee_a.id, company_id=comp_a.id, role=CompanyRole.EMPLOYEE))

        # Membership in Company B
        db.add(Membership(user_id=admin_b.id, company_id=comp_b.id, role=CompanyRole.ADMIN))

        # Group in Company A
        grp_a = Group(company_id=comp_a.id, name="Finance Team", owner_id=admin_a.id)
        db.add(grp_a)
        db.flush()

        # Group Membership
        db.add(GroupMembership(group_id=grp_a.id, user_id=admin_a.id))
        db.add(GroupMembership(group_id=grp_a.id, user_id=manager_a.id))
        db.add(GroupMembership(group_id=grp_a.id, user_id=employee_a.id))

        db.commit()

        # Helper headers
        token_admin_a = create_access_token({"sub": str(admin_a.id), "type": "access"})
        headers_admin_a = {"Authorization": f"Bearer {token_admin_a}", "X-Company-ID": str(comp_a.id)}

        token_emp_a = create_access_token({"sub": str(employee_a.id), "type": "access"})
        headers_emp_a = {"Authorization": f"Bearer {token_emp_a}", "X-Company-ID": str(comp_a.id)}

        token_admin_b = create_access_token({"sub": str(admin_b.id), "type": "access"})
        headers_admin_b = {"Authorization": f"Bearer {token_admin_b}", "X-Company-ID": str(comp_b.id)}

        # -------------------------------------------------------------
        # PART 4.1 — As Admin: create chain config for "Finance" -> Manager -> Admin, 48hr SLA
        # -------------------------------------------------------------
        res = client.post(
            f"/api/v1/companies/{comp_a.id}/approval-chains",
            json={
                "category": "Finance",
                "levels": [
                    {"level": 1, "role": "manager"},
                    {"level": 2, "role": "admin"}
                ],
                "sla_hours": 48
            },
            headers=headers_admin_a
        )
        assert res.status_code == 201, f"Create chain failed: {res.text}"
        chain_data = res.json()
        chain_id = chain_data["id"]
        assert chain_data["category"] == "Finance"
        assert len(chain_data["levels"]) == 2
        assert chain_data["sla_hours"] == 48
        print("\n[VERIFICATION 1 PASSED] Admin created Finance approval chain: Manager -> Admin, 48h SLA.")

        # -------------------------------------------------------------
        # PART 4.2 — As Employee: create decision with category="Finance", 2 alternatives, submit
        # -------------------------------------------------------------
        # Create decision
        res_dec = client.post(
            "/api/v1/decisions",
            json={
                "title": "Purchase New Accounting Software",
                "problem_statement": "The current accounting software is outdated and slow.",
                "category_id": str(cat_finance.id),
                "group_id": str(grp_a.id),
                "impact_level": "high"
            },
            headers=headers_emp_a
        )
        assert res_dec.status_code == 201, f"Create decision failed: {res_dec.text}"
        dec_id = res_dec.json()["id"]

        # Add Alternative 1 (Recommended)
        res_alt1 = client.post(
            f"/api/v1/decisions/{dec_id}/alternatives",
            json={
                "title": "Software Option A",
                "description": "Cloud-based SaaS platform",
                "pros": ["Fast", "Modern"],
                "cons": ["Costly"],
                "is_recommended": True,
                "risk_level": "medium"
            },
            headers=headers_emp_a
        )
        assert res_alt1.status_code == 201

        # Add Alternative 2
        res_alt2 = client.post(
            f"/api/v1/decisions/{dec_id}/alternatives",
            json={
                "title": "Software Option B",
                "description": "On-premise solution",
                "pros": ["Secure"],
                "cons": ["Legacy"],
                "is_recommended": False,
                "risk_level": "low"
            },
            headers=headers_emp_a
        )
        assert res_alt2.status_code == 201

        # Submit decision
        res_sub = client.patch(
            f"/api/v1/decisions/{dec_id}/submit",
            headers=headers_emp_a
        )
        assert res_sub.status_code == 200, f"Submit decision failed: {res_sub.text}"
        assert res_sub.json()["status"] == "under_review"

        # Verify Approval rows in DB
        approvals = db.query(Approval).filter(Approval.decision_id == dec_id).order_by(Approval.level).all()
        assert len(approvals) == 2, f"Expected 2 approvals, found {len(approvals)}"
        assert approvals[0].level == 1
        assert approvals[0].approver_id == manager_a.id
        assert approvals[1].level == 2
        assert approvals[1].approver_id == admin_a.id
        print(f"[VERIFICATION 2 PASSED] Decision submitted. Approval rows match configured chain (L1: {manager_a.full_name}, L2: {admin_a.full_name}).")

        # -------------------------------------------------------------
        # PART 4.3 — Submit decision in category with NO config
        # -------------------------------------------------------------
        res_dec_hr = client.post(
            "/api/v1/decisions",
            json={
                "title": "New Hiring Policy",
                "problem_statement": "We need to revise remote work policy.",
                "category_id": str(cat_hr.id),
                "group_id": str(grp_a.id),
                "impact_level": "medium"
            },
            headers=headers_emp_a
        )
        dec_hr_id = res_dec_hr.json()["id"]

        client.post(
            f"/api/v1/decisions/{dec_hr_id}/alternatives",
            json={"title": "Policy 1", "pros": ["Flexible"], "cons": [], "is_recommended": True, "risk_level": "low"},
            headers=headers_emp_a
        )
        client.post(
            f"/api/v1/decisions/{dec_hr_id}/alternatives",
            json={"title": "Policy 2", "pros": ["Strict"], "cons": [], "is_recommended": False, "risk_level": "medium"},
            headers=headers_emp_a
        )

        # comp_a is created directly (not via CompanyService.create_company),
        # so it has NO default fallback chain — HR category must fail here.
        res_sub_hr = client.patch(
            f"/api/v1/decisions/{dec_hr_id}/submit",
            headers=headers_emp_a
        )
        assert res_sub_hr.status_code == 400, f"Expected 400 for unconfigured HR category, got {res_sub_hr.status_code}: {res_sub_hr.text}"

        # Explicitly remove any default fallback chain for comp_a to guarantee the
        # unconfigured-category error path is exercised:
        db.query(ApprovalChainConfig).filter(ApprovalChainConfig.company_id == comp_a.id, ApprovalChainConfig.category == "default").delete()
        db.commit()

        res_sub_unconfig = client.patch(
            f"/api/v1/decisions/{dec_hr_id}/submit",
            headers=headers_emp_a
        )
        assert res_sub_unconfig.status_code == 400
        err_detail = res_sub_unconfig.json()["detail"]
        assert "No approval chain configured for category 'HR'" in err_detail
        assert "Finance Team" in err_detail
        print(f"[VERIFICATION 3 PASSED] Unconfigured category returns specific error message: '{err_detail}'")

        # -------------------------------------------------------------
        # PART 4.4 — Cross-company access check (Admin B trying to edit/view Company A's chains)
        # -------------------------------------------------------------
        # Admin B tries to list Company A's chains
        res_cross_list = client.get(
            f"/api/v1/companies/{comp_a.id}/approval-chains",
            headers=headers_admin_b
        )
        assert res_cross_list.status_code == 403

        # Admin B tries to edit Company A's chain
        res_cross_edit = client.put(
            f"/api/v1/companies/{comp_a.id}/approval-chains/{chain_id}",
            json={"sla_hours": 12},
            headers={"Authorization": f"Bearer {token_admin_b}"}
        )
        assert res_cross_edit.status_code == 403

        # Admin B tries to delete Company A's chain
        res_cross_del = client.delete(
            f"/api/v1/companies/{comp_a.id}/approval-chains/{chain_id}",
            headers={"Authorization": f"Bearer {token_admin_b}"}
        )
        assert res_cross_del.status_code == 403
        # Admin A CAN update and delete its own company's chain (happy path)
        res_ok_edit = client.put(
            f"/api/v1/companies/{comp_a.id}/approval-chains/{chain_id}",
            json={"sla_hours": 12},
            headers=headers_admin_a
        )
        assert res_ok_edit.status_code == 200, f"Same-company update failed: {res_ok_edit.text}"
        assert res_ok_edit.json()["sla_hours"] == 12

        res_ok_del = client.delete(
            f"/api/v1/companies/{comp_a.id}/approval-chains/{chain_id}",
            headers=headers_admin_a
        )
        assert res_ok_del.status_code == 204, f"Same-company delete failed: {res_ok_del.text}"

        print("[VERIFICATION 4 PASSED] Admin from Company B blocked with 403 Forbidden from viewing/modifying Company A's approval chains.")

        # -------------------------------------------------------------
        # PART 4.5 — Approver resolution fallback (admin covers missing role)
        # -------------------------------------------------------------
        # Group with only an Admin + Employee (no Manager) — the 'manager'
        # level of a chain must fall back to the group's Admin member.
        grp_solo = Group(company_id=comp_a.id, name="Solo Team", owner_id=admin_a.id)
        db.add(grp_solo)
        db.flush()
        db.add(GroupMembership(group_id=grp_solo.id, user_id=admin_a.id))
        db.add(GroupMembership(group_id=grp_solo.id, user_id=employee_a.id))

        # Group with ONLY the employee — no one eligible even with fallback.
        grp_empty = Group(company_id=comp_a.id, name="Lonely Team", owner_id=employee_a.id)
        db.add(grp_empty)
        db.flush()
        db.add(GroupMembership(group_id=grp_empty.id, user_id=employee_a.id))
        db.commit()

        # Company-wide chain for HR -> manager only (no default chain exists in comp_a)
        res_hr_chain = client.post(
            f"/api/v1/companies/{comp_a.id}/approval-chains",
            json={
                "category": "HR",
                "levels": [{"level": 1, "role": "manager"}],
                "sla_hours": 24,
            },
            headers=headers_admin_a,
        )
        assert res_hr_chain.status_code == 201, f"Create HR chain failed: {res_hr_chain.text}"

        # Pre-check endpoint must report approver availability per group
        res_check_ok = client.get(
            f"/api/v1/companies/{comp_a.id}/approval-chains/check",
            params={"category": "HR", "group_id": str(grp_solo.id)},
            headers=headers_emp_a,
        )
        assert res_check_ok.status_code == 200
        body = res_check_ok.json()
        assert body["has_chain"] is True
        assert body["approver_ok"] is True, f"Expected approver_ok=True (admin fallback), got {body}"

        res_check_bad = client.get(
            f"/api/v1/companies/{comp_a.id}/approval-chains/check",
            params={"category": "HR", "group_id": str(grp_empty.id)},
            headers=headers_emp_a,
        )
        assert res_check_bad.status_code == 200
        body = res_check_bad.json()
        assert body["has_chain"] is True
        assert body["approver_ok"] is False, f"Expected approver_ok=False, got {body}"
        assert body["missing_role"] == "manager"

        def _make_decision(category, group, title):
            r = client.post(
                "/api/v1/decisions",
                json={
                    "title": title,
                    "problem_statement": "We need to verify approver resolution behavior end to end.",
                    "category_id": str(category.id),
                    "group_id": str(group.id),
                    "impact_level": "medium",
                },
                headers=headers_emp_a,
            )
            assert r.status_code == 201, f"Create decision failed: {r.text}"
            did = r.json()["id"]
            client.post(
                f"/api/v1/decisions/{did}/alternatives",
                json={"title": "Opt A", "description": "a", "pros": ["x"], "cons": [], "is_recommended": True, "risk_level": "low"},
                headers=headers_emp_a,
            )
            client.post(
                f"/api/v1/decisions/{did}/alternatives",
                json={"title": "Opt B", "description": "b", "pros": ["y"], "cons": [], "is_recommended": False, "risk_level": "low"},
                headers=headers_emp_a,
            )
            return did

        # Employee submits in Solo Team (no manager) -> admin must be the approver
        dec_solo = _make_decision(cat_hr, grp_solo, "Solo Team HR Decision")
        res_sub_solo = client.patch(f"/api/v1/decisions/{dec_solo}/submit", headers=headers_emp_a)
        assert res_sub_solo.status_code == 200, f"Admin fallback submit failed: {res_sub_solo.text}"
        approval_solo = db.query(Approval).filter(Approval.decision_id == dec_solo).first()
        assert approval_solo is not None
        assert approval_solo.approver_id == admin_a.id, (
            f"Expected admin fallback approver {admin_a.id}, got {approval_solo.approver_id}"
        )
        print(f"[VERIFICATION 5 PASSED] Manager level in admin-only group auto-assigned to Admin '{admin_a.full_name}' (fallback).")

        # Employee submits in Lonely Team (only themselves) -> clean 400 with group name
        dec_lonely = _make_decision(cat_hr, grp_empty, "Lonely Team HR Decision")
        res_sub_lonely = client.patch(f"/api/v1/decisions/{dec_lonely}/submit", headers=headers_emp_a)
        assert res_sub_lonely.status_code == 400, f"Expected 400 for empty group, got {res_sub_lonely.status_code}: {res_sub_lonely.text}"
        err_detail = res_sub_lonely.json()["detail"]
        assert "No eligible approvers for level 1 (role: manager)" in err_detail
        assert "Lonely Team" in err_detail
        print(f"[VERIFICATION 6 PASSED] No-approver group returns actionable error: '{err_detail}'")

    finally:
        db.close()
