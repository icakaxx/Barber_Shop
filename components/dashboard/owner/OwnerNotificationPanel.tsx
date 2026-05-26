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
  isOpen: boolean;
  onToggle: () => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectAppointmentDate?: (dateStr: string) => void;
}

export default function OwnerNotificationPanel({
  notifications,
  isOpen,
  onToggle,
  onMarkRead,
  onDelete,
  onSelectAppointmentDate,
}: OwnerNotificationPanelProps) {
  const { t } = useI18n();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="relative flex items-center justify-center h-[44px] w-[44px] rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors touch-manipulation"
        aria-label={t('dashboard.owner.notificationsTitle')}
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label={t('common.close')}
            onClick={onToggle}
          />
          <div
            className="absolute right-0 top-full mt-2 z-50 w-[min(100vw-2rem,22rem)] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
            aria-live="polite"
          >
            <div className="flex items-center gap-2 px-4 py-3 bg-black text-white">
              <Bell className="w-4 h-4 shrink-0" />
              <span className="font-semibold text-sm flex-1">{t('dashboard.owner.notificationsTitle')}</span>
              {unreadCount > 0 && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500 text-center">
                {t('dashboard.owner.notificationsEmpty')}
              </p>
            ) : (
              <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                {notifications.map((n) => {
                  const aptDate = formatDateYYYYMMDDInTimeZone(
                    new Date(n.startTime),
                    SHOP_BUSINESS_TIMEZONE
                  );
                  return (
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
                        {aptDate} · {formatTimeHHMMInTimeZone(new Date(n.startTime), SHOP_BUSINESS_TIMEZONE)}
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
                            onSelectAppointmentDate?.(aptDate);
                            onToggle();
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
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
