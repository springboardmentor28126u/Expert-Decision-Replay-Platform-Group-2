from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import (
    require_employee,
    get_current_user
)
from app import crud, schemas

router = APIRouter(
    prefix="/discussion",
    tags=["Discussion Management"]
)

# =====================================================
# CREATE DISCUSSION
# Employee, Reviewer, Manager & Administrator
# =====================================================

@router.post(
    "/",
    response_model=schemas.DiscussionResponse
)
def create_discussion(

    discussion: schemas.DiscussionCreate,

    db: Session = Depends(get_db),

    current_user=Depends(require_employee)

):

    return crud.create_discussion(

        db,

        discussion,

        current_user

    )


# =====================================================
# GET ALL DISCUSSIONS
# Employee, Reviewer, Manager & Administrator
# =====================================================

@router.get(
    "/",
    response_model=list[schemas.DiscussionResponse]
)
def get_all_discussions(

    db: Session = Depends(get_db),

    current_user=Depends(require_employee)

):

    return crud.get_all_discussions(db)


# =====================================================
# GET DISCUSSION BY ID
# Employee, Reviewer, Manager & Administrator
# =====================================================

@router.get(
    "/{discussion_id}",
    response_model=schemas.DiscussionResponse
)
def get_discussion(

    discussion_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(require_employee)

):

    discussion = crud.get_discussion_by_id(

        db,

        discussion_id

    )

    if not discussion:

        raise HTTPException(

            status_code=404,

            detail="Discussion not found"

        )

    return discussion


# =====================================================
# GET DISCUSSIONS BY DECISION
# Employee, Reviewer, Manager & Administrator
# =====================================================

@router.get(
    "/decision/{decision_id}",
    response_model=list[schemas.DiscussionResponse]
)
def get_discussions_by_decision(

    decision_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(require_employee)

):

    return crud.get_discussions_by_decision(

        db,

        decision_id

    )


# =====================================================
# UPDATE DISCUSSION
# Employee & Reviewer -> Own Discussion Only
# Manager & Administrator -> Any Discussion
# =====================================================

@router.put(
    "/{discussion_id}",
    response_model=schemas.DiscussionResponse
)
def update_discussion(

    discussion_id: int,

    discussion: schemas.DiscussionUpdate,

    db: Session = Depends(get_db),

    current_user=Depends(require_employee)

):

    if current_user.role in [

        "Employee",

        "Reviewer"

    ]:

        if not crud.is_discussion_owner(

            db,

            discussion_id,

            current_user.id

        ):

            raise HTTPException(

                status_code=403,

                detail="You can edit only your own comments."

            )

    updated = crud.update_discussion(

        db,

        discussion_id,

        discussion,

        current_user

    )

    if not updated:

        raise HTTPException(

            status_code=404,

            detail="Discussion not found"

        )

    return updated

# =====================================================
# DELETE DISCUSSION
# Employee & Reviewer -> Own Discussion Only
# Manager & Administrator -> Any Discussion
# =====================================================

@router.delete("/{discussion_id}")
def delete_discussion(

    discussion_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(require_employee)

):

    if current_user.role in [

        "Employee",

        "Reviewer"

    ]:

        if not crud.is_discussion_owner(

            db,

            discussion_id,

            current_user.id

        ):

            raise HTTPException(

                status_code=403,

                detail="You can delete only your own comments."

            )

    deleted = crud.delete_discussion(

        db,

        discussion_id,

        current_user


    )

    if not deleted:

        raise HTTPException(

            status_code=404,

            detail="Discussion not found"

        )

    return {

        "message": "Discussion deleted successfully"

    }