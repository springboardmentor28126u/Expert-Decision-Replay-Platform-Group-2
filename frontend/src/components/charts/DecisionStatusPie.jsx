import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import ChartCard from "./ChartCard";
import ChartTooltip from "./ChartTooltip";
import { STATUS_COLORS, STATUS_LABELS } from "./chartTheme";

const STATUS_ORDER = ["draft", "under_review", "approved", "rejected", "archived"];

// Custom legend: swatch + label + count together (not color-only identity),
// per the dataviz skill's requirement that a WARN-band CVD pair (approved
// vs. rejected here, under protanopia) ship with a secondary text channel.
function StatusLegend({ payload }) {
  if (!payload) return null;
  return (
    <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 16px" }}>
      {payload.map((entry) => (
        <li key={entry.value} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: entry.color, display: "inline-block", flexShrink: 0 }} />
          <span style={{ color: "var(--text-secondary)" }}>{entry.payload.label}</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{entry.payload.value}</span>
        </li>
      ))}
    </ul>
  );
}

function DecisionStatusPie({ statusCounts, loading, onSliceClick }) {
  const data = STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    value: statusCounts?.[status] ?? 0,
  }));
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const isEmpty = !loading && total === 0;

  return (
    <ChartCard
      title="Decision Status Distribution"
      subtitle="Share of all decisions by current status"
      loading={loading}
      isEmpty={isEmpty}
      emptyMessage="No decisions have been created yet."
      height={300}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="46%"
            innerRadius={58}
            outerRadius={92}
            paddingAngle={2}
            cornerRadius={4}
            stroke="var(--surface)"
            strokeWidth={2}
            label={({ percent, value }) => (value > 0 ? `${(percent * 100).toFixed(0)}%` : "")}
            labelLine={false}
            onClick={(entry) => onSliceClick?.(entry.status)}
            style={{ cursor: onSliceClick ? "pointer" : "default", outline: "none" }}
          >
            {data.map((d) => (
              <Cell key={d.status} fill={STATUS_COLORS[d.status]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend content={<StatusLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default DecisionStatusPie;
