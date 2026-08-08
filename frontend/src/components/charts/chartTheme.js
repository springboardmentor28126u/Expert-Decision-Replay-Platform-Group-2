// Shared chart color tokens.
//
// The five status hues and the three approval-performance hues below were
// picked and run through the dataviz skill's palette validator (categorical,
// dark mode, --surface #171A21 chart background) rather than reusing the
// app's --text-muted/--text-secondary tokens directly — those read as gray
// (chroma < 0.10) and fail the validator's chroma-floor check as chart marks,
// even though they work fine as *text*. See PR description for the
// validator output.
export const STATUS_COLORS = {
  draft: "#9085e9",
  under_review: "#c98500",
  approved: "#199e70",
  rejected: "#e66767",
  archived: "#3987e5",
};

export const STATUS_LABELS = {
  draft: "Draft",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  archived: "Archived",
};

export const APPROVAL_COLORS = {
  pending: "#c98500",
  approved: "#199e70",
  rejected: "#e66767",
  escalated: "#3987e5",
};

// Single-hue accent for nominal, single-series charts (category volumes,
// top-creator ranking, the monthly trend line) — matches the app's existing
// --accent token, already proven at this contrast against --surface/--bg
// throughout the shell (nav, links, borders).
export const SERIES_ACCENT = "#4FD1B5";

export const CHART_GRID = "#262B36"; // == --border, hairline gridlines
export const CHART_MUTED = "#5B6272"; // == --text-muted, axis ticks
export const CHART_SURFACE = "#171A21"; // == --surface, tooltip/card background
