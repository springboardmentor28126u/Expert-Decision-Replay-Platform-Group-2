from pydantic import BaseModel

class TeamCreate(BaseModel):
    name: str
    manager_id: int | None = None

class TeamOut(BaseModel):
    id: int
    name: str
    manager_id: int | None = None

    class Config:
        from_attributes = True

class AssignTeam(BaseModel):
    team_id: int