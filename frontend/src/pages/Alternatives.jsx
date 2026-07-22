import { useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

function Alternatives() {
  const [decisionId, setDecisionId] = useState("");
  const [option_name, setOptionName] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [estimated_cost, setEstimatedCost] = useState("");
  const [feasibility, setFeasibility] = useState("");
  const [risk_level, setRiskLevel] = useState("");

  const [alternatives, setAlternatives] = useState([]);

  const fetchAlternatives = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get(
        `/alternatives/${decisionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAlternatives(response.data);

    } catch (err) {
      alert("Failed to load alternatives");
    }
  };

  const createAlternative = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      await api.post(
        `/alternatives/${decisionId}`,
        {
          option_name,
          pros,
          cons,
          estimated_cost: Number(estimated_cost),
          feasibility,
          risk_level,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Alternative Added");

      setOptionName("");
      setPros("");
      setCons("");
      setEstimatedCost("");
      setFeasibility("");
      setRiskLevel("");

      fetchAlternatives();

    } catch (err) {
      console.log(err.response);
      alert(err.response?.data?.detail || "Failed");
    }
  };

  return (
    <Layout>

      <h2 className="mb-4">Alternatives</h2>

      <input
        className="form-control mb-3"
        placeholder="Decision ID"
        value={decisionId}
        onChange={(e) => setDecisionId(e.target.value)}
      />

      <button
        className="btn btn-primary mb-4"
        onClick={fetchAlternatives}
      >
        Load Alternatives
      </button>

      <form onSubmit={createAlternative}>

        <input
          className="form-control mb-3"
          placeholder="Option Name"
          value={option_name}
          onChange={(e)=>setOptionName(e.target.value)}
        />

        <textarea
          className="form-control mb-3"
          placeholder="Pros"
          value={pros}
          onChange={(e)=>setPros(e.target.value)}
        />

        <textarea
          className="form-control mb-3"
          placeholder="Cons"
          value={cons}
          onChange={(e)=>setCons(e.target.value)}
        />

        <input
          className="form-control mb-3"
          placeholder="Estimated Cost"
          value={estimated_cost}
          onChange={(e)=>setEstimatedCost(e.target.value)}
        />

        <input
          className="form-control mb-3"
          placeholder="Feasibility"
          value={feasibility}
          onChange={(e)=>setFeasibility(e.target.value)}
        />

        <input
          className="form-control mb-3"
          placeholder="Risk Level"
          value={risk_level}
          onChange={(e)=>setRiskLevel(e.target.value)}
        />

        <button className="btn btn-success">
          Add Alternative
        </button>

      </form>

      <hr />

      <h4>Existing Alternatives</h4>

      <table className="table table-bordered">

        <thead>
          <tr>
            <th>Option</th>
            <th>Pros</th>
            <th>Cons</th>
            <th>Cost</th>
            <th>Feasibility</th>
            <th>Risk</th>
          </tr>
        </thead>

        <tbody>

          {alternatives.map((alt)=>(
            <tr key={alt.id}>
              <td>{alt.option_name}</td>
              <td>{alt.pros}</td>
              <td>{alt.cons}</td>
              <td>{alt.estimated_cost}</td>
              <td>{alt.feasibility}</td>
              <td>{alt.risk_level}</td>
            </tr>
          ))}

        </tbody>

      </table>

    </Layout>
  );
}

export default Alternatives;