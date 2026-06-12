'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { AppointmentStatus } from '@/lib/types';
import { useI18n } from '@/contexts/I18nContext';
import { formatDateTimeLocalInShopTz, parseAppointmentInstant, formatAppointmentTimeInShopTz, SHOP_BUSINESS_TIMEZONE } from '@/lib/utils/shopHours';

interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  barberId?: string;
  barberName?: string;
  shopId?: string;
  shopName?: string;
}

interface EditAppointmentModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: ((appointment: Appointment) => void) | ((appointment: Appointment) => Promise<void>);
  services?: Array<{ id: string; name: string }>;
}

export default function EditAppointmentModal({
  appointment,
  isOpen,
  onClose,
  onSave,
  services = []
}: EditAppointmentModalProps) {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    startTime: '',
    endTime: '',
    status: 'PENDING' as AppointmentStatus,
    notes: ''
  });

  const formatLocalDateTime = (dateString: string): string =>
    formatDateTimeLocalInShopTz(parseAppointmentInstant(dateString));

  useEffect(() => {
    if (appointment) {
      setFormData({
        customerName: appointment.customerName,
        customerPhone: appointment.customerPhone,
        customerEmail: appointment.customerEmail || '',
        startTime: formatLocalDateTime(appointment.startTime),
        endTime: formatLocalDateTime(appointment.endTime),
        status: appointment.status as AppointmentStatus,
        notes: appointment.notes || ''
      });
    }
  }, [appointment]);

  if (!isOpen || !appointment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...appointment,
      ...formData,
      customerEmail: formData.customerEmail || undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-md sm:mx-4 max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg sm:text-xl font-bold pr-2">{t('dashboard.owner.editAppointment')}</h2>
          <button
            onClick={onClose}
            className="p-2.5 min-h-[44px] min-w-[44px] hover:bg-gray-100 rounded-full transition-colors touch-manipulation flex items-center justify-center shrink-0"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dashboard.barber.customerName')}
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dashboard.barber.phoneNumber')}
            </label>
            <input
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dashboard.barber.emailOptional')}
            </label>
            <input
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('dashboard.owner.startTime')}
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('dashboard.owner.endTime')}
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('appointments.status')}
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as AppointmentStatus })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
            >
              <option value="PENDING">{t('appointments.pending')}</option>
              <option value="CONFIRMED">{t('appointments.confirmed')}</option>
              <option value="DONE">{t('appointments.done')}</option>
              <option value="CANCELLED">{t('appointments.cancelled')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dashboard.barber.notesOptional')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[48px] py-3 border border-gray-200 rounded-lg font-bold hover:bg-gray-50 transition-colors touch-manipulation"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[48px] py-3 bg-black text-white rounded-lg font-bold hover:bg-black/90 transition-colors touch-manipulation"
            >
              {t('dashboard.owner.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
