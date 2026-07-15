/**
 * Formats a Date object or timestamp string into a readable enterprise-grade date format.
 * @param {Date|string|number} date 
 * @returns {string} e.g. "Jul 15, 2026 09:46 PM"
 */
export function formatDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats elapsed seconds into video-player/replay style time.
 * @param {number} seconds 
 * @returns {string} e.g. "02:45" or "1:15:30"
 */
export function formatDuration(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (num) => String(num).padStart(2, '0');

  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Formats a decision confidence score or percentage value.
 * @param {number} value - e.g. 0.854 
 * @returns {string} e.g. "85.4%"
 */
export function formatPercentage(value) {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  const percentage = value <= 1 ? value * 100 : value;
  return `${percentage.toFixed(1)}%`;
}
