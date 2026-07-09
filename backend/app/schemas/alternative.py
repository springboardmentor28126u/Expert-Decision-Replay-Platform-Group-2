from pydantic import BaseModel


class AlternativeCreate(BaseModel):
    option_name: str
    pros: str
    cons: str
    estimated_cost: str
    feasibility: str
    risk_level: str


class AlternativeUpdate(BaseModel):
    option_name: str
    pros: str
    cons: str
    estimated_cost: str
    feasibility: str
    risk_level: str


class AlternativeResponse(BaseModel):
    id: int
    decision_id: int
    option_name: str
    pros: str
    cons: str
    estimated_cost: str
    feasibility: str
    risk_level: str

    class Config:
        from_attributes = True