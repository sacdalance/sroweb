/**
 * Escapes HTML special characters to prevent XSS in email templates.
 */
export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Validates an email address format (basic check, no newline injection).
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  // Reject newlines (header injection) and basic format check
  if (/[\r\n]/.test(email)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Sanitizes a string to prevent email header injection.
 * Strips newlines and carriage returns.
 */
export function sanitizeEmailField(str) {
  if (str == null) return '';
  return String(str).replace(/[\r\n]/g, '');
}
