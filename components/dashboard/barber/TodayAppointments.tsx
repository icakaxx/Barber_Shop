'use client';

import { useState, useEffect } from 'react';
import { Calendar, Scissors, Phone, Edit2, Check, X } from 'lucide-react';
import { getStatusBadge } from '@/lib/utils';
import type { AppointmentStatus } from '@/lib/types';
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'PENDING', 'CONFIRMED', 'DONE', 'CANCELLED'

  useEffect(() => {
    const loadAppointments = async () => {
      if (!barberId) {
        setLoading(false);
        return;
      }

      try {
        let url = `/api/barbers/${barberId}/appointments?date=${selectedDate}`;
        if (statusFilter !== 'all') {
          url += `&status=${statusFilter}`;
        }
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          setAppointments(data);
        } else {
          console.error('Failed to load appointments:', response.status);
        }
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [barberId, selectedDate, statusFilter]);

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const getDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    return diffMinutes;
  };

  const parseServicesFromNotes = (notes: string | undefined): string[] => {
    if (!notes) return [];
    const match = notes.match(/Additional services:\s*(.+?)(?:\n|$)/i);
    if (match && match[1]) {
      return match[1].split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
    return [];
  };

  const getAllServices = (app: Appointment): string[] => {
    const services = [app.serviceName];
    const additionalServices = parseServicesFromNotes(app.notes);
    return [...services, ...additionalServices];
  };

  // Calculate free time slots
  const getFreeTimeSlots = () => {
    const workingHours = { start: 9, end: 18 }; // 9 AM to 6 PM
    const freeSlots: Array<{ start: string; end: string }> = [];
    
    // Sort appointments by start time
    const sortedAppointments = [...appointments]
      .filter(apt => apt.status === 'PENDING' || apt.status === 'CONFIRMED')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    // Get the selected date
    const date = new Date(selectedDate + 'T00:00:00');
    const today = new Date();
    const isToday = selectedDate === today.toISOString().split('T')[0];
    
    // Start from beginning of day or current time if today
    let currentTime = new Date(date);
    if (isToday) {
      const now = new Date();
      currentTime.setHours(Math.max(workingHours.start, now.getHours()), 
                          now.getHours() === workingHours.start ? Math.max(0, now.getMinutes()) : 0, 0);
    } else {
      currentTime.setHours(workingHours.start, 0, 0);
    }
    
    const endOfDay = new Date(date);
    endOfDay.setHours(workingHours.end, 0, 0);
    
    // Find gaps between appointments
    for (const apt of sortedAppointments) {
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);
      
      // Check if there's a gap before this appointment
      if (aptStart > currentTime) {
        freeSlots.push({
          start: currentTime.toISOString(),
          end: aptStart.toISOString()
        });
      }
      
      // Move current time to end of this appointment
      if (aptEnd > currentTime) {
        currentTime = new Date(aptEnd);
      }
    }
    
    // Check for gap after last appointment
    if (currentTime < endOfDay) {
      freeSlots.push({
        start: currentTime.toISOString(),
        end: endOfDay.toISOString()
      });
    }
    
    return freeSlots.filter(slot => {
      const slotStart = new Date(slot.start);
      return slotStart < endOfDay;
    });
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
        let url = `/api/barbers/${barberId}/appointments?date=${selectedDate}`;
        if (statusFilter !== 'all') {
          url += `&status=${statusFilter}`;
        }
        const reloadResponse = await fetch(url);
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
        let url = `/api/barbers/${barberId}/appointments?date=${selectedDate}`;
        if (statusFilter !== 'all') {
          url += `&status=${statusFilter}`;
        }
        const reloadResponse = await fetch(url);
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
        let url = `/api/barbers/${barberId}/appointments?date=${selectedDate}`;
        if (statusFilter !== 'all') {
          url += `&status=${statusFilter}`;
        }
        const reloadResponse = await fetch(url);
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

  const freeSlots = getFreeTimeSlots();
  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const displayDate = new Date(selectedDate + 'T00:00:00');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold">Appointments Schedule</h2>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-black focus:outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-black focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="DONE">Done</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Free Time Slots Section */}
      {freeSlots.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-bold text-sm text-blue-900 mb-3 uppercase">Available Time Slots</h3>
          <div className="flex flex-wrap gap-2">
            {freeSlots.map((slot, index) => {
              const start = new Date(slot.start);
              const end = new Date(slot.end);
              const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
              return (
                <div
                  key={index}
                  className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-sm font-medium text-blue-700"
                >
                  {formatTime(slot.start)} - {formatTime(slot.end)} ({duration} min)
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Appointments List */}
      <div className="grid gap-4">
        {appointments.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">
              No appointments for {isToday ? 'today' : displayDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}.
            </p>
            {freeSlots.length === 0 && (
              <p className="text-sm text-gray-400 mt-2">No free time slots available.</p>
            )}
          </div>
        ) : (
          appointments.map((app) => (
            <div
              key={app.id}
              className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="bg-gray-100 p-3 rounded-lg text-center min-w-[120px]">
                  <p className="text-xs font-bold text-gray-500 uppercase">Time</p>
                  <p className="font-bold text-sm">{formatTimeRange(app.startTime, app.endTime)}</p>
                  <p className="text-xs text-gray-500 mt-1">{getDuration(app.startTime, app.endTime)} min</p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">{app.customerName}</h3>
                     {getStatusBadge(app.status as AppointmentStatus)}
                  </div>
                  <div className="text-sm text-gray-600 flex items-start gap-1 mb-1">
                    <Scissors className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <div>
                      {getAllServices(app).map((service, index) => (
                        <span key={index}>
                          {service}
                          {index < getAllServices(app).length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  </div>
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

