'use client';

import { useState, useEffect } from 'react';
import { Calendar, Scissors, Phone, Edit2, Check, X } from 'lucide-react';
import { getStatusBadge } from '@/lib/utils';
import EditAppointmentModal from './EditAppointmentModal';

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

interface TodayAppointmentsProps {
  barberId?: string;
}

export default function TodayAppointments({ barberId }: TodayAppointmentsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadAppointments = async () => {
      if (!barberId) {
        setLoading(false);
        return;
      }

      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/api/barbers/${barberId}/appointments?date=${today}&status=PENDING,CONFIRMED`);
        
        if (response.ok) {
          const data = await response.json();
          setAppointments(data);
        }
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [barberId]);

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleSave = async (updatedAppointment: Appointment) => {
    try {
      const response = await fetch(`/api/appointments/${updatedAppointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: updatedAppointment.customerName,
          customerPhone: updatedAppointment.customerPhone,
          customerEmail: updatedAppointment.customerEmail,
          startTime: new Date(updatedAppointment.startTime).toISOString(),
          endTime: new Date(updatedAppointment.endTime).toISOString(),
          status: updatedAppointment.status,
          notes: updatedAppointment.notes
        })
      });

      if (response.ok) {
        // Reload appointments
        const today = new Date().toISOString().split('T')[0];
        const reloadResponse = await fetch(`/api/barbers/${barberId}/appointments?date=${today}&status=PENDING,CONFIRMED`);
        if (reloadResponse.ok) {
          const data = await reloadResponse.json();
          setAppointments(data);
        }
        setIsModalOpen(false);
        setEditingAppointment(null);
      } else {
        const error = await response.json();
        alert(`Failed to update appointment: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment');
    }
  };

  const handleMarkDone = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DONE' })
      });

      if (response.ok) {
        // Reload appointments
        const today = new Date().toISOString().split('T')[0];
        const reloadResponse = await fetch(`/api/barbers/${barberId}/appointments?date=${today}&status=PENDING,CONFIRMED`);
        if (reloadResponse.ok) {
          const data = await reloadResponse.json();
          setAppointments(data);
        }
      }
    } catch (error) {
      console.error('Error marking appointment as done:', error);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'CANCELLED',
          cancelReason: 'Cancelled by barber'
        })
      });

      if (response.ok) {
        // Reload appointments
        const today = new Date().toISOString().split('T')[0];
        const reloadResponse = await fetch(`/api/barbers/${barberId}/appointments?date=${today}&status=PENDING,CONFIRMED`);
        if (reloadResponse.ok) {
          const data = await reloadResponse.json();
          setAppointments(data);
        }
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Today&apos;s Appointments</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>Today, {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
          </div>
        </div>
        <div className="text-center py-12 text-gray-400">Loading appointments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Today&apos;s Appointments</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>Today, {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>

      <div className="grid gap-4">
        {appointments.length === 0 ? (
          <p className="text-center py-12 text-gray-400">No appointments for today.</p>
        ) : (
          appointments.map((app) => (
            <div
              key={app.id}
              className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="bg-gray-100 p-3 rounded-lg text-center min-w-[100px]">
                  <p className="text-xs font-bold text-gray-500 uppercase">Time</p>
                  <p className="font-bold">{formatTime(app.startTime)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">{app.customerName}</h3>
                    {getStatusBadge(app.status)}
                  </div>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Scissors className="w-3 h-3" /> {app.serviceName}
                  </p>
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {app.customerPhone}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(app)}
                  className="flex-1 md:flex-none px-4 py-2 border border-gray-200 text-sm font-bold rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                {(app.status === 'CONFIRMED' || app.status === 'PENDING') && (
                  <>
                    <button
                      onClick={() => handleMarkDone(app.id)}
                      className="flex-1 md:flex-none px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-black/90 transition-all flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Done
                    </button>
                    <button
                      onClick={() => handleCancel(app.id)}
                      className="flex-1 md:flex-none px-4 py-2 border border-gray-200 text-sm font-bold rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex items-center gap-2"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <EditAppointmentModal
        appointment={editingAppointment}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAppointment(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
}

