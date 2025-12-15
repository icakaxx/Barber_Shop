'use client';

import { useState, useEffect } from 'react';
import { Users, Calendar, Scissors, Phone, Edit2, Plus } from 'lucide-react';
import { getStatusBadge } from '@/lib/utils';
import EditAppointmentModal from './EditAppointmentModal';
import CreateAppointmentModal from './CreateAppointmentModal';
import type { Barber } from '@/lib/types';

interface Appointment {
  id: string;
  barberId: string;
  barberName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
}

interface TeamViewProps {
  shopId?: string;
  currentBarberId?: string;
}

export default function TeamView({ shopId, currentBarberId }: TeamViewProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const loadBarbers = async () => {
      try {
        const response = await fetch('/api/barbers');
        if (response.ok) {
          const data = await response.json();
          setBarbers(data);
          if (data.length > 0 && !selectedBarberId) {
            setSelectedBarberId('all');
          }
        }
      } catch (error) {
        console.error('Error loading barbers:', error);
      }
    };

    if (shopId) {
      loadBarbers();
    }
  }, [shopId]);

  useEffect(() => {
    const loadAppointments = async () => {
      if (!shopId) {
        setLoading(false);
        return;
      }

      try {
        let url = `/api/appointments?shopId=${shopId}&date=${selectedDate}`;
        if (selectedBarberId !== 'all') {
          url = `/api/barbers/${selectedBarberId}/appointments?date=${selectedDate}`;
        }

        const response = await fetch(url);
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
  }, [shopId, selectedBarberId, selectedDate]);

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsEditModalOpen(true);
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
        let url = `/api/appointments?shopId=${shopId}&date=${selectedDate}`;
        if (selectedBarberId !== 'all') {
          url = `/api/barbers/${selectedBarberId}/appointments?date=${selectedDate}`;
        }
        const reloadResponse = await fetch(url);
        if (reloadResponse.ok) {
          const data = await reloadResponse.json();
          setAppointments(data);
        }
        setIsEditModalOpen(false);
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

  const handleCreate = async (appointmentData: any) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      });

      if (response.ok) {
        // Reload appointments
        let url = `/api/appointments?shopId=${shopId}&date=${selectedDate}`;
        if (selectedBarberId !== 'all') {
          url = `/api/barbers/${selectedBarberId}/appointments?date=${selectedDate}`;
        }
        const reloadResponse = await fetch(url);
        if (reloadResponse.ok) {
          const data = await reloadResponse.json();
          setAppointments(data);
        }
        setIsCreateModalOpen(false);
      } else {
        const error = await response.json();
        alert(`Failed to create appointment: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Failed to create appointment');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Team Schedule</h2>
        </div>
        <div className="text-center py-12 text-gray-400">Loading team appointments...</div>
      </div>
    );
  }

  const teamBarbers = barbers.filter(b => b.id !== currentBarberId && b.isActive);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Team Schedule</h2>
        <div className="flex gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-black outline-none"
          />
          <select
            value={selectedBarberId}
            onChange={(e) => setSelectedBarberId(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-black outline-none"
          >
            <option value="all">All Barbers</option>
            {teamBarbers.map((barber) => (
              <option key={barber.id} value={barber.id}>
                {barber.displayName}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-black/90 transition-all"
          >
            <Plus className="w-4 h-4" /> New Appointment
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {appointments.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-bold text-lg">No Appointments</h3>
            <p className="text-gray-500 max-w-sm mt-2">
              No appointments found for the selected date and barber.
            </p>
          </div>
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
                    {app.barberId !== currentBarberId && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">
                        {app.barberName}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Scissors className="w-3 h-3" /> {app.serviceName}
                  </p>
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {app.customerPhone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleEdit(app)}
                className="px-4 py-2 border border-gray-200 text-sm font-bold rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" /> Edit
              </button>
            </div>
          ))
        )}
      </div>

      <EditAppointmentModal
        appointment={editingAppointment}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingAppointment(null);
        }}
        onSave={handleSave}
      />

      <CreateAppointmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreate}
        shopId={shopId}
        barbers={teamBarbers}
      />
    </div>
  );
}

