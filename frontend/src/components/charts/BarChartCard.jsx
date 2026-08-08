import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import ChartCard from "./ChartCard";
import ChartTooltip from "./ChartTooltip";
import { CHART_GRID, CHART_MUTED, SERIES_ACCENT } from "./chartTheme";

const AXIS_STYLE = { fontSize: 11, fill: CHART_MUTED };

/**
 * Generic single-series bar chart, reused for "Decisions by Category",
 * "Approval Performance", and "Top Decision Creators" — orientation and
 * per-bar coloring are the only things that differ between them.
 *
 * `data`: [{ name, value }]
 * `colors`: either a single hex (nominal single-series — every bar shares
 *   one hue, per the dataviz skill's categorical rule) or an object keyed
 *   by `name` for status-like bars (e.g. Approval Performance).
 */
function BarChartCard({
  title,
  subtitle,
  data,
  loading,
  emptyMessage = "No data yet.",
  orientation = "vertical", // "vertical" = columns, "horizontal" = horizontal bars
  colors = SERIES_ACCENT,
  height = 236,
  onBarClick,
}) {
  const rows = data || [];
  const isEmpty = !loading && rows.every((d) => d.value === 0);
  const colorFor = (name) => (typeof colors === "string" ? colors : colors[name] || SERIES_ACCENT);
  const isHorizontal = orientation === "horizontal";

  return (
    <ChartCard title={title} subtitle={subtitle} loading={loading} isEmpty={isEmpty} emptyMessage={emptyMessage} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout={isHorizontal ? "vertical" : "horizontal"}
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
          barCategoryGap="30%"
        >
          <CartesianGrid stroke={CHART_GRID} horizontal={!isHorizontal} vertical={isHorizontal} />
          {isHorizontal ? (
            <>
              <XAxis type="number" allowDecimals={false} tick={AXIS_STYLE} axisLine={{ stroke: CHART_GRID }} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={AXIS_STYLE}
                axisLine={{ stroke: CHART_GRID }}
                tickLine={false}
                width={110}
                interval={0}
              />
            </>
          ) : (
            <>
              <XAxis dataKey="name" tick={AXIS_STYLE} axisLine={{ stroke: CHART_GRID }} tickLine={false} interval={0} angle={rows.length > 5 ? -20 : 0} textAnchor={rows.length > 5 ? "end" : "middle"} height={rows.length > 5 ? 50 : 30} />
              <YAxis type="number" allowDecimals={false} tick={AXIS_STYLE} axisLine={{ stroke: CHART_GRID }} tickLine={false} width={32} />
            </>
          )}
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Bar
            dataKey="value"
            radius={isHorizontal ? 0 : [4, 4, 0, 0]}
            barSize={22}
            isAnimationActive={false}
            onClick={onBarClick ? (entry) => onBarClick(entry.name) : undefined}
            style={{ cursor: onBarClick ? "pointer" : "default" }}
          >
            {rows.map((d) => (
              <Cell key={d.name} fill={colorFor(d.name)} />
            ))}
            <LabelList
              dataKey="value"
              position={isHorizontal ? "right" : "top"}
              style={{ fill: "var(--text-secondary)", fontSize: 11, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default BarChartCard;
