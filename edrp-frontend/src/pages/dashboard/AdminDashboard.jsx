import DashboardLayout from "../../components/layout/DashboardLayout";
import "../../styles/dashboard.css";
import {
    Users,
    FileText,
    Clock,
    BarChart3
} from "lucide-react";

function AdminDashboard({user}) {


const statistics = [

{
    title:"Total Users",
    value:125,
    icon:<Users />
},

{
    title:"Total Decisions",
    value:86,
    icon:<FileText />
},

{
    title:"Pending Approvals",
    value:12,
    icon:<Clock />
},

{
    title:"Reports Generated",
    value:24,
    icon:<BarChart3 />
}

];

const activities=[

"Raj created a new decision",
"Anjali approved Cloud Migration",
"Rahul updated Security Audit"

];


return(

<DashboardLayout user={user}>


<div className="dashboard-page">


<div className="page-header">

<h1>
Administrator Dashboard
</h1>

<p>
Welcome back, {user.name}
</p>

</div>



<div className="stats-grid">


{
statistics.map((item,index)=>(

<div className="stat-card">


<div className="card-icon">

    {item.icon}

</div>


    <div>

        <h3>
        {item.title}
        </h3>

        <h2>
        {item.value}
        </h2>

    </div>


</div>


))
}


</div>




<div className="dashboard-section">

    <h2>
        Recent Decisions
    </h2>


    <table className="decision-table">

        <thead>

            <tr>

                <th>Decision</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Action</th>

            </tr>

        </thead>


        <tbody>


            <tr>

                <td>
                    Cloud Migration
                </td>

                <td>
                    <span className="status approved">
                        Approved
                    </span>
                </td>

                <td>
                    Raj
                </td>

                <td>

                    <button className="view-btn">
                        View
                    </button>

                </td>

            </tr>



            <tr>

                <td>
                    HR Policy Update
                </td>

                <td>
                    <span className="status pending">
                        Pending
                    </span>
                </td>

                <td>
                    Anjali
                </td>

                <td>

                    <button className="view-btn">
                        View
                    </button>

                </td>

            </tr>



            <tr>

                <td>
                    Security Audit
                </td>

                <td>
                    <span className="status rejected">
                        Rejected
                    </span>
                </td>

                <td>
                    Rahul
                </td>

                <td>

                    <button className="view-btn">
                        View
                    </button>

                </td>

            </tr>


        </tbody>


    </table>



</div>





<div className="dashboard-section">


<h2>
User Activity
</h2>


<ul className="activity-list">


{
activities.map((item,index)=>(

<li key={index}>
{item}
</li>

))
}


</ul>


</div>





<div className="dashboard-section">


{/* <h2>
Reports
</h2>


<button className="report-btn">
Download Decision Report
</button>


<button className="report-btn">
Download Audit Report
</button>
 */}

</div>

<div className="dashboard-section">

    <h2>
        User Activity
    </h2>


    <div className="activity-list">


        <div className="activity-item">

            <div className="activity-dot"></div>

            <div>

                <h4>
                    Raj created a new decision
                </h4>

                <p>
                    10 minutes ago
                </p>

            </div>

        </div>



        <div className="activity-item">

            <div className="activity-dot"></div>

            <div>

                <h4>
                    Anjali approved Cloud Migration
                </h4>

                <p>
                    1 hour ago
                </p>

            </div>

        </div>



        <div className="activity-item">

            <div className="activity-dot"></div>

            <div>

                <h4>
                    Rahul updated Security Audit
                </h4>

                <p>
                    Yesterday
                </p>

            </div>

        </div>


    </div>


</div>
<div className="dashboard-section">


<h2>
Organization Reports
</h2>


<div className="report-cards">


<div className="report-card">

<h3>
Decision Reports
</h3>

<p>
Generate complete decision summary
</p>

<button>
Download PDF
</button>

</div>



<div className="report-card">

<h3>
Approval Reports
</h3>

<p>
Approval workflow analysis
</p>

<button>
Download PDF
</button>

</div>



<div className="report-card">

<h3>
Audit Reports
</h3>

<p>
System activity logs
</p>

<button>
Download PDF
</button>

</div>


</div>


</div>
</div>


</DashboardLayout>

)

}


export default AdminDashboard;