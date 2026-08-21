"""
Expert Decision Replay Platform - Benchmark Service

Computes benchmark statistics for decisions in the same category,
enabling comparison of new decisions against historical data.
"""

import logging
from decimal import Decimal
from typing import Optional
from uuid import UUID
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.decision import Decision, DecisionStatus
from app.models.audit_log import AuditLog

logger = logging.getLogger("expert_decision")


class BenchmarkService:
    """Service for computing decision benchmarks and category trends."""

    @staticmethod
    def compute_benchmark(
        db: Session,
        company_id: UUID,
        category_id: UUID,
        financial_impact: Optional[float] = None,
    ) -> dict:
        """
        Compute benchmark statistics for decisions in the same category.
        
        Returns avg_cost, avg_approval_days, avg_alternatives, rejection_rate,
        similar_decision_count, and delta_pct if financial_impact provided.
        """
        # Query approved + archived decisions in same company + category
        decisions = (
            db.query(Decision)
            .filter(
                Decision.company_id == company_id,
                Decision.category_id == category_id,
                Decision.status.in_([DecisionStatus.APPROVED, DecisionStatus.ARCHIVED]),
            )
            .all()
        )

        similar_decision_count = len(decisions)

        if similar_decision_count < 3:
            return {
                "insufficient_data": True,
                "similar_decision_count": similar_decision_count,
                "avg_cost": None,
                "avg_approval_days": None,
                "avg_alternatives": None,
                "rejection_rate": None,
            }

        # Compute average financial impact
        costs = [float(d.financial_impact) for d in decisions if d.financial_impact is not None]
        avg_cost = sum(costs) / len(costs) if costs else 0

        # Compute average alternatives considered
        alt_counts = []
        for d in decisions:
            count = db.query(func.count()).filter(
                func.coalesce(None, 0) == 0  # placeholder
            ).scalar()
            # Count alternatives for each decision
            from app.models.alternative import Alternative
            alt_count = db.query(func.count(Alternative.id)).filter(
                Alternative.decision_id == d.id
            ).scalar()
            alt_counts.append(alt_count or 0)
        avg_alternatives = sum(alt_counts) / len(alt_counts) if alt_counts else 0

        # Compute average time-to-approval from audit logs
        approval_times = []
        for d in decisions:
            # Find submit and approve timestamps
            submit_log = (
                db.query(AuditLog)
                .filter(
                    AuditLog.entity_type == "decision",
                    AuditLog.entity_id == d.id,
                    AuditLog.action == "submit",
                )
                .order_by(AuditLog.created_at.asc())
                .first()
            )
            approve_log = (
                db.query(AuditLog)
                .filter(
                    AuditLog.entity_type == "decision",
                    AuditLog.entity_id == d.id,
                    AuditLog.action == "status_change",
                    AuditLog.new_value["status"].astext == "approved",
                )
                .order_by(AuditLog.created_at.asc())
                .first()
            )
            if submit_log and approve_log:
                delta = approve_log.created_at - submit_log.created_at
                approval_times.append(delta.total_seconds() / 86400)  # days

        avg_approval_days = sum(approval_times) / len(approval_times) if approval_times else 0

        # Compute rejection rate
        total_submitted = (
            db.query(func.count(Decision.id))
            .filter(
                Decision.company_id == company_id,
                Decision.category_id == category_id,
                Decision.status.in_([DecisionStatus.APPROVED, DecisionStatus.REJECTED]),
            )
            .scalar()
        )
        rejected = (
            db.query(func.count(Decision.id))
            .filter(
                Decision.company_id == company_id,
                Decision.category_id == category_id,
                Decision.status == DecisionStatus.REJECTED,
            )
            .scalar()
        )
        rejection_rate = (rejected / total_submitted * 100) if total_submitted > 0 else 0

        result = {
            "insufficient_data": False,
            "avg_cost": round(avg_cost, 2),
            "avg_approval_days": round(avg_approval_days, 1),
            "avg_alternatives": round(avg_alternatives, 1),
            "rejection_rate": round(rejection_rate, 1),
            "similar_decision_count": similar_decision_count,
        }

        # Add delta if current cost is provided
        if financial_impact is not None and avg_cost > 0:
            result["current_cost"] = round(float(financial_impact), 2)
            result["delta_pct"] = round(
                (float(financial_impact) - avg_cost) / avg_cost * 100, 1
            )
        else:
            result["current_cost"] = None
            result["delta_pct"] = None

        return result

    @staticmethod
    def compute_category_trends(
        db: Session,
        company_id: UUID,
        months: int = 12,
    ) -> list:
        """
        Compute per-category trends for the analytics view.
        Returns avg cost, approval time, and rejection rate per category.
        """
        from app.models.decision_category import DecisionCategory

        # Get all categories
        categories = db.query(DecisionCategory).all()

        cutoff_date = datetime.now(timezone.utc) - timedelta(days=months * 30)

        trends = []
        for cat in categories:
            # Get decisions in this category within the time range
            decisions = (
                db.query(Decision)
                .filter(
                    Decision.company_id == company_id,
                    Decision.category_id == cat.id,
                    Decision.created_at >= cutoff_date,
                )
                .all()
            )

            if not decisions:
                continue

            # Compute stats
            costs = [float(d.financial_impact) for d in decisions if d.financial_impact]
            avg_cost = sum(costs) / len(costs) if costs else 0

            approved = sum(1 for d in decisions if d.status == DecisionStatus.APPROVED)
            rejected = sum(1 for d in decisions if d.status == DecisionStatus.REJECTED)
            total_final = approved + rejected
            rejection_rate = (rejected / total_final * 100) if total_final > 0 else 0

            trends.append({
                "category_id": str(cat.id),
                "category_name": cat.name,
                "decision_count": len(decisions),
                "avg_cost": round(avg_cost, 2),
                "rejection_rate": round(rejection_rate, 1),
                "approved_count": approved,
                "rejected_count": rejected,
            })

        return trends
