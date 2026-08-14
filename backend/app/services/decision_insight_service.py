# services/decision_insight_service.py
"""
services/decision_insight_service.py

Two small Gemini-backed decision insights, both read-only and both
built the same way as decision_summary_service: fetch data through
existing repositories, hand a grounded prompt to llm_client, and
degrade to a safe deterministic behavior if the LLM is unconfigured
or fails. Neither of these ever constructs or executes SQL from model
output — "similar decisions" only ever returns rows already fetched
via DecisionRepository.list_by_category, and "ask" only ever returns
free text, never a database query.
"""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.approval_repository import ApprovalRepository
from app.repositories.comment_repository import CommentRepository
from app.repositories.decision_repository import DecisionRepository
from app.schemas.decision_insight import SimilarDecisionOut
from app.services import llm_client
from app.utils.exceptions import NotFoundException

_SIMILAR_CANDIDATE_LIMIT = 20
_SIMILAR_RESULT_LIMIT = 3


class DecisionInsightService:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.decisions = DecisionRepository(db)
        self.approvals = ApprovalRepository(db)
        self.comments = CommentRepository(db)

    # --------------------------------------------------
    # Similar decisions
    # --------------------------------------------------

    async def find_similar(self, decision_id: uuid.UUID) -> list[SimilarDecisionOut]:

        decision = await self.decisions.get_by_id(decision_id)

        if decision is None:
            raise NotFoundException("Decision not found.")

        if not decision.category:
            return []

        candidates = await self.decisions.list_by_category(
            decision.category,
            exclude_id=decision_id,
            limit=_SIMILAR_CANDIDATE_LIMIT,
        )

        if not candidates:
            return []

        prompt = self._build_similar_prompt(decision, candidates)
        raw = await llm_client.generate_text(prompt)

        selected = (
            self._parse_similar_selection(raw, candidates)
            if raw is not None
            else candidates[:_SIMILAR_RESULT_LIMIT]
        )

        return [
            SimilarDecisionOut(
                id=d.id,
                title=d.title,
                status=d.status.value,
                category=d.category,
            )
            for d in selected
        ]

    @staticmethod
    def _build_similar_prompt(decision, candidates) -> str:
        candidates_text = "\n".join(
            f"ID {c.id}: {c.title} — Status: {c.status.value} — "
            f"Problem: {c.problem_statement[:150]}"
            for c in candidates
        )
        return (
            "Here is a new decision:\n"
            f"Title: {decision.title}\n"
            f"Problem: {decision.problem_statement}\n\n"
            "Here is a list of past decisions in the same category:\n"
            f"{candidates_text}\n\n"
            f"Pick up to {_SIMILAR_RESULT_LIMIT} decisions from the list above "
            "that are most similar to the new one. Reply with ONLY a "
            "comma-separated list of their ID values, nothing else. "
            "If none are similar, reply: none"
        )

    @staticmethod
    def _parse_similar_selection(raw: str, candidates) -> list:
        text = raw.strip()

        if text.lower() == "none":
            return []

        ids: list[uuid.UUID] = []
        for chunk in text.split(","):
            try:
                ids.append(uuid.UUID(chunk.strip()))
            except ValueError:
                continue

        if not ids:
            return candidates[:_SIMILAR_RESULT_LIMIT]

        by_id = {c.id: c for c in candidates}
        selected = [by_id[i] for i in ids if i in by_id]

        return selected[:_SIMILAR_RESULT_LIMIT] if selected else candidates[:_SIMILAR_RESULT_LIMIT]

    # --------------------------------------------------
    # Ask about this decision
    # --------------------------------------------------

    async def answer_question(
        self,
        decision_id: uuid.UUID,
        question: str,
    ) -> tuple[str, str]:
        """Returns (answer, generated_by)."""

        decision = await self.decisions.get_by_id(decision_id)

        if decision is None:
            raise NotFoundException("Decision not found.")

        comments = await self.comments.list_for_decision(decision_id)
        approvals = await self.approvals.list_by_decision(decision_id)

        discussion_text = "\n".join(
            f"{c.author.full_name if c.author else 'Unknown'}: {c.content}"
            for c in comments
        ) or "No discussion recorded."

        approvals_text = "\n".join(
            f"Level {a.level} "
            f"({a.reviewer.full_name if a.reviewer else 'Unassigned'}): "
            f"{a.status.value}" + (f" — {a.comments}" if a.comments else "")
            for a in approvals
        ) or "No approval actions recorded yet."

        prompt = (
            "You are answering questions about one specific organizational "
            "decision. Use ONLY the information provided below. If the "
            "answer isn't in this information, say so honestly — do not "
            "guess or make anything up.\n\n"
            f"Decision Title: {decision.title}\n"
            f"Status: {decision.status.value}\n"
            f"Category: {decision.category or 'Uncategorized'}\n"
            f"Problem Statement: {decision.problem_statement}\n\n"
            f"Discussion Thread:\n{discussion_text}\n\n"
            f"Approval History:\n{approvals_text}\n\n"
            f"Question: {question}\n\n"
            "Answer clearly and concisely, in plain language:"
        )

        answer = await llm_client.generate_text(prompt)

        if answer:
            return answer, "gemini"

        return (
            "AI-powered answers are temporarily unavailable. Please check "
            "the Discussion and Approval History tabs directly.",
            "unavailable",
        )
