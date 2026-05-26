'use client';

import { Bell, X, Check } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import {
  formatDateYYYYMMDDInTimeZone,
  formatTimeHHMMInTimeZone,
  SHOP_BUSINESS_TIMEZONE,
} from '@/lib/utils/shopHours';
import type { OwnerNotificationItem } from '@/lib/utils/ownerNotifications';

interface OwnerNotificationPanelProps {
  notifications: OwnerNotificationItem[];
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectAppointmentDate?: (dateStr: string) => void;
}

export default function OwnerNotificationPanel({
  notifications,
  onMarkRead,
  onDelete,
  onSelectAppointmentDate,
}: OwnerNotificationPanelProps) {
  const { t } = useI18n();
  if (notifications.length === 0) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      className="fixed top-20 right-4 z-50 w-full max-w-sm flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      <div className="pointer-events-auto bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-black text-white">
          <Bell className="w-4 h-4 shrink-0" />
          <span className="font-semibold text-sm flex-1">{t('dashboard.owner.notificationsTitle')}</span>
          {unreadCount > 0 && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
        <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`px-4 py-3 text-sm ${n.read ? 'bg-gray-50 opacity-80' : 'bg-white'}`}
            >
              <p className="font-medium text-gray-900">{t('dashboard.owner.newBookingAlert')}</p>
              <p className="text-gray-600 mt-0.5">
                {n.customerName}
                {n.barberName ? ` · ${n.barberName}` : ''}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                {formatTimeHHMMInTimeZone(new Date(n.startTime), SHOP_BUSINESS_TIMEZONE)}
              </p>
              <div className="flex gap-2 mt-2">
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => onMarkRead(n.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-black"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {t('dashboard.owner.notificationMarkRead')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectAppointmentDate && n.startTime) {
                      onSelectAppointmentDate(
                        formatDateYYYYMMDDInTimeZone(new Date(n.startTime), SHOP_BUSINESS_TIMEZONE)
                      );
                    }
                  }}
                  className="text-xs font-medium text-gray-700 hover:text-black"
                >
                  {t('dashboard.owner.notificationView')}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(n.id)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 ml-auto"
                >
                  <X className="w-3.5 h-3.5" />
                  {t('dashboard.owner.notificationDelete')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
