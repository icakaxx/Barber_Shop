'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { AppointmentStatus } from '@/lib/types';

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
}

interface EditAppointmentModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Appointment) => void;
  services?: Array<{ id: string; name: string }>;
}

export default function EditAppointmentModal({
  appointment,
  isOpen,
  onClose,
  onSave,
  services = []
}: EditAppointmentModalProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    startTime: '',
    endTime: '',
    status: 'PENDING' as AppointmentStatus,
    notes: ''
  });

  // Helper function to format date for datetime-local input (local time, not UTC)
  const formatLocalDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold">Edit Appointment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name
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
              Phone Number
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
              Email (optional)
            </label>
            <input
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
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
                End Time
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
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as AppointmentStatus })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
            >
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="DONE">Done</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 rounded-lg font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-black text-white rounded-lg font-bold hover:bg-black/90 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

