import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
from auth import get_current_user, get_db
from models import (
    User, Decision, Discussion, Comment, MeetingNote, DecisionRationale, DiscussionAttachment
)
from schemas import (
    DiscussionCreate, DiscussionOut,
    CommentCreate, CommentOut,
    MeetingNoteCreate, MeetingNoteOut,
    DecisionRationaleCreate, DecisionRationaleOut,
    DiscussionAttachmentOut
)

router = APIRouter()

# Directory for storing discussion attachments
UPLOAD_DIR = "uploads/discussions"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/decisions/{decision_id}/discussion", response_model=DiscussionOut)
def create_discussion(decision_id: int, discussion_in: DiscussionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    new_discussion = Discussion(
        decision_id=decision_id,
        title=discussion_in.title,
        created_by=current_user.id
    )
    db.add(new_discussion)
    db.commit()
    db.refresh(new_discussion)
    return new_discussion


@router.get("/decisions/{decision_id}/discussion", response_model=List[DiscussionOut])
def get_discussions_for_decision(decision_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    discussions = db.query(Discussion).filter(Discussion.decision_id == decision_id).all()
    return discussions


@router.post("/discussion/{discussion_id}/comments", response_model=CommentOut)
def add_comment(discussion_id: int, comment_in: CommentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    discussion = db.query(Discussion).filter(Discussion.id == discussion_id).first()
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")

    new_comment = Comment(
        discussion_id=discussion_id,
        user_id=current_user.id,
        message=comment_in.message
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment


@router.get("/discussion/{discussion_id}/comments", response_model=List[CommentOut])
def get_comments(discussion_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    discussion = db.query(Discussion).filter(Discussion.id == discussion_id).first()
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")

    comments = db.query(Comment).filter(Comment.discussion_id == discussion_id).all()
    return comments


@router.post("/discussion/{discussion_id}/meeting-notes", response_model=MeetingNoteOut)
def add_meeting_note(discussion_id: int, note_in: MeetingNoteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    discussion = db.query(Discussion).filter(Discussion.id == discussion_id).first()
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")

    new_note = MeetingNote(
        discussion_id=discussion_id,
        note=note_in.note,
        created_by=current_user.id
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note


@router.get("/discussion/{discussion_id}/meeting-notes", response_model=List[MeetingNoteOut])
def get_meeting_notes(discussion_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    discussion = db.query(Discussion).filter(Discussion.id == discussion_id).first()
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")

    notes = db.query(MeetingNote).filter(MeetingNote.discussion_id == discussion_id).all()
    return notes


@router.post("/decisions/{decision_id}/rationale", response_model=DecisionRationaleOut)
def add_decision_rationale(decision_id: int, rationale_in: DecisionRationaleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    new_rationale = DecisionRationale(
        decision_id=decision_id,
        rationale=rationale_in.rationale,
        created_by=current_user.id
    )
    db.add(new_rationale)
    db.commit()
    db.refresh(new_rationale)
    return new_rationale
@router.get("/discussion/{discussion_id}", response_model=DiscussionOut)
def get_discussion(
    discussion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    discussion = db.query(Discussion).filter(
        Discussion.id == discussion_id
    ).first()

    if not discussion:
        raise HTTPException(
            status_code=404,
            detail="Discussion not found"
        )

    return discussion

@router.get("/decisions/{decision_id}/rationale", response_model=List[DecisionRationaleOut])
def get_decision_rationales(decision_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    rationales = db.query(DecisionRationale).filter(DecisionRationale.decision_id == decision_id).all()
    return rationales


@router.post("/discussion/{discussion_id}/attachments", response_model=DiscussionAttachmentOut)
def upload_discussion_attachment(discussion_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    discussion = db.query(Discussion).filter(Discussion.id == discussion_id).first()
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    new_attachment = DiscussionAttachment(
        discussion_id=discussion_id,
        filename=file.filename,
        filepath=file_path,
        uploaded_by=current_user.id
    )
    db.add(new_attachment)
    db.commit()
    db.refresh(new_attachment)
    return new_attachment


@router.get("/discussion/{discussion_id}/attachments", response_model=List[DiscussionAttachmentOut])
def get_discussion_attachments(discussion_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    discussion = db.query(Discussion).filter(Discussion.id == discussion_id).first()
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")

    attachments = db.query(DiscussionAttachment).filter(DiscussionAttachment.discussion_id == discussion_id).all()
    return attachments


@router.delete("/discussion/{discussion_id}/attachments/{attachment_id}")
def delete_discussion_attachment(discussion_id: int, attachment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    attachment = db.query(DiscussionAttachment).filter(DiscussionAttachment.id == attachment_id, DiscussionAttachment.discussion_id == discussion_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    if os.path.exists(attachment.filepath):
        os.remove(attachment.filepath)

    db.delete(attachment)
    db.commit()
    return {"message": "Attachment deleted successfully"}
@router.get("/discussion/{discussion_id}/attachments/{attachment_id}")
def download_discussion_attachment(
    discussion_id:int,
    attachment_id:int,
    db:Session=Depends(get_db),
    current_user:User=Depends(get_current_user)
):

    attachment = db.query(DiscussionAttachment).filter(
        DiscussionAttachment.id == attachment_id,
        DiscussionAttachment.discussion_id == discussion_id
    ).first()


    if not attachment:
        raise HTTPException(
            status_code=404,
            detail="Attachment not found"
        )


    return FileResponse(
        path=attachment.filepath,
        filename=attachment.filename
    )
@router.get("/discussion/{discussion_id}", response_model=DiscussionOut)
def get_single_discussion(
    discussion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    discussion = db.query(Discussion).filter(
        Discussion.id == discussion_id
    ).first()

    if not discussion:
        raise HTTPException(
            status_code=404,
            detail="Discussion not found"
        )

    return discussion