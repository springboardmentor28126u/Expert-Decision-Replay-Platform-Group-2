import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import "../styles/Alternative.css";

function AlternativeComparison() {

    const { decisionId } = useParams();
    const navigate = useNavigate();

    const [alternatives, setAlternatives] = useState([]);

    useEffect(() => {
        loadAlternatives();
    }, []);

    const loadAlternatives = async () => {

        try {

            const response = await API.get(
                `/alternatives/decision/${decisionId}`
            );

            setAlternatives(response.data);

        } catch (error) {

            console.log(error);
            alert("Unable to load alternatives.");

        }

    };

    if (alternatives.length === 0) {

        return (
            <div className="comparison-container">

                <h2>No Alternatives Found</h2>

                <button
                    onClick={() => navigate(`/alternatives/${decisionId}`)}
                >
                    Back
                </button>

            </div>
        );

    }

    const highestScore = Math.max(
        ...alternatives.map(a => a.score)
    );

    return (

        <div className="comparison-container">

            <h1>Compare Alternatives</h1>

            <table className="comparison-table">

                <thead>

                    <tr>

                        <th>Field</th>

                        {alternatives.map((alt) => (

                            <th key={alt.id}>

                                {alt.title}

                            </th>

                        ))}

                    </tr>

                </thead>

                <tbody>

                    <tr>

                        <td>Description</td>

                        {alternatives.map((alt) => (

                            <td key={alt.id}>

                                {alt.description}

                            </td>

                        ))}

                    </tr>

                    <tr>

                        <td>Pros</td>

                        {alternatives.map((alt) => (

                            <td key={alt.id}>

                                {alt.pros}

                            </td>

                        ))}

                    </tr>

                    <tr>

                        <td>Cons</td>

                        {alternatives.map((alt) => (

                            <td key={alt.id}>

                                {alt.cons}

                            </td>

                        ))}

                    </tr>

                    <tr>

                        <td>Score</td>

                        {alternatives.map((alt) => (

                            <td
                                key={alt.id}
                                style={{
                                    fontWeight:
                                        alt.score === highestScore
                                            ? "bold"
                                            : "normal",
                                    color:
                                        alt.score === highestScore
                                            ? "green"
                                            : "black"
                                }}
                            >

                                {alt.score}

                            </td>

                        ))}

                    </tr>

                </tbody>

            </table>

            <br />

           <button
        className="back-btn"
        onClick={() =>
          navigate(`/decision/${decisionId}/alternatives`)
        }
      >
        ← Back
      </button>

        </div>

    );

}

export default AlternativeComparison;