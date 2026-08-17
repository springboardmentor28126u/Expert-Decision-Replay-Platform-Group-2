import os
from dotenv import load_dotenv
from google import genai
from pathlib import Path
from groq import Groq

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def safe_generate(prompt: str) -> str:
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        if not response.text:
            print("Gemini returned empty response. Trying Groq fallback...")
            return generate_with_groq(prompt)
        return response.text.strip()
    except Exception as e:
        print("Gemini error:", repr(e))
        if "RESOURCE_EXHAUSTED" in str(e) or "429" in str(e):
            print("Gemini rate-limited. Trying Groq fallback...")
            return generate_with_groq(prompt)
        return "AI_ERROR"


def generate_with_groq(prompt: str) -> str:
    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print("Groq fallback also failed:", repr(e))
        return "AI_RATE_LIMITED"

def summarize_decision(problem_statement: str, discussion_text: str = "") -> str:
    prompt = f"""Summarize this organizational decision in 2 short sentences.
Focus on: what the problem was, and what was decided or discussed.

Problem Statement: {problem_statement}

Discussion: {discussion_text if discussion_text else "No discussion yet."}

Summary:"""

    return safe_generate(prompt)

def find_similar_decisions(current_decision, candidates):
    candidates = [
        d for d in candidates
        if d.id != current_decision.id 
    ]

    if not candidates:
        return []

    candidates_text = "\n".join([
        f"ID {d.id}: {d.title} — Status: {d.status} — Problem: {d.problem_statement[:150]}"
        for d in candidates[:20]
    ])

    prompt = f"""Here is a new decision:
Title: {current_decision.title}
Problem: {current_decision.problem_statement}

Here is a list of past decisions in the same category:
{candidates_text}

Pick up to 3 decisions from the list above that are most similar to the new one.
Reply ONLY with a comma-separated list of their ID numbers, nothing else. Example: 12, 45, 8
If none are similar, reply: none"""

    result = safe_generate(prompt)

    if result == "AI_RATE_LIMITED":
        return[]

    try:
        ids = [int(x.strip()) for x in result.split(",")]
    except ValueError:
        return []

    return [d for d in candidates if d.id in ids]

SCHEMA_DESCRIPTION = """
Table: decisions
Columns: id, title, problem_statement, category, status (draft/under_review/approved/rejected/archived), created_by, created_at

Table: approvals
Columns: id, decision_id, reviewer_id, action (approved/rejected/resubmitted), comment, stage, created_at

Table: alternatives
Columns: id, decision_id, title, description, cost, risk_level (Low/Medium/High), feasibility (Low/Medium/High)
"""

def generate_sql_query(question: str, history: list = None) -> str:
    history_text = ""
    if history:
        history_text = "\n\nPrevious conversation (for context only):\n"
        for turn in history[-4:]:
            history_text += f"Q: {turn['question']}\nSQL used: {turn['sql']}\n"

    prompt = f"""You are a SQL generator for a PostgreSQL database. Only these tables exist:

{SCHEMA_DESCRIPTION}

Rules:
- Generate ONLY a SELECT query. Never write INSERT, UPDATE, DELETE, DROP, ALTER, or anything else.
- Only use the tables and columns listed above.
- If the question refers to something from the previous conversation (like "those", "that", "only the rejected ones"), use the context below to understand what it means.
- Reply with ONLY the raw SQL query, no explanation, no markdown, no code fences.
{history_text}

Current question: {question}

SQL:"""

    return safe_generate(prompt)

def is_query_safe(sql: str) -> bool:
    sql_lower = sql.lower().strip()

    if not sql_lower.startswith("select"):
        return False

    forbidden = ["insert", "update", "delete", "drop", "alter", "truncate", "grant", "--", ";--", "exec"]
    if any(word in sql_lower for word in forbidden):
        return False

    allowed_tables = ["decisions", "approvals", "alternatives"]
    if not any(table in sql_lower for table in allowed_tables):
        return False

    return True

import json

def parse_task_command(command: str) -> dict:
    prompt = f"""You interpret task commands for a decision management system.
Only two actions exist: "reassign_reviewer" and "escalate".

Extract the action and the decision ID from the user's command.
Reply with ONLY valid JSON, no markdown, no explanation, in this exact format:
{{"action": "reassign_reviewer" or "escalate" or "unknown", "decision_id": <number or null>, "new_reviewer_id": <number or null>}}

Command: {command}

JSON:"""

    text = safe_generate(prompt)

    if text == "AI_RATE_LIMITED":
        return {"action": "rate_limited", "decision_id": None, "new_reviewer_id": None}

    text = text.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError):
        return {"action": "unknown", "decision_id": None, "new_reviewer_id": None}

def answer_decision_question(question: str, decision, discussion_text: str = "", approvals_text: str = "") -> str:
    prompt = f"""You are answering questions about one specific organizational decision.
Use ONLY the information provided below. If the answer isn't in this information, say so honestly — do not guess or make anything up.

Decision Title: {decision.title}
Status: {decision.status}
Category: {decision.category}
Problem Statement: {decision.problem_statement}

Discussion Thread:
{discussion_text if discussion_text else "No discussion recorded."}

Approval History:
{approvals_text if approvals_text else "No approval actions recorded yet."}

Question: {question}

Answer clearly and concisely, in plain language:"""

    return safe_generate(prompt)

from google.genai import types

def answer_with_file(question: str, file_bytes: bytes, mime_type: str) -> str:
    prompt = f"""Answer the user's question using ONLY the content of the attached file.
If the answer isn't in the file, say so honestly.

Question: {question}

Answer clearly and concisely:"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
                prompt,
            ]
        )
        return response.text.strip()
    except Exception as e:
        if "RESOURCE_EXHAUSTED" in str(e) or "429" in str(e):
            return "AI_RATE_LIMITED"
        raise

def recommend_approval(decision, discussion_text: str = "", alternatives_text: str = "", similar_history: str = "") -> str:
    prompt = f"""You are helping a Reviewer or Manager decide whether to approve or reject a decision.
Analyze the information below and give a clear recommendation.

Decision Title: {decision.title}
Category: {decision.category}
Problem Statement: {decision.problem_statement}

Alternatives Considered:
{alternatives_text if alternatives_text else "None recorded."}

Discussion:
{discussion_text if discussion_text else "No discussion recorded."}

Similar Past Decisions (for context on precedent):
{similar_history if similar_history else "No similar past decisions found."}

Respond in this exact format:
Recommendation: Approve OR Reject
Reasoning:
- (bullet point 1)
- (bullet point 2)
- (bullet point 3, optional)

Be honest — if the information is too thin to make a confident call, say so in the reasoning rather than guessing."""

    return safe_generate(prompt)

def generate_problem_statement(title: str) -> str:
    prompt = f"""Based on this decision title, write a clear, professional problem statement (2-3 sentences) explaining what issue or need this decision addresses.
This is a draft starting point for a human to review and edit — be reasonable and generic if the title doesn't give much detail.

Title: {title}

Problem Statement:"""

    return safe_generate(prompt)