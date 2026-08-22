import json

from sqlalchemy.orm import Session

from app.ai.tools import (
    get_decision,
    get_alternatives,
    get_approvals,
    get_discussions,
    search_knowledge,
    get_versions,
    get_audit_logs
)

from app.ai.agent import generate_response


# =====================================================
# BUILD DATABASE CONTEXT
# =====================================================

def build_database_context(
    db: Session,
    user_message: str
):

    message = user_message.lower()

    context = {}

    # -------------------------------------------------
    # Decision ID detection
    # -------------------------------------------------

    import re

    decision_match = re.search(
        r"decision\s*(?:id)?\s*(\d+)",
        message
    )

    decision_id = None

    if decision_match:

        decision_id = int(
            decision_match.group(1)
        )

    # -------------------------------------------------
    # Decision
    # -------------------------------------------------

    if decision_id is not None:

        context["decision"] = get_decision(
            db,
            decision_id
        )

    # -------------------------------------------------
    # Alternatives
    # -------------------------------------------------

    if (
        "alternative" in message
        or "option" in message
        or "compare" in message
        or "best" in message
    ):

        if decision_id is not None:

            context["alternatives"] = (
                get_alternatives(
                    db,
                    decision_id
                )
            )

    # -------------------------------------------------
    # Approvals
    # -------------------------------------------------

    if (
        "approval" in message
        or "approvals" in message
        or "overdue" in message
        or "escalat" in message
    ):

        context["approvals"] = get_approvals(
            db,
            decision_id
        )

    # -------------------------------------------------
    # Discussions
    # -------------------------------------------------

    if (
        "discussion" in message
        or "comment" in message
        or "comments" in message
    ):

        if decision_id is not None:

            context["discussions"] = (
                get_discussions(
                    db,
                    decision_id
                )
            )

    # -------------------------------------------------
    # Knowledge
    # -------------------------------------------------

    if (
        "knowledge" in message
        or "article" in message
        or "previous" in message
        or "related" in message
    ):

        words = [
            word.strip(
                ".,?!"
            )
            for word in message.split()
        ]

        stop_words = {
            "show",
            "find",
            "search",
            "knowledge",
            "articles",
            "article",
            "about",
            "related",
            "to",
            "the",
            "for",
            "me",
            "previous"
        }

        search_term = " ".join(
            word
            for word in words
            if word not in stop_words
        )

        if search_term:

            context["knowledge"] = (
                search_knowledge(
                    db,
                    search_term
                )
            )

    # -------------------------------------------------
    # Version history
    # -------------------------------------------------

    if (
        "version" in message
        or "history" in message
        or "changed" in message
        or "change" in message
    ):

        if decision_id is not None:

            context["versions"] = (
                get_versions(
                    db,
                    decision_id
                )
            )

    # -------------------------------------------------
    # Audit logs
    # -------------------------------------------------

    if (
        "audit" in message
        or "audit log" in message
    ):

        context["audit_logs"] = (
            get_audit_logs(
                db,
                decision_id
            )
        )

    # -------------------------------------------------
    # General approval question
    # -------------------------------------------------

    if (
        "approval" in message
        and "approvals" not in context
    ):

        context["approvals"] = (
            get_approvals(db)
        )

    return context


# =====================================================
# CHAT WITH AI AGENT
# =====================================================

def chat_with_agent(
    db: Session,
    user_message: str,
    conversation_history=None
):

    context = build_database_context(
        db,
        user_message
    )

    database_context = json.dumps(
        context,
        separators=(",", ":"),
        default=str
    )

    # -------------------------------------------------
    # BUILD CONVERSATION CONTEXT
    # -------------------------------------------------

    conversation_context = ""

    if conversation_history:

        conversation_context = "\n".join(

            f"{message.role}: {message.content}"

            for message in conversation_history[-6:]

        )

    # -------------------------------------------------
    # COMBINE USER MESSAGE WITH HISTORY
    # -------------------------------------------------

    if conversation_context:

        user_prompt = f"""
            Previous conversation:

            {conversation_context}

            Current user question:

            {user_message}
"""

    else:

        user_prompt = user_message

    # -------------------------------------------------
    # GENERATE RESPONSE
    # -------------------------------------------------

    answer = generate_response(
        user_prompt,
        database_context
    )

    return {
        "answer": answer,
        "data": context
    }