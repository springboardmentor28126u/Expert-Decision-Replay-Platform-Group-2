import { useParams } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import VersionHistoryList from "../../components/decision/VersionHistoryList";

import "../../styles/versionHistory.css";


function VersionHistory() {

    const { id } = useParams();


    return (

        <DashboardLayout>

            <div className="version-page">

                <h1>
                    Decision Version History
                </h1>


                <VersionHistoryList
                    decisionId={id}
                />


            </div>

        </DashboardLayout>

    );

}


export default VersionHistory;