'use client';

import { useState } from 'react';
import { Users, Calendar, Scissors, Phone, Edit2, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { getStatusBadge } from '@/lib/utils';
import type { AppointmentStatus } from '@/lib/types';
import type { Barber } from '@/lib/types';

interface Appointment {
  id: string;
  barberId?: string;
  barberName?: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  shopId?: string;
  shopName?: string;
}

interface BarbersTabProps {
  barbers: Barber[];
  appointments: Appointment[];
  barberAppointments: Appointment[];
  selectedBarberId: string | null;
  onBarberSelect: (barberId: string | null) => void;
  barberViewDate: string;
  onDateChange: (date: string) => void;
  sortBy: 'name' | 'appointments';
  onSortChange: (sortBy: 'name' | 'appointments') => void;
  onEditAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (appointmentId: string) => void;
  deletingId: string | null;
  onReloadAppointments: () => void;
}

export default function BarbersTab({
  barbers,
  appointments,
  barberAppointments,
  selectedBarberId,
  onBarberSelect,
  barberViewDate,
  onDateChange,
  sortBy,
  onSortChange,
  onEditAppointment,
  onDeleteAppointment,
  deletingId,
  onReloadAppointments
}: BarbersTabProps) {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Sort barbers
  const sortedBarbers = [...barbers].sort((a, b) => {
    if (sortBy === 'name') {
      const nameA = a.displayName.toLowerCase();
      const nameB = b.displayName.toLowerCase();
      return sortOrder === 'asc' 
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    } else {
      // Sort by appointment count
      const countA = appointments.filter(apt => apt.barberId === a.id).length;
      const countB = appointments.filter(apt => apt.barberId === b.id).length;
      return sortOrder === 'asc' ? countA - countB : countB - countA;
    }
  });

  const getBarberAppointmentCount = (barberId: string) => {
    return appointments.filter(apt => apt.barberId === barberId).length;
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
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

  const handleSort = (newSortBy: 'name' | 'appointments') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(newSortBy);
      setSortOrder('asc');
    }
  };

  const selectedBarber = barbers.find(b => b.id === selectedBarberId);

  return (
    <div className="space-y-6">
      {!selectedBarberId ? (
        <>
          {/* Barbers List View */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Barbers</h2>
              <p className="text-sm text-gray-500 mt-1">View and manage your barbers</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <button
                onClick={() => handleSort('name')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all flex items-center gap-2 ${
                  sortBy === 'name'
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Name
                {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
              </button>
              <button
                onClick={() => handleSort('appointments')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all flex items-center gap-2 ${
                  sortBy === 'appointments'
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Appointments
                {sortBy === 'appointments' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Barber</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Shop</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Appointments</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedBarbers.map((barber) => {
                    const appointmentCount = getBarberAppointmentCount(barber.id);
                    return (
                      <tr
                        key={barber.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => onBarberSelect(barber.id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-bold">{barber.displayName}</p>
                              {barber.bio && (
                                <p className="text-sm text-gray-500">{barber.bio.substring(0, 50)}...</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">{barber.shop?.name || 'Unknown Shop'}</p>
                          {barber.shop?.city && (
                            <p className="text-xs text-gray-500">{barber.shop.city}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-bold text-sm">
                            {appointmentCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onBarberSelect(barber.id);
                            }}
                            className="px-4 py-2 text-sm font-bold text-black hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            View Schedule
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Barber Detail View with Appointments */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onBarberSelect(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowUp className="w-5 h-5 rotate-[-90deg]" />
              </button>
              <div>
                <h2 className="text-2xl font-bold">{selectedBarber?.displayName}</h2>
                <p className="text-sm text-gray-500">{selectedBarber?.shop?.name}</p>
              </div>
            </div>
            <input
              type="date"
              value={barberViewDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Appointments</h3>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(barberViewDate).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            <div className="p-6">
              {barberAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">No Appointments</h3>
                  <p className="text-gray-500">
                    No appointments found for {selectedBarber?.displayName} on this date.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {barberAppointments.map((app) => (
                    <div
                      key={app.id}
                      className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div className="bg-white p-3 rounded-lg text-center min-w-[120px]">
                          <p className="text-xs font-bold text-gray-500 uppercase">Time</p>
                          <p className="font-bold text-sm">{formatTimeRange(app.startTime, app.endTime)}</p>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                          onClick={() => onEditAppointment(app)}
                          className="px-4 py-2 border border-gray-200 text-sm font-bold rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => onDeleteAppointment(app.id)}
                          disabled={deletingId === app.id}
                          className="px-4 py-2 border border-red-200 text-red-600 text-sm font-bold rounded-lg hover:bg-red-50 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" /> {deletingId === app.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
