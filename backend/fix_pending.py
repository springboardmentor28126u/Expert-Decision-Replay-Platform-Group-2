from app.database.database import SessionLocal
from app.models.decision import Decision
from app.models.approval import Approval
from app.models.user import User

db = SessionLocal()

# Find decisions that have a Pending approval but aren't marked Pending
pending_approvals = db.query(Approval).filter(Approval.status == "Pending").all()

for a in pending_approvals:
    decision = db.query(Decision).filter(Decision.id == a.decision_id).first()
    if decision and decision.status != "Pending":
        decision.status = "Pending"

db.commit()
db.close()
print("Done")