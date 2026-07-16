import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DecisionForm from "../../components/decision/DecisionForm";
import dummyCategories from "../../data/dummyCategories";
import dummyDecisions from "../../data/dummyDecisions";
import "../../styles/decision.css";
import dummyUser from "../../data/dummyUser";
function EditDecision() {
    console.log("Edit Decision Page Loaded");
  const { id } = useParams();

  const navigate = useNavigate();

  const decision = dummyDecisions.find(
    (item) => item.id === Number(id)
  );

  const handleUpdate = (formData) => {
    console.log("Updated Decision:", formData);

    alert("Decision Updated Successfully!");

    // Backend me
    // await updateDecision(id, formData);

    navigate("/decisions");
  };

  if (!decision) {
    return (
      <DashboardLayout>
        <h2>Decision Not Found</h2>
      </DashboardLayout>
    );
  }

  return (
   <DashboardLayout user={user}>
      <div className="page-header">
        <h2>Edit Decision</h2>
      </div>

      <DecisionForm
        initialData={decision}
        categories={dummyCategories}
        onSubmit={handleUpdate}
        buttonText="Update Decision"
      />
    </DashboardLayout>
  );
}

export default EditDecision;