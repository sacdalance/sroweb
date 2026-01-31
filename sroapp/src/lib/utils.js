import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Input sanitization to prevent SQL injection and XSS
// Allows: letters, numbers, spaces, common punctuation (.,!?-'":) and @ for emails
// Explicitly BLOCKS: semicolons (;), <, >, /, \, =, *, etc.
export const sanitizeInput = (value, allowNewlines = false) => {
  if (!value) return "";
  // Remove potentially dangerous characters, keep safe ones
  const pattern = allowNewlines
    ? /[^a-zA-Z0-9\s.,!?:'"()\-@\n]/g
    : /[^a-zA-Z0-9\s.,!?:'"()\-@]/g;
  return value.replace(pattern, "");
};
