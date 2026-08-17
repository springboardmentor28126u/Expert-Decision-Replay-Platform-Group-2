# services/nl_query_service.py
"""
services/nl_query_service.py

Natural-language querying over decision/approval data.

By design this NEVER executes model-generated SQL or free-form
queries. A free-text question is classified into one of a small,
fixed set of whitelisted intents — each intent maps 1:1 to an
existing, already-reviewed repository method (the same ones
DashboardService/ReportService call). Gemini (when configured) is
used only for the classification step, to turn phrasing variation
into one of those fixed intents; if it's unavailable or returns
something outside the whitelist, a deterministic keyword classifier
takes over. Either way, the only thing that ever touches the database
is a parameterized call to a method that already existed before this
feature.
"""

from __future__ import annotations

import json
import re

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.approval_repository import ApprovalRepository
from app.repositories.decision_repository import DecisionRepository
from app.schemas.nl_query import NLQueryResponse
from app.services import llm_client

_INTENTS = {
    "decision_status_counts",
    "approval_status_counts",
    "category_breakdown",
    "search_decisions",
    "total_decisions",
    "top_creators",
    "unknown",
}

_HELP_TEXT = (
    "I can answer questions about decision status counts, approval status "
    "counts, category breakdowns, total decisions, top decision creators, "
    'or searches like "find decisions about budget".'
)


class NLQueryService:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.decisions = DecisionRepository(db)
        self.approvals = ApprovalRepository(db)

    async def answer(self, question: str) -> NLQueryResponse:

        intent, keyword, source = await self._classify(question)
        data, answer_text = await self._dispatch(intent, keyword)

        return NLQueryResponse(
            question=question,
            intent=intent,
            answer=answer_text,
            data=data,
            interpreted_by=source,
        )

    # --------------------------------------------------
    # Classification
    # --------------------------------------------------

    async def _classify(self, question: str) -> tuple[str, str | None, str]:

        llm_result = await self._classify_with_llm(question)

        if llm_result is not None:
            intent, keyword, provider = llm_result
            return intent, keyword, provider

        intent, keyword = self._classify_with_keywords(question)
        return intent, keyword, "deterministic"

    @staticmethod
    async def _classify_with_llm(question: str) -> tuple[str, str | None, str] | None:

        prompt = (
            "Classify the question into exactly one intent from this fixed "
            "list: decision_status_counts, approval_status_counts, "
            "category_breakdown, search_decisions, total_decisions, "
            "top_creators, unknown. If the intent is search_decisions, also "
            "extract the search keyword the user is looking for. "
            'Respond with ONLY compact JSON, no markdown, no extra text: '
            '{"intent": "<intent>", "keyword": "<keyword or null>"}\n\n'
            f'Question: "{question}"'
        )

        raw, provider = await llm_client.generate_text_with_provider(prompt)

        if raw is None:
            return None

        cleaned = raw.strip()
        cleaned = re.sub(r"^```(?:json)?|```$", "", cleaned, flags=re.MULTILINE).strip()

        try:
            parsed = json.loads(cleaned)
            intent = parsed.get("intent")
            keyword = parsed.get("keyword")
        except (json.JSONDecodeError, AttributeError):
            return None

        if intent not in _INTENTS:
            return None

        return intent, (keyword or None), provider

    @staticmethod
    def _classify_with_keywords(question: str) -> tuple[str, str | None]:

        q = question.lower()

        if "categor" in q:
            return "category_breakdown", None

        if "approval" in q or "review" in q:
            return "approval_status_counts", None

        if "top" in q and ("creator" in q or "user" in q or "employee" in q):
            return "top_creators", None

        if any(word in q for word in ("search", "find", "about", "containing")):
            match = re.search(r"(?:about|for|containing|named)\s+(.+)$", q)
            keyword = match.group(1).strip(" ?.!") if match else None
            return "search_decisions", keyword

        if "total" in q or "how many decisions" in q or "status" in q:
            return "decision_status_counts", None

        return "unknown", None

    # --------------------------------------------------
    # Dispatch — the only place that touches the database
    # --------------------------------------------------

    async def _dispatch(self, intent: str, keyword: str | None):

        if intent == "decision_status_counts":
            counts = await self.decisions.count_by_status()
            data = {status.value: count for status, count in counts.items()}
            if not data:
                return data, "No decisions have been recorded yet."
            phrase = ", ".join(f"{v} {k.replace('_', ' ')}" for k, v in data.items())
            return data, f"Decision status breakdown: {phrase}."

        if intent == "approval_status_counts":
            counts = await self.approvals.count_by_status()
            data = {status.value: count for status, count in counts.items()}
            if not data:
                return data, "No approvals have been recorded yet."
            phrase = ", ".join(f"{v} {k}" for k, v in data.items())
            return data, f"Approval status breakdown: {phrase}."

        if intent == "category_breakdown":
            counts = await self.decisions.count_by_category()
            data = {(k or "Uncategorized"): v for k, v in counts.items()}
            if not data:
                return data, "No decisions have been recorded yet."
            phrase = ", ".join(f"{v} in {k}" for k, v in data.items())
            return data, f"Decisions by category: {phrase}."

        if intent == "search_decisions":
            if not keyword:
                return [], 'Please include a keyword, e.g. "find decisions about budget".'
            results = await self.decisions.search(keyword=keyword, offset=0, limit=10)
            data = [
                {"id": str(d.id), "title": d.title, "status": d.status.value}
                for d in results
            ]
            if not results:
                return data, f'No decisions found matching "{keyword}".'
            titles = "; ".join(d.title for d in results)
            return data, f'Found {len(results)} decision(s) matching "{keyword}": {titles}.'

        if intent == "total_decisions":
            total = await self.decisions.count()
            return {"total": total}, f"There are {total} decision(s) in total."

        if intent == "top_creators":
            rows = await self.decisions.count_by_creator(limit=5)
            data = [
                {"user_id": str(user_id), "full_name": full_name, "count": count}
                for user_id, full_name, count in rows
            ]
            if not rows:
                return data, "No decisions have been created yet."
            phrase = ", ".join(f"{name} ({count})" for _, name, count in rows)
            return data, f"Top decision creators: {phrase}."

        return None, _HELP_TEXT
