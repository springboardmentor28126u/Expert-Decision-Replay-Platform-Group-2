# services/problem_statement_service.py
"""
services/problem_statement_service.py

Draft-assistance only: turns a decision title into a suggested problem
statement so a user has a starting point to edit. Never touches the
database — this service has no repository, creates nothing, and saves
nothing; the caller is responsible for putting the returned text in
front of a human to review before it's used anywhere.
"""

from __future__ import annotations

from app.services import llm_client

_UNAVAILABLE_TEXT = (
    "AI-generated problem statements are temporarily unavailable. "
    "Please write the problem statement yourself for now."
)


class ProblemStatementService:

    async def generate(self, title: str) -> tuple[str, str]:
        """Returns (problem_statement, generated_by)."""

        prompt = self._build_prompt(title)
        text, provider = await llm_client.generate_text_with_provider(prompt)

        if text and provider:
            return text, provider

        return _UNAVAILABLE_TEXT, "unavailable"

    @staticmethod
    def _build_prompt(title: str) -> str:
        return (
            "Based on this decision title, write a clear, professional "
            "problem statement (2-3 sentences) explaining what issue or need "
            "this decision addresses. This is a draft starting point for a "
            "human to review and edit — be reasonable and appropriately "
            "generic if the title alone doesn't give much detail. Do not "
            "invent specific facts, numbers, or names that aren't implied by "
            "the title.\n\n"
            f"Title: {title}\n\n"
            "Problem Statement:"
        )
