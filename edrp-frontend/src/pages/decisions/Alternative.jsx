import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import AlternativeTable from "../../components/decision/AlternativeTable";
import api from "../../services/api";

import "../../styles/alternative.css";

function Alternative() {

    const { id } = useParams();

    const [alternatives, setAlternatives] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAlternatives();
    }, [id]);

    const loadAlternatives = async () => {
        try {

            const response = await api.get(
                `/decisions/${id}/alternatives`
            );

            setAlternatives(response.data);

        } catch (error) {

            console.error("Failed to load alternatives", error);

        } finally {

            setLoading(false);

        }
    };

    const filteredAlternatives = alternatives.filter((item) =>
        (item.title || "")
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <DashboardLayout>
                <h3>Loading Alternatives...</h3>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>

            <div className="alternative-page">

                <div className="page-header">

                    <div>
                        <h2>Decision Alternatives</h2>
                        <p>
                            Compare all available alternatives before selecting
                            the final decision.
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

                <AlternativeTable
                    alternatives={filteredAlternatives}
                    onDeleted={loadAlternatives}
                />

            </div>

        </DashboardLayout>
    );
}

export default Alternative;