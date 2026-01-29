import React from 'react';

const STATUS_COLORS = {
  'For Appeal': 'bg-gray-100 text-status-neutral-text',
  'For Cancellation': 'bg-gray-100 text-status-neutral-text',
  'Pending': 'bg-status-pending text-status-pending-text',
  'ODSA Pending': 'bg-sro-primary text-white',
  'Approved': 'bg-sro-secondary text-white',
  'Rejected': 'bg-sro-primary text-white',
  // Add more statuses as needed
};

export default function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold text-xs px-4 py-1 min-w-[110px] h-7 text-center ${STATUS_COLORS[status] || 'bg-gray-300 text-black'
        }`}
      style={{
        maxWidth: '120px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
      title={status}
    >
      {status}
    </span>
  );
} 