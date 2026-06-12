'use client';

import { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, CheckCircle, Coffee, Trash2, Clock } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import {
  addCalendarDays,
  formatAppointmentTimeInShopTz,
  formatShopCalendarDateLabel,
  getShopTodayYMD,
} from '@/lib/utils/shopHours';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  type: 'AVAILABLE' | 'BREAK';
  isAvailable: boolean;
  isBooked: boolean;
}

interface ManageAvailabilityProps {
  barberId?: string;
}

export default function ManageAvailability({ barberId }: ManageAvailabilityProps) {
  const { t, locale } = useI18n();
  const [selectedDate, setSelectedDate] = useState(getShopTodayYMD());
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!barberId) {
      setLoading(false);
      return;
    }

    const loadAvailability = async () => {
      try {
        const response = await fetch(`/api/barbers/${barberId}/availability?date=${selectedDate}`);
        
        if (response.ok) {
          const data = await response.json();
          setSlots(data.slots || []);
        }
      } catch (error) {
        console.error('Error loading availability:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, [barberId, selectedDate]);

  const formatTime = (timeString: string) => formatAppointmentTimeInShopTz(timeString);

  const formatDate = (dateStr: string) => formatShopCalendarDateLabel(dateStr, locale, 'long');

  const changeDate = (days: number) => {
    setSelectedDate((prev) => addCalendarDays(prev, days));
  };

  const getSlotLabel = (slot: TimeSlot) => {
    if (slot.isBooked) return t('dashboard.barber.booked');
    if (slot.type === 'BREAK') return t('dashboard.barber.slotBreak');
    return t('dashboard.barber.available');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{t('dashboard.barber.manageAvailability')}</h2>
            <p className="text-gray-500">{t('dashboard.barber.setWorkingHoursDescription')}</p>
          </div>
        </div>
        <div className="text-center py-12 text-gray-400">{t('dashboard.barber.loadingSchedule')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t('dashboard.barber.manageAvailability')}</h2>
          <p className="text-gray-500">{t('dashboard.barber.setWorkingHoursDescription')}</p>
        </div>
        <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-black/90 transition-all">
          <Plus className="w-4 h-4" /> {t('dashboard.barber.addSlot')}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
          <button 
            onClick={() => changeDate(-1)}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold">{formatDate(selectedDate)}</span>
          <button 
            onClick={() => changeDate(1)}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {slots.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t('dashboard.barber.noAvailabilitySlots')}</p>
              <p className="text-sm mt-2">{t('dashboard.barber.clickAddSlotHint')}</p>
            </div>
          ) : (
            slots.map((slot) => (
              <div 
                key={slot.id} 
                className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                  slot.isBooked ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      slot.isBooked 
                        ? 'bg-blue-100 text-blue-600'
                        : slot.type === 'AVAILABLE' 
                        ? 'bg-green-50 text-green-600' 
                        : 'bg-orange-50 text-orange-600'
                    }`}
                  >
                    {slot.isBooked ? (
                      <Clock className="w-6 h-6" />
                    ) : slot.type === 'AVAILABLE' ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Coffee className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold">
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </p>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                      {getSlotLabel(slot)}
                    </p>
                  </div>
                </div>
                <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}



