'use client';

import { X, Calendar, User, Phone, Mail, Scissors, Clock, FileText } from 'lucide-react';
import { getStatusBadge } from '@/lib/utils';
import type { AppointmentStatus } from '@/lib/types';

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
  if (!isOpen || !appointment) return null;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDuration = () => {
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    return diffMinutes;
  };

  // Parse additional services from notes if present
  const parseServicesFromNotes = (notes: string | undefined): string[] => {
    if (!notes) return [];
    const match = notes.match(/Additional services:\s*(.+?)(?:\n|$)/i) || 
                  notes.match(/Services:\s*(.+?)(?:\n|$)/i);
    if (match && match[1]) {
      return match[1].split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
    return [];
  };

  const additionalServices = parseServicesFromNotes(appointment.notes);
  const allServices = [appointment.serviceName, ...additionalServices].filter(Boolean) as string[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold">Детайли за час</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Статус:</span>
            {getStatusBadge(appointment.status as AppointmentStatus)}
          </div>

          {/* Date and Time */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">{formatDate(appointment.startTime)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                <span className="text-gray-500 ml-2">({getDuration()} мин)</span>
              </span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <h3 className="font-bold text-lg">Клиент</h3>
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

          {/* Services */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-gray-400" />
              <h3 className="font-bold text-lg">Услуги</h3>
            </div>
            <div className="space-y-1">
              {allServices.map((service, index) => (
                <div key={index} className="text-sm text-gray-700 pl-6">
                  • {service}
                </div>
              ))}
            </div>
            {appointment.servicePrice && (
              <div className="text-sm text-gray-600 pl-6 mt-2">
                <span className="font-medium">Цена:</span> {appointment.servicePrice} лв
              </div>
            )}
          </div>

          {/* Barber and Shop */}
          {(appointment.barberName || appointment.shopName) && (
            <div className="border-t border-gray-200 pt-4 space-y-2">
              {appointment.barberName && (
                <div className="text-sm">
                  <span className="font-medium text-gray-600">Бръснар:</span>{' '}
                  <span className="text-gray-700">{appointment.barberName}</span>
                </div>
              )}
              {appointment.shopName && (
                <div className="text-sm">
                  <span className="font-medium text-gray-600">Салон:</span>{' '}
                  <span className="text-gray-700">{appointment.shopName}</span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {appointment.notes && !appointment.notes.match(/Additional services:|Services:/i) && (
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <h3 className="font-bold text-lg">Бележки</h3>
              </div>
              <p className="text-sm text-gray-700 pl-6 whitespace-pre-wrap">
                {appointment.notes}
              </p>
            </div>
          )}

          {/* Close Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full py-3 bg-black text-white rounded-lg font-bold hover:bg-black/90 transition-colors"
            >
              Затвори
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
