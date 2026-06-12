'use client';

import { X, Calendar, User, Phone, Mail, Scissors, Clock, FileText } from 'lucide-react';
import { StatusBadge } from '@/lib/utils/statusBadge';
import { useI18n } from '@/contexts/I18nContext';
import type { AppointmentStatus } from '@/lib/types';
import { formatAppointmentTimeInShopTz, SHOP_BUSINESS_TIMEZONE } from '@/lib/utils/shopHours';

interface Appointment {
  id: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceName?: string;
  serviceDuration?: number;
  servicePrice?: number;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  barberName?: string;
  shopName?: string;
}

interface AppointmentDetailsModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AppointmentDetailsModal({
  appointment,
  isOpen,
  onClose
}: AppointmentDetailsModalProps) {
  const { t, locale, formatPrice, translateServiceName } = useI18n();

  if (!isOpen || !appointment) return null;

  const dateLocale = locale === 'bg' ? 'bg-BG' : 'en-GB';

  const formatTime = (dateString: string) => formatAppointmentTimeInShopTz(dateString);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(dateLocale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: SHOP_BUSINESS_TIMEZONE,
    });
  };

  const getDuration = () => {
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    const diffMs = end.getTime() - start.getTime();
    return Math.round(diffMs / (1000 * 60));
  };

  const parseServicesFromNotes = (notes: string | undefined): string[] => {
    if (!notes) return [];
    const match =
      notes.match(/(?:Additional services|Допълнителни услуги|Services|Услуги):\s*(.+?)(?:\n|$)/i);
    if (match?.[1]) {
      return match[1].split(',').map((s) => s.trim()).filter((s) => s.length > 0);
    }
    return [];
  };

  const additionalServices = parseServicesFromNotes(appointment.notes);
  const allServices = [appointment.serviceName, ...additionalServices].filter(Boolean) as string[];
  const priceDisplay =
    appointment.servicePrice != null
      ? typeof appointment.servicePrice === 'number'
        ? formatPrice(appointment.servicePrice)
        : appointment.servicePrice
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-md mx-auto sm:mx-4 max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg sm:text-xl font-bold pr-2">{t('appointments.appointmentDetails')}</h2>
          <button
            onClick={onClose}
            className="p-2.5 min-h-[44px] min-w-[44px] hover:bg-gray-100 rounded-full transition-colors touch-manipulation flex items-center justify-center shrink-0"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">{t('appointments.status')}:</span>
            <StatusBadge status={appointment.status as AppointmentStatus} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">{formatDate(appointment.startTime)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                <span className="text-gray-500 ml-2">
                  ({getDuration()} {t('services.min')})
                </span>
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-3">
            <h3 className="font-bold text-lg">{t('appointments.customer')}</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{appointment.customerName ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{appointment.customerPhone ?? '—'}</span>
              </div>
              {appointment.customerEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{appointment.customerEmail}</span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-gray-400" />
              <h3 className="font-bold text-lg">{t('appointments.services')}</h3>
            </div>
            <div className="space-y-1">
              {allServices.map((service, index) => (
                <div key={index} className="text-sm text-gray-700 pl-6">
                  • {translateServiceName(service)}
                </div>
              ))}
            </div>
            {priceDisplay && (
              <div className="text-sm text-gray-600 pl-6 mt-2">
                <span className="font-medium">{t('appointments.price')}:</span> {priceDisplay}
              </div>
            )}
          </div>

          {(appointment.barberName || appointment.shopName) && (
            <div className="border-t border-gray-200 pt-4 space-y-2">
              {appointment.barberName && (
                <div className="text-sm">
                  <span className="font-medium text-gray-600">{t('appointments.barber')}:</span>{' '}
                  <span className="text-gray-700">{appointment.barberName}</span>
                </div>
              )}
              {appointment.shopName && (
                <div className="text-sm">
                  <span className="font-medium text-gray-600">{t('appointments.shop')}:</span>{' '}
                  <span className="text-gray-700">{appointment.shopName}</span>
                </div>
              )}
            </div>
          )}

          {appointment.notes && !appointment.notes.match(/Additional services:|Services:|Допълнителни услуги:|Услуги:/i) && (
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <h3 className="font-bold text-lg">{t('appointments.notes')}</h3>
              </div>
              <p className="text-sm text-gray-700 pl-6 whitespace-pre-wrap">
                {appointment.notes}
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full min-h-[48px] py-3 bg-black text-white rounded-lg font-bold hover:bg-black/90 transition-colors touch-manipulation"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
