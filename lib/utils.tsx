import React from 'react';
import type { AppointmentStatus } from './types';

export function getStatusBadge(status: AppointmentStatus): JSX.Element {
  const styles: Record<AppointmentStatus, string> = {
    CONFIRMED: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    DONE: 'bg-gray-100 text-gray-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  );
}



