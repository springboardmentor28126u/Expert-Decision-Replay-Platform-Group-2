function RationaleList() {

    const rationales = [
        {
            id: 1,
            rationale:
                "Cloud migration will improve scalability and reduce infrastructure maintenance costs.",
            createdBy: "Raj",
            createdDate: "15 Jul 2026"
        },
        {
            id: 2,
            rationale:
                "AWS provides better availability and disaster recovery support.",
            createdBy: "Anjali",
            createdDate: "16 Jul 2026"
        }
    ];

    return (

        <div>

            <div className="section-header">

                <h2>Decision Rationale</h2>

                <button className="approve-btn">
                    + Add Rationale
                </button>

            </div>

            <div className="profile-card">

                {

                    rationales.map((item) => (

                        <div
                            key={item.id}
                            className="discussion-item"
                        >

                            <p>{item.rationale}</p>

                            <p>
                                <strong>Created By :</strong> {item.createdBy}
                            </p>

                            <small>{item.createdDate}</small>

                            <hr />

                        </div>

                    ))

                }

            </div>

        </div>

    );

}

export default RationaleList;