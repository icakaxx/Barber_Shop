'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, Scissors, Filter, X } from 'lucide-react';
import { getBarbers } from '@/lib/supabase/barbers';
import type { Barber } from '@/lib/types';
import { getStatusBadge } from '@/lib/utils/statusBadge';
import { useI18n } from '@/contexts/I18nContext';

interface Appointment {
  id: string;
  barberId: string;
  barberName: string;
  serviceName: string;
  serviceDuration: number;
  servicePrice: number;
  shopName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'DONE';
  cancelReason?: string;
  notes?: string;
}

export default function AppointmentsTab() {
  const { t } = useI18n();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBarber, setSelectedBarber] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadBarbers();
    loadAppointments();
  }, [selectedBarber, selectedDate, selectedStatus]);

  const loadBarbers = async () => {
    try {
      const data = await getBarbers();
      setBarbers(data);
    } catch (error) {
      console.error('Error loading barbers:', error);
    }
  };

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBarber !== 'all') {
        params.append('barberId', selectedBarber);
      }
      if (selectedDate) {
        params.append('date', selectedDate);
      }
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }

      const response = await fetch(`/api/appointments?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('admin.appointmentsManagement')}</h2>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-bold text-gray-900">{t('admin.filters')}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Barber Filter */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t('admin.barber')}
            </label>
            <select
              value={selectedBarber}
              onChange={(e) => setSelectedBarber(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
            >
              <option value="all">{t('admin.allBarbers')}</option>
              {barbers.map(barber => (
                <option key={barber.id} value={barber.id}>
                  {barber.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t('dashboard.owner.date')}
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t('admin.status')}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
            >
              <option value="all">{t('admin.allStatuses')}</option>
              <option value="PENDING">{t('appointments.pending')}</option>
              <option value="CONFIRMED">{t('appointments.confirmed')}</option>
              <option value="DONE">{t('appointments.done')}</option>
              <option value="CANCELLED">{t('admin.cancelled')}</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(selectedBarber !== 'all' || selectedStatus !== 'all') && (
          <button
            onClick={() => {
              setSelectedBarber('all');
              setSelectedStatus('all');
              setSelectedDate(new Date().toISOString().split('T')[0]);
            }}
            className="mt-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <X className="w-4 h-4" />
            {t('admin.clearFilters')}
          </button>
        )}
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            {t('admin.loadingAppointments')}
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-bold">{t('admin.noAppointmentsFound')}</p>
            <p className="text-sm">{t('admin.tryAdjustingFilters')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="bg-gray-100 p-3 rounded-lg text-center min-w-[100px]">
                        <p className="text-xs font-bold text-gray-500 uppercase">{t('admin.time')}</p>
                        <p className="font-bold">{formatTime(apt.startTime)}</p>
                        <p className="text-xs text-gray-400">{formatDate(apt.startTime)}</p>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg">{apt.customerName}</h3>
                          {getStatusBadge(apt.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="font-bold">{t('admin.barber')}:</span>
                            <span>{apt.barberName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Scissors className="w-4 h-4" />
                            <span className="font-bold">{t('admin.service')}:</span>
                            <span>{apt.serviceName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{apt.customerPhone}</span>
                          </div>
                          {apt.customerEmail && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span>{apt.customerEmail}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{apt.serviceDuration} min</span>
                            <span className="text-gray-400">•</span>
                            <span className="font-bold">{apt.servicePrice} BGN</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{t('admin.shop')}:</span>
                            <span>{apt.shopName}</span>
                          </div>
                        </div>
                        {apt.notes && (
                          <div className="mt-2 text-sm text-gray-500 italic">
                            {t('admin.note')}: {apt.notes}
                          </div>
                        )}
                        {apt.cancelReason && (
                          <div className="mt-2 text-sm text-red-600">
                            {t('admin.cancelled')}: {apt.cancelReason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {(apt.status === 'CONFIRMED' || apt.status === 'PENDING') && (
                      <>
                        <button className="px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-black/90 transition-all">
                          {t('admin.markDone')}
                        </button>
                        <button className="px-4 py-2 border border-gray-200 text-sm font-bold rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all">
                          {t('common.cancel')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

