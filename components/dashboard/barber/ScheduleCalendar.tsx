'use client';

import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import type { Barber } from '@/lib/types';
import CreateAppointmentModal from './CreateAppointmentModal';

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface ScheduleCalendarProps {
  barberId?: string;
  shopId?: string;
}

export default function ScheduleCalendar({ barberId, shopId }: ScheduleCalendarProps) {
  // Store selected date as YYYY-MM-DD in local time (avoid timezone shift issues)
  const getTodayYMD = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayYMD());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>(barberId || 'all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalSelectedDate, setModalSelectedDate] = useState<string | undefined>(undefined);
  const [modalBarbers, setModalBarbers] = useState<Barber[]>([]);

  // Load barbers for the shop so the barber can view teammates' calendars
  useEffect(() => {
    const loadBarbers = async () => {
      try {
        const response = await fetch('/api/barbers');
        if (!response.ok) return;
        const data: Barber[] = await response.json();
        // Filter to current shop if provided
        const filtered = shopId ? data.filter(b => b.shopId === shopId && b.isActive) : data;
        setBarbers(filtered);
      } catch (error) {
        console.error('Error loading barbers for calendar:', error);
      }
    };

    loadBarbers();
  }, [shopId]);

  useEffect(() => {
    // Need at least a shop or specific barber to show anything useful
    if (!shopId && !selectedBarberId) {
      setLoading(false);
      return;
    }

    const loadAppointments = async () => {
      try {
        let url: string;
        if (selectedBarberId && selectedBarberId !== 'all') {
          // Single barber view
          url = `/api/barbers/${selectedBarberId}/appointments?date=${selectedDate}`;
        } else if (shopId) {
          // Team view for shop – show all barbers' appointments as busy slots
          url = `/api/appointments?shopId=${shopId}&date=${selectedDate}&status=PENDING,CONFIRMED`;
        } else if (barberId) {
          // Fallback to current barber only
          url = `/api/barbers/${barberId}/appointments?date=${selectedDate}`;
        } else {
          setAppointments([]);
          setLoading(false);
          return;
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setAppointments(
            data.filter(
              (apt: Appointment) => apt.status === 'PENDING' || apt.status === 'CONFIRMED'
            )
          );
        }
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    loadAppointments();
  }, [barberId, shopId, selectedBarberId, selectedDate]);

  const handleCreate = async (appointmentData: any) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      });

      if (response.ok) {
        // Reload appointments for current view context
        try {
          let url: string;
          if (selectedBarberId && selectedBarberId !== 'all') {
            url = `/api/barbers/${selectedBarberId}/appointments?date=${selectedDate}`;
          } else if (shopId) {
            url = `/api/appointments?shopId=${shopId}&date=${selectedDate}&status=PENDING,CONFIRMED`;
          } else if (barberId) {
            url = `/api/barbers/${barberId}/appointments?date=${selectedDate}`;
          } else {
            setAppointments([]);
            setIsCreateModalOpen(false);
            return;
          }

          const reloadResponse = await fetch(url);
          if (reloadResponse.ok) {
            const data = await reloadResponse.json();
            setAppointments(
              data.filter(
                (apt: Appointment) => apt.status === 'PENDING' || apt.status === 'CONFIRMED'
              )
            );
          }
        } catch (error) {
          console.error('Error reloading appointments after create:', error);
        }
        setIsCreateModalOpen(false);
      } else {
        const error = await response.json();
        alert(`Failed to create appointment: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating appointment from calendar:', error);
      alert('Failed to create appointment');
    }
  };

  // Generate time slots (9:00 AM to 6:00 PM in 30-minute intervals)
  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeStr);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const getDateFromYMD = (ymd: string) => {
    const [year, month, day] = ymd.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Check if a time slot is taken
  const isTimeSlotTaken = (timeStr: string): boolean => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const slotStart = getDateFromYMD(selectedDate);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30);

    return appointments.some(apt => {
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);
      // Check if the slot overlaps with any appointment
      return (slotStart < aptEnd && slotEnd > aptStart);
    });
  };

  // Get appointment info for a time slot
  const getAppointmentForSlot = (timeStr: string): Appointment | null => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const slotStart = getDateFromYMD(selectedDate);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30);

    return appointments.find(apt => {
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);
      return (slotStart < aptEnd && slotEnd > aptStart);
    }) || null;
  };

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Add days from previous month
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }

    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }

    // Add days from next month to fill the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({ date, isCurrentMonth: false });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = (date: Date) => {
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate.getTime() === today.getTime();
  };

  const isSelected = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return dateStr === selectedDate;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('bg-BG', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-500">Loading schedule...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Schedule Calendar</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            <span>
              {selectedBarberId === 'all'
                ? 'Всички бръснари'
                : barbers.find(b => b.id === selectedBarberId)?.displayName || 'Моят график'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {barbers.length > 0 && (
            <select
              value={selectedBarberId}
              onChange={e => setSelectedBarberId(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-black outline-none"
            >
              <option value="all">Всички бръснари</option>
              {barbers.map(b => (
                <option key={b.id} value={b.id}>
                  {b.displayName}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-bold min-w-[200px] text-center">
            {currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-bold text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((dayInfo, index) => {
            const dateStr = dayInfo.date.toISOString().split('T')[0];
            const daySelected = isSelected(dayInfo.date);
            const dayIsToday = isToday(dayInfo.date);
            
            return (
              <button
                key={index}
                onClick={() => {
                  if (dayInfo.isCurrentMonth) {
                    setSelectedDate(dateStr);
                  }
                }}
                className={`
                  aspect-square p-2 rounded-lg border-2 transition-all
                  ${!dayInfo.isCurrentMonth ? 'text-gray-300' : ''}
                  ${daySelected ? 'border-black bg-black text-white' : 'border-transparent hover:border-gray-300'}
                  ${dayIsToday && !daySelected ? 'border-blue-500' : ''}
                `}
                disabled={!dayInfo.isCurrentMonth}
              >
                <div className="text-sm font-medium">{dayInfo.date.getDate()}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date and Time Slots */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5" />
          <h3 className="text-xl font-bold">{formatDate(getDateFromYMD(selectedDate))}</h3>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {timeSlots.map((timeStr) => {
            const isTaken = isTimeSlotTaken(timeStr);
            const appointment = getAppointmentForSlot(timeStr);
            
            return (
              <button
                key={timeStr}
                type="button"
                onClick={() => {
                  if (isTaken) return;
                  const targetBarberId =
                    selectedBarberId && selectedBarberId !== 'all'
                      ? selectedBarberId
                      : barberId;
                  if (!shopId || !targetBarberId) return;

                  const targetBarber = barbers.find(b => b.id === targetBarberId);
                  const orderedBarbers = targetBarber
                    ? [targetBarber, ...barbers.filter(b => b.id !== targetBarberId)]
                    : barbers;

                  setModalBarbers(orderedBarbers);
                  setModalSelectedDate(selectedDate);
                  setIsCreateModalOpen(true);
                }}
                disabled={isTaken || !shopId}
                className={`
                  py-3 px-2 rounded-lg text-center text-sm font-medium border-2 transition-all
                  ${isTaken 
                    ? 'border-red-300 bg-red-50 text-red-700' 
                    : 'border-green-300 bg-green-50 text-green-700'
                  }
                `}
                title={appointment ? `Taken: ${new Date(appointment.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} - ${new Date(appointment.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : 'Available'}
              >
                {timeStr}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-green-300 bg-green-50"></div>
            <span className="text-gray-600">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-red-300 bg-red-50"></div>
            <span className="text-gray-600">Taken</span>
          </div>
        </div>
      </div>

      {shopId && barbers.length > 0 && (
        <CreateAppointmentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreate}
          shopId={shopId}
          barbers={modalBarbers.length > 0 ? modalBarbers : barbers}
          selectedDate={modalSelectedDate}
        />
      )}
    </div>
  );
}
