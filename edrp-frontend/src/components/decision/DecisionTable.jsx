import { Link } from "react-router-dom";
import StatusBadge from "../common/StatusBadge";

function DecisionTable({ decisions }) {
  return (
    <div className="table-container">
      <table className="decision-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Owner</th>
            <th>Status</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {decisions.map((decision) => (
            <tr key={decision.id}>
              <td>{decision.title}</td>

              <td>{decision.category_name}</td>

              <td>{decision.owner_name}</td>

              <td>
                <StatusBadge status={decision.status} />
              </td>

              <td>{decision.updated_at}</td>

              <td className="actions">
                <Link to={`/decisions/${decision.id}`}>
                  <button className="view-btn">View</button>
                </Link>

                <Link to={`/decisions/edit/${decision.id}`}>
                  <button className="edit-btn">Edit</button>
                </Link>

                <button className="delete-btn">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DecisionTable;