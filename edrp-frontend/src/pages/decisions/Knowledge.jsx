import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import KnowledgeTable from "../../components/decision/KnowledgeTable";
import api from "../../services/api";

import "../../styles/knowledge.css";

function Knowledge() {

    const { id } = useParams();

    const [knowledge, setKnowledge] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadKnowledge();
    }, [id]);

    const loadKnowledge = async () => {

        try {

            const response = await api.get(
                `/decisions/${id}/knowledge`
            );

            setKnowledge(response.data);

        } catch (error) {

            console.error("Knowledge Error:", error);

        } finally {

            setLoading(false);

        }

    };

    const handleAddKnowledge = async () => {

        const content = prompt("Enter Knowledge Content");

        if (!content) return;

        const source = prompt("Enter Source (Optional)");

        try {

            await api.post(
                    `/decisions/${id}/knowledge`,
                    {
                        decision_id: Number(id),
                        content,
                        source
                    }
                );

            alert("Knowledge Added Successfully");

            loadKnowledge();

        } catch (error) {

            console.error(error);

            alert("Failed To Add Knowledge");

        }

    };

    const filteredKnowledge = knowledge.filter((item) =>
        item.content
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    if (loading) {

        return (

            <DashboardLayout>

                <h2>Loading Knowledge...</h2>

            </DashboardLayout>

        );

    }

    return (

        <DashboardLayout>

            <div className="knowledge-page">

                <div className="knowledge-header">

                    <div>

                        <h2>Knowledge Repository</h2>

                        <p>

                            Manage decision knowledge and references.

                        </p>

                    </div>

                    <button
                        className="upload-btn"
                        onClick={handleAddKnowledge}
                    >
                        + Add Knowledge
                    </button>

                </div>

                <div className="knowledge-search">

                    <input
                        type="text"
                        placeholder="Search Knowledge..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                    />

                </div>

                <KnowledgeTable
                    knowledge={filteredKnowledge}
                />

            </div>

        </DashboardLayout>

    );

}

export default Knowledge;