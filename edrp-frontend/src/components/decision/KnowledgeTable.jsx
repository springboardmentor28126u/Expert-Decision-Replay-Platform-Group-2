function KnowledgeTable({ knowledge }) {
  return (
    <div className="table-container">
      <table className="knowledge-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Document</th>
            <th>Category</th>
            <th>Uploaded By</th>
            <th>Upload Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {knowledge.length > 0 ? (
            knowledge.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>

                <td>
                  <strong>{item.title}</strong>
                </td>

                <td>{item.category}</td>

                <td>{item.uploadedBy}</td>

                <td>{item.uploadDate}</td>

                <td>
                  <span
                    className={`status ${item.status.toLowerCase()}`}
                  >
                    {item.status}
                  </span>
                </td>

                <td>
                  <button className="view-btn">
                    View
                  </button>

                  <button className="download-btn">
                    Download
                  </button>

                  <button className="delete-btn">
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="no-data">
                No Knowledge Found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default KnowledgeTable;