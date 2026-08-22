import requests

import os
import requests

from app.config import (
    AI_ENABLED,
    AI_MODEL,
    OLLAMA_KEEP_ALIVE
)
from app.ai.prompts import SYSTEM_PROMPT


# =====================================================
# OLLAMA CONFIGURATION
# =====================================================

OLLAMA_URL = os.getenv(
    "OLLAMA_URL",
    "http://localhost:11434/api/generate"
)

# =====================================================
# GENERATE AI RESPONSE
# =====================================================

def generate_response(
    user_message: str,
    database_context: str
) -> str:

    # -------------------------------------------------
    # CHECK AI ENABLED
    # -------------------------------------------------

    if not AI_ENABLED:

        return (
            "AI Agent is currently disabled. "
            "Please set AI_ENABLED=true in the .env file."
        )

    # -------------------------------------------------
    # USE LLAMA3.2 BY DEFAULT
    # -------------------------------------------------

    model = AI_MODEL or "llama3.2:latest"

    # -------------------------------------------------
    # BUILD PROMPT
    # -------------------------------------------------

    prompt = f"""
{SYSTEM_PROMPT}

=====================================================
EDRP DATABASE INFORMATION
=====================================================

{database_context}

=====================================================
USER QUESTION
=====================================================

{user_message}

=====================================================
INSTRUCTIONS
=====================================================

Answer the user's question using the EDRP database
information provided above.

Do not invent database information.

If the requested information is not available in the
database information, clearly say that it is not
available.

Give a clear, professional and useful response.
"""

    # -------------------------------------------------
    # OLLAMA REQUEST
    # -------------------------------------------------

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.2,
            "num_predict": 180
        },
        "keep_alive": OLLAMA_KEEP_ALIVE    }
    try:

        response = requests.post(
            OLLAMA_URL,
            json=payload,
            timeout=120
        )

        response.raise_for_status()

        result = response.json()

        answer = result.get(
            "response",
            ""
        )

        if not answer:

            return (
                "The AI model returned an empty response."
            )

        return answer.strip()

    # -------------------------------------------------
    # REQUEST ERROR
    # -------------------------------------------------

    except requests.exceptions.ConnectionError:

        return (
            "Unable to connect to Ollama. "
            "Please make sure Ollama is running."
        )

    except requests.exceptions.Timeout:

        return (
            "The AI model took too long to respond. "
            "Please try again."
        )

    except requests.exceptions.RequestException as e:

        print(
            f"Ollama request failed: {e}"
        )

        return (
            "Unable to communicate with the local AI model."
        )

    except Exception as e:

        print(
            f"AI generation failed: {e}"
        )

        return (
            "Unable to generate an AI response."
        )