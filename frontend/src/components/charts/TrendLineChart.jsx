import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import ChartCard from "./ChartCard";
import ChartTooltip from "./ChartTooltip";
import { CHART_GRID, CHART_MUTED, SERIES_ACCENT } from "./chartTheme";

const AXIS_STYLE = { fontSize: 11, fill: CHART_MUTED };

function formatPeriod(isoDate, granularity) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (granularity === "day") {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
  }
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit", timeZone: "UTC" });
}

/**
 * Single-series time trend, grouped by month (dashboard) or day (reports).
 * One hue, no legend box — matches the dataviz skill's single-series rule.
 */
function TrendLineChart({
  periods,
  loading,
  title = "Decisions Created Over Time",
  subtitle = "Monthly volume of new decisions",
  emptyMessage = "No decisions have been created yet.",
  granularity = "month",
  seriesName = "Decisions",
}) {
  const data = (periods || []).map((p) => ({ label: formatPeriod(p.period, granularity), value: p.count }));
  const isEmpty = !loading && data.length === 0;

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      loading={loading}
      isEmpty={isEmpty}
      emptyMessage={emptyMessage}
      height={236}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={CHART_GRID} vertical={false} />
          <XAxis
            dataKey="label"
            tick={AXIS_STYLE}
            axisLine={{ stroke: CHART_GRID }}
            tickLine={false}
            interval={granularity === "day" && data.length > 10 ? "preserveStartEnd" : 0}
            minTickGap={24}
          />
          <YAxis allowDecimals={false} tick={AXIS_STYLE} axisLine={{ stroke: CHART_GRID }} tickLine={false} width={32} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHART_GRID, strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="value"
            name={seriesName}
            stroke={SERIES_ACCENT}
            strokeWidth={2}
            dot={data.length <= 30 ? { r: 3, fill: SERIES_ACCENT, stroke: "var(--surface)", strokeWidth: 2 } : false}
            activeDot={{ r: 5, fill: SERIES_ACCENT, stroke: "var(--surface)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default TrendLineChart;
