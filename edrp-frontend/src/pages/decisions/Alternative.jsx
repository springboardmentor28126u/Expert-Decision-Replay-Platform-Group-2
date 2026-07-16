import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import AlternativeTable from "../../components/decision/AlternativeTable";
import "../../styles/alternative.css";

function Alternative() {
  const [search, setSearch] = useState("");

  const alternatives = [
    {
      id: 1,
      name: "Cloud Migration",
      description: "Move infrastructure to AWS cloud.",
      pros: "Scalable, Reliable",
      cons: "Higher Initial Cost",
      score: 9,
      status: "Selected",
    },
    {
      id: 2,
      name: "On-Premise Upgrade",
      description: "Upgrade existing servers.",
      pros: "Full Control",
      cons: "Maintenance Cost",
      score: 7,
      status: "Pending",
    },
    {
      id: 3,
      name: "Hybrid Infrastructure",
      description: "Combine cloud and local servers.",
      pros: "Flexible",
      cons: "Complex Setup",
      score: 8,
      status: "Rejected",
    },
  ];

  const filteredAlternatives = alternatives.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="alternative-page">

        <div className="page-header">
          <div>
            <h2>Decision Alternatives</h2>
            <p>
              Compare all available alternatives before selecting the final
              decision.
            </p>
          </div>

          <button className="add-btn">
            + Add Alternative
          </button>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search alternatives..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <AlternativeTable alternatives={filteredAlternatives} />

      </div>
    </DashboardLayout>
  );
}

export default Alternative;