from sqlalchemy import select
from sqlalchemy.orm import Session

from discussion import DiscussionMessage, DiscussionMessageType
from models import AuditLog, Decision, User


def log_discussion_activity(
    db: Session,
    *,
    user_id: int,
    action: str,
    discussion_id: int,
    details: str | None = None,
) -> AuditLog:
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type="discussion_message",
        entity_id=discussion_id,
        details=details,
    )
    db.add(audit_log)
    return audit_log


def get_decision_or_none(db: Session, decision_id: int) -> Decision | None:
    return db.execute(select(Decision).where(Decision.id == decision_id)).scalar_one_or_none()


def get_comment_or_none(db: Session, comment_id: int) -> DiscussionMessage | None:
    return db.execute(
        select(DiscussionMessage).where(DiscussionMessage.id == comment_id)
    ).scalar_one_or_none()


def add_comment(
    db: Session,
    *,
    decision_id: int,
    user_id: int,
    message: str,
    attachment_url: str | None = None,
) -> DiscussionMessage:
    comment = DiscussionMessage(
        decision_id=decision_id,
        user_id=user_id,
        message=message,
        message_type=DiscussionMessageType.comment,
        attachment_url=attachment_url,
    )
    db.add(comment)
    db.flush()
    log_discussion_activity(
        db,
        user_id=user_id,
        action="create",
        discussion_id=comment.id,
        details=f"Created comment for decision {decision_id}",
    )
    db.commit()
    db.refresh(comment)
    return comment


def add_meeting_note(
    db: Session,
    *,
    decision_id: int,
    user_id: int,
    message: str,
    attachment_url: str | None = None,
) -> DiscussionMessage:
    meeting_note = DiscussionMessage(
        decision_id=decision_id,
        user_id=user_id,
        message=message,
        message_type=DiscussionMessageType.meeting_note,
        attachment_url=attachment_url,
    )
    db.add(meeting_note)
    db.flush()
    log_discussion_activity(
        db,
        user_id=user_id,
        action="create",
        discussion_id=meeting_note.id,
        details=f"Created meeting note for decision {decision_id}",
    )
    db.commit()
    db.refresh(meeting_note)
    return meeting_note


def reply_to_comment(
    db: Session,
    *,
    parent: DiscussionMessage,
    user_id: int,
    message: str,
    attachment_url: str | None = None,
) -> DiscussionMessage:
    reply = DiscussionMessage(
        decision_id=parent.decision_id,
        user_id=user_id,
        parent_id=parent.id,
        message=message,
        message_type=DiscussionMessageType.reply,
        attachment_url=attachment_url,
    )
    db.add(reply)
    db.flush()
    log_discussion_activity(
        db,
        user_id=user_id,
        action="create",
        discussion_id=reply.id,
        details=f"Created reply to comment {parent.id}",
    )
    db.commit()
    db.refresh(reply)
    return reply


def edit_comment(
    db: Session,
    *,
    comment: DiscussionMessage,
    user_id: int,
    message: str | None = None,
    attachment_url: str | None = None,
) -> DiscussionMessage:
    if message is not None:
        comment.message = message
    if attachment_url is not None:
        comment.attachment_url = attachment_url

    log_discussion_activity(
        db,
        user_id=user_id,
        action="edit",
        discussion_id=comment.id,
        details=f"Edited comment {comment.id}",
    )
    db.commit()
    db.refresh(comment)
    return comment


def delete_comment(db: Session, *, comment: DiscussionMessage, user: User) -> None:
    discussion_id = comment.id
    log_discussion_activity(
        db,
        user_id=user.id,
        action="delete",
        discussion_id=discussion_id,
        details=f"Deleted comment {discussion_id}",
    )
    db.delete(comment)
    db.commit()


def get_comments_for_decision(db: Session, decision_id: int) -> list[DiscussionMessage]:
    return db.execute(
        select(DiscussionMessage)
        .where(DiscussionMessage.decision_id == decision_id)
        .order_by(DiscussionMessage.created_at.asc(), DiscussionMessage.id.asc())
    ).scalars().all()
