import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def summarize_decision(problem_statement: str, discussion_text: str = "") -> str:
    prompt = f"""Summarize this organizational decision in 2 short sentences.
Focus on: what the problem was, and what was decided or discussed.

Problem Statement: {problem_statement}

Discussion: {discussion_text if discussion_text else "No discussion yet."}

Summary:"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return response.text.strip()