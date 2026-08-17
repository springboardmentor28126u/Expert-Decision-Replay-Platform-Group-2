# services/decision_summary_service.py
"""
services/decision_summary_service.py

Composes a natural-language summary of a Decision from its existing
data (problem statement, alternatives, approval chain, comment count,
revision history) — no new tables, no new columns.

Always computes a deterministic (template) summary first, then tries
to hand that same structured context to Gemini for a more fluent
rewrite. If Gemini is unconfigured or the call fails for any reason,
the deterministic summary is returned as-is — the endpoint never
errors out because the LLM is unavailable.
"""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.approval_repository import ApprovalRepository
from app.repositories.comment_repository import CommentRepository
from app.repositories.decision_repository import DecisionRepository
from app.repositories.decision_version_repository import DecisionVersionRepository
from app.schemas.decision_summary import ApprovalProgressEntry, DecisionSummaryOut
from app.services import llm_client
from app.utils.exceptions import NotFoundException


class DecisionSummaryService:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.decisions = DecisionRepository(db)
        self.approvals = ApprovalRepository(db)
        self.comments = CommentRepository(db)
        self.versions = DecisionVersionRepository(db)

    async def get_summary(self, decision_id: uuid.UUID) -> DecisionSummaryOut:

        decision = await self.decisions.get_by_id(decision_id)

        if decision is None:
            raise NotFoundException("Decision not found.")

        approvals = await self.approvals.list_by_decision(decision_id)
        comments = await self.comments.list_for_decision(decision_id)
        versions = await self.versions.get_versions(decision_id)

        active_alternatives = [a for a in decision.alternatives if not a.is_deleted]
        selected = next((a for a in active_alternatives if a.is_selected), None)

        approval_progress = [
            ApprovalProgressEntry(
                level=a.level,
                reviewer_name=a.reviewer.full_name if a.reviewer else "Unassigned",
                status=a.status.value,
                comments=a.comments,
            )
            for a in approvals
        ]

        deterministic_summary = self._build_deterministic_summary(
            decision=decision,
            active_alternatives=active_alternatives,
            selected=selected,
            approval_progress=approval_progress,
            total_comments=len(comments),
            revision_count=len(versions),
        )

        prompt = self._build_prompt(deterministic_summary, decision)
        llm_summary, provider = await llm_client.generate_text_with_provider(prompt)

        return DecisionSummaryOut(
            decision_id=decision.id,
            title=decision.title,
            status=decision.status.value,
            category=decision.category,
            summary=llm_summary or deterministic_summary,
            generated_by=provider or "deterministic",
            total_alternatives=len(active_alternatives),
            selected_alternative=selected.title if selected else None,
            approval_progress=approval_progress,
            revision_count=len(versions),
            total_comments=len(comments),
        )

    @staticmethod
    def _build_deterministic_summary(
        *,
        decision,
        active_alternatives,
        selected,
        approval_progress: list[ApprovalProgressEntry],
        total_comments: int,
        revision_count: int,
    ) -> str:

        lines = [
            f'"{decision.title}" ({decision.category or "Uncategorized"}) is currently '
            f"{decision.status.value.replace('_', ' ')}.",
            decision.problem_statement.strip(),
        ]

        if active_alternatives:
            names = ", ".join(a.title for a in active_alternatives)
            lines.append(f"{len(active_alternatives)} alternative(s) considered: {names}.")

        if selected is not None:
            lines.append(f'Selected alternative: "{selected.title}".')

        if decision.decision_rationale:
            lines.append(f"Rationale: {decision.decision_rationale.strip()}")

        if approval_progress:
            steps = "; ".join(
                f"Level {p.level} ({p.reviewer_name}): {p.status}"
                for p in approval_progress
            )
            lines.append(f"Approval progress — {steps}.")

        lines.append(
            f"{revision_count} revision(s) recorded; {total_comments} comment(s) posted."
        )

        return " ".join(lines)

    @staticmethod
    def _build_prompt(deterministic_summary: str, decision) -> str:
        return (
            "Rewrite the following decision-record facts as a concise, "
            "professional 3-5 sentence executive summary. Do not invent "
            "facts that are not present below. Do not use markdown.\n\n"
            f"Facts:\n{deterministic_summary}"
        )
