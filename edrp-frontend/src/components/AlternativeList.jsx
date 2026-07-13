import { useState } from "react";
import "../styles/dashboard.css";
import dummyAlternatives from "../data/dummyAlternatives";

function AlternativeList({ decisionId }) {

    const [alternatives] = useState(dummyAlternatives);

    const filteredAlternatives = alternatives.filter(
        (item) => item.decisionId === decisionId
    );

    return (

        <div className="dashboard-section">

            <h2>Alternatives</h2>

            <table className="decision-table">

                <thead>

                    <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Score</th>
                    </tr>

                </thead>

                <tbody>

                    {filteredAlternatives.map((item) => (

                        <tr key={item.id}>

                            <td>{item.id}</td>

                            <td>{item.title}</td>

                            <td>{item.description}</td>

                            <td>{item.score}</td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

}

export default AlternativeList;