import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import DecisionForm from "../../components/decision/DecisionForm";

import dummyCategories from "../../data/dummyCategories";
import dummyUser from "../../data/dummyUser";

import "../../styles/decision.css";


function CreateDecision() {

  const user = dummyUser;

  const navigate = useNavigate();


  const handleCreate = (formData) => {

    console.log("New Decision:", formData);

    alert("Decision Created Successfully!");

    // Backend connect hone ke baad
    // await createDecision(formData);

    navigate("/decisions");

  };


  return (

    <DashboardLayout user={user}>

      <div className="page-header">

        <h2>Create Decision</h2>

      </div>


      <DecisionForm

        initialData={{}}

        categories={dummyCategories}

        onSubmit={handleCreate}

        buttonText="Create Decision"

      />


    </DashboardLayout>

  );

}


export default CreateDecision;