import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DecisionTable from "../../components/decision/DecisionTable";
import DecisionCard from "../../components/decision/DecisionCard";
import dummyDecisions from "../../data/dummyDecisions";
import "../../styles/decision.css";

function DecisionList() {

  // Later replace with API response
  const decisions = dummyDecisions;

  return (
    
    <DashboardLayout user={user}>

      <div className="page-header">

        <h2>Decision Management</h2>

        <Link to="/decisions/create">
          <button className="primary-btn">
            + Create Decision
          </button>
        </Link>

      </div>

      {/* Desktop */}

      <div className="desktop-view">
        <DecisionTable decisions={decisions} />
      </div>

      {/* Mobile */}

      <div className="mobile-view">
        {decisions.map((decision) => (
          <DecisionCard
            key={decision.id}
            decision={decision}
          />
        ))}
      </div>

    </DashboardLayout>
  );
}

export default DecisionList;