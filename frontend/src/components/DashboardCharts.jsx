import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  Tooltip,
  Legend
);

export default function DashboardCharts({ stats }) {
  const barData = {
    labels: ["Approved", "Pending", "Rejected"],
    datasets: [
      {
        label: "Decisions",
        data: [
          stats.approved,
          stats.pending,
          stats.rejected,
        ],
        backgroundColor: [
          "#16a34a",
          "#f59e0b",
          "#dc2626",
        ],
        borderRadius: 8,
      },
    ],
  };

  const pieData = {
    labels: ["Approved", "Pending", "Rejected"],
    datasets: [
      {
        data: [
          stats.approved,
          stats.pending,
          stats.rejected,
        ],
        backgroundColor: [
          "#16a34a",
          "#f59e0b",
          "#dc2626",
        ],
      },
    ],
  };

  return (
    <div className="row mt-4">

      <div className="col-lg-7 mb-4">
        <div className="card border-0 shadow-lg">
          <div className="card-body">

            <h4 className="fw-bold mb-4">
              📊 Decision Analytics
            </h4>

            <Bar
              data={barData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
              }}
            />

          </div>
        </div>
      </div>

      <div className="col-lg-5 mb-4">
        <div className="card border-0 shadow-lg">
          <div className="card-body">

            <h4 className="fw-bold mb-4">
              🥧 Decision Status
            </h4>

            <Pie data={pieData} />

          </div>
        </div>
      </div>

    </div>
  );
}