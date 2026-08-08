import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import ChartCard from "./ChartCard";
import ChartTooltip from "./ChartTooltip";
import { CHART_GRID, CHART_MUTED, SERIES_ACCENT } from "./chartTheme";

const AXIS_STYLE = { fontSize: 11, fill: CHART_MUTED };

function formatMonth(isoDate) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit", timeZone: "UTC" });
}

/** "Decisions Created Over Time", grouped by month. Single series → one hue, no legend box. */
function TrendLineChart({ periods, loading }) {
  const data = (periods || []).map((p) => ({ month: formatMonth(p.period), value: p.count }));
  const isEmpty = !loading && data.length === 0;

  return (
    <ChartCard
      title="Decisions Created Over Time"
      subtitle="Monthly volume of new decisions"
      loading={loading}
      isEmpty={isEmpty}
      emptyMessage="No decisions have been created yet."
      height={260}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={CHART_GRID} vertical={false} />
          <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={{ stroke: CHART_GRID }} tickLine={false} />
          <YAxis allowDecimals={false} tick={AXIS_STYLE} axisLine={{ stroke: CHART_GRID }} tickLine={false} width={32} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHART_GRID, strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="value"
            name="Decisions"
            stroke={SERIES_ACCENT}
            strokeWidth={2}
            dot={{ r: 4, fill: SERIES_ACCENT, stroke: "var(--surface)", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: SERIES_ACCENT, stroke: "var(--surface)", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default TrendLineChart;
