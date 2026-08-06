import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/api";

function MyReviews() {
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const response = await api.get("/reviews");
            setReviews(response.data);
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <DashboardLayout>
            <div className="container">
                <h2>My Reviews</h2>

                <table className="table">
                    <thead>
                        <tr>
                            <th>Decision</th>
                            <th>Recommendation</th>
                            <th>Comments</th>
                        </tr>
                    </thead>

                    <tbody>
                        {reviews.length === 0 ? (
                            <tr>
                                <td colSpan="3">No Reviews Found</td>
                            </tr>
                        ) : (
                            reviews.map((review) => (
                                <tr key={review.id}>
                                    <td>{review.decision_title}</td>
                                    <td>{review.recommendation}</td>
                                    <td>{review.comments}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </DashboardLayout>
    );
}

export default MyReviews;