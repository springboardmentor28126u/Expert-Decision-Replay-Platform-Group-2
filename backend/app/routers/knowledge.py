from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import (
    require_employee,
    require_reviewer
)
from app import crud, schemas

router = APIRouter(
    prefix="/knowledge",
    tags=["Knowledge Repository"]
)

# =====================================================
# CREATE KNOWLEDGE
# Employee, Reviewer, Manager & Administrator
# =====================================================

@router.post(
    "/",
    response_model=schemas.KnowledgeResponse
)
def create_knowledge(

    knowledge: schemas.KnowledgeCreate,

    db: Session = Depends(get_db),

    current_user=Depends(require_employee)

):

    return crud.create_knowledge(

        db,

        knowledge,

        current_user.id

    )


# =====================================================
# GET ALL KNOWLEDGE
# Employee, Reviewer, Manager & Administrator
# =====================================================

@router.get(
    "/",
    response_model=list[schemas.KnowledgeResponse]
)
def get_all_knowledge(

    db: Session = Depends(get_db),

    current_user=Depends(require_employee)

):

    return crud.get_all_knowledge(db)


# =====================================================
# GET KNOWLEDGE BY ID
# Employee, Reviewer, Manager & Administrator
# =====================================================

@router.get(
    "/{knowledge_id}",
    response_model=schemas.KnowledgeResponse
)
def get_knowledge(

    knowledge_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(require_employee)

):

    knowledge = crud.get_knowledge_by_id(

        db,

        knowledge_id

    )

    if not knowledge:

        raise HTTPException(

            status_code=404,

            detail="Knowledge not found"

        )

    return knowledge


# =====================================================
# UPDATE KNOWLEDGE
# Employee & Reviewer -> Own Articles Only
# Manager & Administrator -> Any Article
# =====================================================

@router.put(
    "/{knowledge_id}",
    response_model=schemas.KnowledgeResponse
)
def update_knowledge(

    knowledge_id: int,

    knowledge: schemas.KnowledgeUpdate,

    db: Session = Depends(get_db),

    current_user=Depends(require_reviewer)

):

    if current_user.role in ["Employee", "Reviewer"]:

        if not crud.is_knowledge_owner(

            db,

            knowledge_id,

            current_user.id

        ):

            raise HTTPException(

                status_code=403,

                detail="You can edit only your own knowledge articles."

            )

    updated = crud.update_knowledge(

        db,

        knowledge_id,

        knowledge,

        current_user

    )

    if not updated:

        raise HTTPException(

            status_code=404,

            detail="Knowledge article not found"

        )

    return updated


# =====================================================
# DELETE KNOWLEDGE
# Employee & Reviewer -> Own Articles Only
# Manager & Administrator -> Any Article
# =====================================================

@router.delete("/{knowledge_id}")
def delete_knowledge(

    knowledge_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(require_reviewer)

):

    if current_user.role in ["Employee", "Reviewer"]:

        if not crud.is_knowledge_owner(

            db,

            knowledge_id,

            current_user.id

        ):

            raise HTTPException(

                status_code=403,

                detail="You can delete only your own knowledge articles."

            )

    deleted = crud.delete_knowledge(

        db,

        knowledge_id,
        current_user

    )

    if not deleted:

        raise HTTPException(

            status_code=404,

            detail="Knowledge article not found"

        )

    return {

        "message": "Knowledge deleted successfully"

    }