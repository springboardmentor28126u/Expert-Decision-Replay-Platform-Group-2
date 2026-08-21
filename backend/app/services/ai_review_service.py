import json
from app.core.config import settings


def _get_client():
    """Lazily create and return an OpenAI client if an API key is configured.

    Returns None when no API key is present so callers can handle that case
    without import-time failures.
    """
    key = getattr(settings, "OPENROUTER_API_KEY", None) or getattr(settings, "OPENAI_API_KEY", None)
    if not key:
        return None
    try:
        from openai import OpenAI
    except Exception as e:
        # Explicit runtime error so callers get a clear message instead of an
        # import-time stack trace.
        raise RuntimeError("OpenAI client package not installed: install 'openai'") from e

    return OpenAI(base_url="https://openrouter.ai/api/v1", api_key=key)

PROMPT_TEMPLATE = """You are an assistant helping a reviewer check an organizational decision record for completeness.
You are NOT approving or rejecting anything — you only flag what's missing or weak so the human reviewer can look closer.

Decision Title: {title}
Category: {category}
Problem Statement: {description}
Number of documents attached: {doc_count}

For each of the following 5 areas, respond with a status of exactly one of: "complete", "incomplete", or "missing",
plus a short one-sentence note explaining why.

1. problem_statement
2. alternatives   (Note: alternative options data was not passed in yet — mark as "missing" if none was given)
3. cost_analysis
4. risk_mitigation
5. supporting_documents

Respond ONLY with valid JSON, no markdown, no preamble, in this exact shape:
{{
  "problem_statement": {{"status": "...", "note": "..."}},
  "alternatives": {{"status": "...", "note": "..."}},
  "cost_analysis": {{"status": "...", "note": "..."}},
  "risk_mitigation": {{"status": "...", "note": "..."}},
  "supporting_documents": {{"status": "...", "note": "..."}},
  "overall_summary": "..."
}}
"""


def run_ai_review(decision, doc_count: int) -> dict:
    prompt = PROMPT_TEMPLATE.format(
        title=decision.title,
        category=decision.category,
        description=decision.description,
        doc_count=doc_count,
    )

    client = _get_client()
    if client is None:
        raise RuntimeError("AI key not configured. Set OPENROUTER_API_KEY or OPENAI_API_KEY in your environment to enable AI reviews.")

    try:
        response = client.chat.completions.create(
            model="openrouter/free",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            timeout=20,
        )
    except Exception as e:
        error_msg = str(e).lower()
        if "timeout" in error_msg or "deadline" in error_msg:
            raise TimeoutError("AI review timed out. Please try again.")
        if "429" in error_msg or "quota" in error_msg or "rate" in error_msg:
            raise RuntimeError("AI service rate limit reached. Please wait a minute and try again.")
        raise ConnectionError(f"Could not reach AI service: {e}")

    raw_text = response.choices[0].message.content
    raw_text = raw_text.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        raise ValueError("AI response was not valid JSON: " + raw_text)