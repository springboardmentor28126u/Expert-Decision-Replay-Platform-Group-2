# services/approval_intelligence_service.py
"""
services/approval_intelligence_service.py

Read-only AI recommendation for a decision's approval — built the same
way as decision_summary_service/decision_insight_service: fetch real
data through existing repositories, hand a grounded prompt to
llm_client (Gemini, falling back to Groq), and degrade to a
deterministic "needs_review" response if both providers are
unconfigured or fail.

This service never writes to the database. It has no code path that
creates/updates an Approval, changes a Decision's status, or assigns a
reviewer — the LLM's output is parsed into a recommendation string and
returned to the caller for a human to act on, nothing more. The prompt
itself also tells the model its output is advisory only, not an
authorization to take any action.
"""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alternative import Alternative
from app.models.approval import Approval
from app.models.comment import Comment
from app.repositories.approval_repository import ApprovalRepository
from app.repositories.comment_repository import CommentRepository
from app.repositories.decision_repository import DecisionRepository
from app.schemas.approval_intelligence import ApprovalRecommendationOut
from app.services import llm_client
from app.utils.exceptions import NotFoundException

_RECOMMENDATION_MAP = {
    "approve": "approve",
    "reject": "reject",
    "needs review": "needs_review",
    "needs_review": "needs_review",
}

_UNAVAILABLE_REASONING = (
    "AI recommendations are temporarily unavailable. Please review the "
    "problem statement, alternatives, discussion, and approval history "
    "directly before deciding."
)


class ApprovalIntelligenceService:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.decisions = DecisionRepository(db)
        self.approvals = ApprovalRepository(db)
        self.comments = CommentRepository(db)

    async def get_recommendation(self, decision_id: uuid.UUID) -> ApprovalRecommendationOut:

        decision = await self.decisions.get_by_id(decision_id)

        if decision is None:
            raise NotFoundException("Decision not found.")

        active_alternatives = [a for a in decision.alternatives if not a.is_deleted]
        comments = await self.comments.list_for_decision(decision_id)
        approvals = await self.approvals.list_by_decision(decision_id)

        prompt = self._build_prompt(decision, active_alternatives, comments, approvals)
        raw_text, provider = await llm_client.generate_text_with_provider(prompt)

        if raw_text is None or provider is None:
            return ApprovalRecommendationOut(
                decision_id=decision_id,
                recommendation="needs_review",
                reasoning=_UNAVAILABLE_REASONING,
                generated_by="deterministic",
            )

        recommendation, reasoning = self._parse_recommendation(raw_text)

        return ApprovalRecommendationOut(
            decision_id=decision_id,
            recommendation=recommendation,
            reasoning=reasoning,
            generated_by=provider,
        )

    @staticmethod
    def _build_prompt(
        decision,
        alternatives: list[Alternative],
        comments: list[Comment],
        approvals: list[Approval],
    ) -> str:

        alternatives_text = "\n".join(
            "- "
            + a.title
            + (f" — Cost: {a.cost_estimate}" if a.cost_estimate is not None else "")
            + (f", Risk: {a.risk_assessment}" if a.risk_assessment else "")
            + (f", Feasibility: {a.feasibility_score}/10" if a.feasibility_score is not None else "")
            + (f". {a.description}" if a.description else "")
            for a in alternatives
        ) or "None recorded."

        discussion_text = "\n".join(
            f"{c.author.full_name if c.author else 'Unknown'}: {c.content}"
            for c in comments
        ) or "No discussion recorded."

        approvals_text = "\n".join(
            f"Level {a.level} ({a.reviewer.full_name if a.reviewer else 'Unassigned'}): "
            f"{a.status.value}" + (f" — {a.comments}" if a.comments else "")
            for a in approvals
        ) or "No approval actions recorded yet."

        return (
            "You are assisting a human reviewer, manager, or administrator who "
            "is evaluating an organizational decision. Your response is ONLY a "
            "recommendation for that human to consider — it is not an approval "
            "or rejection, it does not authorize any action, and nothing will "
            "happen automatically because of your answer. The human reviewer "
            "retains full authority and must independently decide whether to "
            "approve or reject this decision.\n\n"
            f"Decision Title: {decision.title}\n"
            f"Category: {decision.category or 'Uncategorized'}\n"
            f"Current Status: {decision.status.value}\n"
            f"Problem Statement: {decision.problem_statement}\n\n"
            f"Alternatives Considered:\n{alternatives_text}\n\n"
            f"Discussion:\n{discussion_text}\n\n"
            f"Approval History (current state):\n{approvals_text}\n\n"
            "Based ONLY on the information above, respond in exactly this "
            "format:\n"
            "Recommendation: Approve OR Reject OR Needs Review\n"
            "Reasoning:\n"
            "- (bullet point)\n"
            "- (bullet point)\n"
            "- (bullet point, optional)\n\n"
            'Choose "Needs Review" if the information above is too thin to '
            "make a confident recommendation — do not guess or invent facts "
            "not stated above."
        )

    @staticmethod
    def _parse_recommendation(raw_text: str) -> tuple[str, str]:
        """
        Best-effort parse of the model's `Recommendation: ... / Reasoning: ...`
        format. Never raises — if the model didn't follow the format, the
        whole response becomes the reasoning and the recommendation defaults
        to "needs_review" rather than guessing.
        """

        lines = raw_text.strip().splitlines()
        recommendation = "needs_review"
        reasoning_start = 0

        for i, line in enumerate(lines):
            if line.strip().lower().startswith("recommendation:"):
                value = line.split(":", 1)[1].strip().lower()
                recommendation = _RECOMMENDATION_MAP.get(value, "needs_review")
                reasoning_start = i + 1
                break

        reasoning = "\n".join(lines[reasoning_start:]).strip()
        if reasoning.lower().startswith("reasoning:"):
            reasoning = reasoning.split(":", 1)[1].strip()

        if not reasoning:
            reasoning = raw_text.strip()

        return recommendation, reasoning
