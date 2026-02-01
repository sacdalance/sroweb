import React from 'react';

/**
 * StatusBadge - A standardized status badge component using global CSS classes
 * Uses classes defined in tailwind.css: .status-badge-*
 * 
 * @param {string} status - The status text to display
 */

// Map status values to CSS class names
const getStatusClass = (status) => {
  const normalizedStatus = status?.toLowerCase().replace(/\s+/g, '-') || 'default';

  const statusMap = {
    'approved': 'status-badge-approved',
    'recognized': 'status-badge-recognized',
    'completed': 'status-badge-completed',
    'pending': 'status-badge-pending',
    'odsa-pending': 'status-badge-odsa-pending',
    'in-progress': 'status-badge-in-progress',
    'rejected': 'status-badge-rejected',
    'cancelled': 'status-badge-cancelled',
    'expired': 'status-badge-expired',
    'for-appeal': 'status-badge-for-appeal',
    'for-cancellation': 'status-badge-for-cancellation',
    'draft': 'status-badge-draft',
    'on-probation': 'status-badge-on-probation',
    'suspended': 'status-badge-suspended',
    'inactive': 'status-badge-inactive',
    // Appointment statuses
    'scheduled': 'status-badge-scheduled',
    'confirmed': 'status-badge-confirmed',
    'reschedule-pending': 'status-badge-reschedule-pending',
  };

  return statusMap[normalizedStatus] || 'status-badge-default';
};

// Format status text to proper Normal Case (e.g., "reschedule-pending" -> "Reschedule Pending")
const formatDisplayText = (status) => {
  if (!status) return 'Unknown';

  // Special cases for specific formatting
  const specialCases = {
    'odsa-pending': 'ODSA Pending',
    'reschedule-pending': 'For Reschedule',
  };

  const normalized = status.toLowerCase().replace(/\s+/g, '-');
  if (specialCases[normalized]) {
    return specialCases[normalized];
  }

  // Convert hyphenated or underscored text to Normal Case
  return status
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function StatusPill({ status, compact = false }) {
  const statusClass = getStatusClass(status);
  const displayText = formatDisplayText(status);

  return (
    <span
      className={`${statusClass} ${compact ? "!min-w-0 !w-auto !px-2 !py-0.5 !h-6 !text-[10px]" : ""}`}
      title={status}
    >
      {displayText}
    </span>
  );
}

// Also export as StatusBadge for consistency with naming
export { StatusPill };
export const StatusBadge = StatusPill;