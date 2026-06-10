/**
 * Formats a raw number of bytes to human readable format (e.g. 1.2 KB)
 * @param {Number} bytes 
 * @returns {String} Formatted string
 */
export function formatBytes(bytes) {
  if (bytes === 0 || bytes === null || bytes === undefined) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Formats milliseconds to human readable format (e.g. 1.2 s)
 * @param {Number} ms 
 * @returns {String} Formatted string
 */
export function formatMs(ms) {
  if (ms === null || ms === undefined) return '0 ms';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * Formats a number with comma separators (e.g. 1,234)
 * @param {Number} n 
 * @returns {String} Formatted string
 */
export function formatNumber(n) {
  if (n === null || n === undefined) return '0';
  return Number(n).toLocaleString('en-US');
}

/**
 * Formats a Date to format 'Jun 10, 2026 · 10:05 AM'
 * @param {String} dateStr 
 * @returns {String} Formatted string
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  
  const optionsDate = { month: 'short', day: 'numeric', year: 'numeric' };
  const optionsTime = { hour: 'numeric', minute: '2-digit', hour12: true };
  
  const dStr = date.toLocaleDateString('en-US', optionsDate);
  const tStr = date.toLocaleTimeString('en-US', optionsTime);
  
  return `${dStr} · ${tStr}`;
}
