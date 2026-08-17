import os

from dotenv import load_dotenv
from huggingface_hub import InferenceClient

from app.exceptions.handlers import NotFoundException

load_dotenv()


class AIService:
    """Service for AI-powered decision summaries using Hugging Face."""

    def __init__(self, db):
        self.db = db

        # Accept either environment variable name.
        hf_token = (
            os.getenv("HUGGINGFACE_API_KEY")
            or os.getenv("HF_TOKEN")
        )

        if not hf_token:
            raise RuntimeError(
                "HUGGINGFACE_API_KEY is not configured"
            )

        self.client = InferenceClient(
            api_key=hf_token,
            provider="auto",
        )

    def generate_decision_summary(self, decision_id: int):
        from app.models.decision import Decision

        # --------------------------------------------------
        # Find decision
        # --------------------------------------------------

        decision = (
            self.db.query(Decision)
            .filter(Decision.id == decision_id)
            .first()
        )

        if not decision:
            raise NotFoundException(
                "Decision not found"
            )

        # --------------------------------------------------
        # Get decision information safely
        # --------------------------------------------------

        title = getattr(
            decision,
            "title",
            ""
        ) or ""

        description = getattr(
            decision,
            "description",
            ""
        ) or ""

        rationale = getattr(
            decision,
            "rationale",
            ""
        ) or ""

        status = getattr(
            decision,
            "status",
            ""
        ) or ""

        # --------------------------------------------------
        # Build AI prompt
        # --------------------------------------------------

        prompt = f"""
You are an AI assistant for an Expert Decision
Replay Platform.

Create a concise professional summary of this
organizational decision.

Decision ID:
{decision_id}

Title:
{title}

Description:
{description}

Rationale:
{rationale}

Current Status:
{status}

Write the summary using these three sections:

1. Decision Overview
2. Key Considerations
3. Current Status

Rules:
- Keep the summary factual.
- Only use information provided above.
- Do not invent facts.
- Do not create a new recommendation.
- Do not add information from outside knowledge.
- Keep the entire summary under 250 words.
"""

        # --------------------------------------------------
        # Call Hugging Face
        # --------------------------------------------------

        try:
            response = self.client.chat.completions.create(
                model="meta-llama/Llama-3.1-8B-Instruct",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You summarize organizational "
                            "decision records accurately. "
                            "Never invent facts."
                        ),
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                max_tokens=350,
                temperature=0.2,
            )

            # --------------------------------------------------
            # Extract generated text
            # --------------------------------------------------

            summary = (
                response.choices[0]
                .message
                .content
            )

            if not summary:
                raise RuntimeError(
                    "AI returned an empty summary"
                )

            return {
                "decision_id": decision_id,
                "summary": summary.strip(),
            }

        except Exception as e:
            raise RuntimeError(
                f"AI summary generation failed: {str(e)}"
            )