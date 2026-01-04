'use client';

import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface ScheduleCalendarProps {
  barberId?: string;
}

export default function ScheduleCalendar({ barberId }: ScheduleCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (!barberId) {
      setLoading(false);
      return;
    }

    const loadAppointments = async () => {
      try {
        const response = await fetch(`/api/barbers/${barberId}/appointments?date=${selectedDate}`);
        if (response.ok) {
          const data = await response.json();
          setAppointments(data.filter((apt: Appointment) => 
            apt.status === 'PENDING' || apt.status === 'CONFIRMED'
          ));
        }
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [barberId, selectedDate]);

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

  // Check if a time slot is taken
  const isTimeSlotTaken = (timeStr: string): boolean => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const slotStart = new Date(selectedDate);
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
    const slotStart = new Date(selectedDate);
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
    const dateStr = date.toISOString().split('T')[0];
    return dateStr === selectedDate;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { 
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
        <h2 className="text-2xl font-bold">Schedule Calendar</h2>
        <div className="flex items-center gap-2">
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
          <h3 className="text-xl font-bold">{formatDate(new Date(selectedDate))}</h3>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {timeSlots.map((timeStr) => {
            const isTaken = isTimeSlotTaken(timeStr);
            const appointment = getAppointmentForSlot(timeStr);
            
            return (
              <div
                key={timeStr}
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
              </div>
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
    </div>
  );
}
