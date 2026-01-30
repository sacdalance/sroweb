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
  };

  return statusMap[normalizedStatus] || 'status-badge-default';
};

export default function StatusPill({ status }) {
  const statusClass = getStatusClass(status);

  return (
    <span
      className={statusClass}
      title={status}
    >
      {status}
    </span>
  );
}

// Also export as StatusBadge for consistency with naming
export { StatusPill };
export const StatusBadge = StatusPill;