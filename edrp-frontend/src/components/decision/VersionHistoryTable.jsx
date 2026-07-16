function VersionHistoryTable({ versions }) {

    return (

        <div className="table-container">

            <table className="history-table">

                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Version</th>
                        <th>Updated By</th>
                        <th>Updated Date</th>
                        <th>Change Summary</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>


                <tbody>

                    {versions.length > 0 ? (

                        versions.map((item) => (

                            <tr key={item.id}>

                                <td>
                                    {item.id}
                                </td>


                                <td>
                                    <strong>
                                        {item.version}
                                    </strong>
                                </td>


                                <td>
                                    {item.updatedBy}
                                </td>


                                <td>
                                    {item.updatedDate}
                                </td>


                                <td>
                                    {item.summary}
                                </td>


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


                                    <button className="restore-btn">
                                        Restore
                                    </button>

                                </td>

                            </tr>

                        ))

                    ) : (

                        <tr>

                            <td
                                colSpan="7"
                                className="no-data"
                            >
                                No Version History Found
                            </td>

                        </tr>

                    )}

                </tbody>

            </table>

        </div>

    );

}

export default VersionHistoryTable;