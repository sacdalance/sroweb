import React from 'react';

const STATUS_COLORS = {
  'For Appeal': 'bg-gray-100 text-[#1C1C1C]',
  'For Cancellation': 'bg-gray-100 text-[#1C1C1C]',
  'Pending': 'bg-[#FFF7D6] text-[#A05A00]',
  'Approved': 'bg-[#014421] text-white',
  'Rejected': 'bg-[#7B1113] text-white',
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