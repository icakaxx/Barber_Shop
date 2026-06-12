'use client';

import React from 'react';
import type { AppointmentStatus } from '@/lib/types';
import { useI18n } from '@/contexts/I18nContext';

const STATUS_KEYS: Record<AppointmentStatus, string> = {
  CONFIRMED: 'appointments.confirmed',
  PENDING: 'appointments.pending',
  DONE: 'appointments.done',
  CANCELLED: 'appointments.cancelled',
};

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  CONFIRMED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  DONE: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { t } = useI18n();
  const labelKey = STATUS_KEYS[status];
  const label = labelKey ? t(labelKey) : status;

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[status] || 'bg-gray-100'}`}>
      {label}
    </span>
  );
}

/** @deprecated Use StatusBadge component instead */
export function getStatusBadge(status: AppointmentStatus): JSX.Element {
  return <StatusBadge status={status} />;
}
