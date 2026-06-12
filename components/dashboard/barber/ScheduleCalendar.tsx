'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import type { Barber } from '@/lib/types';
import { useI18n } from '@/contexts/I18nContext';
import { BOOKING_SLOT_MINUTES } from '@/lib/utils/bookingSlots';
import {
  type WorkingHoursMap,
  type LunchHoursMap,
  type BlockedDateRange,
  getShopTodayYMD,
  getShopCalendarTimeSlots,
  getShopCalendarSlotStatus,
  formatAppointmentTimeInShopTz,
  formatShopCalendarDateLabel,
  parseAppointmentInstant,
  shopLocalDateTimeToUtc,
} from '@/lib/utils/shopHours';
import CreateAppointmentModal from './CreateAppointmentModal';
import AppointmentDetailsModal from './AppointmentDetailsModal';

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceName?: string;
  serviceDuration?: number;
  servicePrice?: number;
  notes?: string;
  barberName?: string;
  shopName?: string;
}

interface ScheduleCalendarProps {
  barberId?: string;
  shopId?: string;
  /** Start in „всички бръснари“ mode when salon has a shopId */
  defaultTeamView?: boolean;
}

export default function ScheduleCalendar({
  barberId,
  shopId,
  defaultTeamView = false,
}: ScheduleCalendarProps) {
  const { t, locale } = useI18n();
  const [selectedDate, setSelectedDate] = useState(getShopTodayYMD());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const [y, mo, d] = getShopTodayYMD().split('-').map(Number);
    return new Date(y, mo - 1, d);
  });
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHoursMap | undefined>();
  const [lunchStart, setLunchStart] = useState<string | undefined>();
  const [lunchEnd, setLunchEnd] = useState<string | undefined>();
  const [lunchHours, setLunchHours] = useState<LunchHoursMap | undefined>();
  const [blockedDates, setBlockedDates] = useState<BlockedDateRange[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>(() => {
    if (defaultTeamView && shopId) return 'all';
    return barberId || 'all';
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (defaultTeamView && shopId) {
      setSelectedBarberId('all');
    }
  }, [defaultTeamView, shopId]);
  const [modalSelectedDate, setModalSelectedDate] = useState<string | undefined>(undefined);
  const [modalBarbers, setModalBarbers] = useState<Barber[]>([]);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Load barbers for the shop so the barber can view teammates' calendars
  useEffect(() => {
    const loadBarbers = async () => {
      try {
        const response = await fetch('/api/barbers', { credentials: 'include' });
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
    const loadShopSettings = async () => {
      if (!shopId) return;
      try {
        const [shopRes, blockedRes] = await Promise.all([
          fetch(`/api/shops/${shopId}`, { credentials: 'include' }),
          fetch(`/api/shops/${shopId}/blocked-dates`, { credentials: 'include' }),
        ]);
        if (shopRes.ok) {
          const shop = await shopRes.json();
          setWorkingHours(shop.workingHours);
          setLunchStart(shop.lunchStart);
          setLunchEnd(shop.lunchEnd);
          setLunchHours(shop.lunchHours);
        }
        if (blockedRes.ok) {
          const rows = await blockedRes.json();
          setBlockedDates(
            (rows as { id: string; startDate: string; endDate: string; label?: string }[]).map((r) => ({
              id: r.id,
              startDate: r.startDate,
              endDate: r.endDate,
              label: r.label,
            }))
          );
        }
      } catch (error) {
        console.error('Error loading shop settings for calendar:', error);
      }
    };

    loadShopSettings();
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

        const response = await fetch(url, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          // Store full appointment data (not just basic fields)
          let filtered = data.filter(
            (apt: Appointment) => apt.status === 'PENDING' || apt.status === 'CONFIRMED'
          );
          
          // Enrich with barber name if viewing a specific barber and it's missing
          if (selectedBarberId && selectedBarberId !== 'all' && barbers.length > 0) {
            const barber = barbers.find(b => b.id === selectedBarberId);
            if (barber) {
              filtered = filtered.map((apt: Appointment) => ({
                ...apt,
                barberName: apt.barberName || barber.displayName
              }));
            }
          }
          
          setAppointments(filtered);
        }
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    loadAppointments();
  }, [barberId, shopId, selectedBarberId, selectedDate, barbers]);

  const handleCreate = async (appointmentData: any) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        credentials: 'include',
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

          const reloadResponse = await fetch(url, { credentials: 'include' });
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
        alert(`${t('dashboard.barber.failedToCreate')}: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating appointment from calendar:', error);
      alert(t('dashboard.barber.failedToCreate'));
    }
  };

  const slotOptions = useMemo(
    () => ({ lunchHours, lunchStart, lunchEnd, blockedRanges: blockedDates, slotMinutes: BOOKING_SLOT_MINUTES }),
    [lunchHours, lunchStart, lunchEnd, blockedDates]
  );

  const timeSlots = useMemo(
    () => getShopCalendarTimeSlots(selectedDate, workingHours, slotOptions),
    [selectedDate, workingHours, slotOptions]
  );

  const busyRanges = useMemo(
    () =>
      appointments.map((apt) => ({
        start: parseAppointmentInstant(apt.startTime),
        end: parseAppointmentInstant(apt.endTime),
      })),
    [appointments]
  );

  const getDateFromYMD = (ymd: string) => {
    const [year, month, day] = ymd.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const toCalendarYMD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getAppointmentForSlot = (timeStr: string): Appointment | null => {
    const slotStart = shopLocalDateTimeToUtc(selectedDate, timeStr);
    const slotEnd = new Date(slotStart.getTime() + BOOKING_SLOT_MINUTES * 60000);

    return (
      appointments.find((apt) => {
        const aptStart = parseAppointmentInstant(apt.startTime);
        const aptEnd = parseAppointmentInstant(apt.endTime);
        return slotStart < aptEnd && slotEnd > aptStart;
      }) || null
    );
  };

  const getSlotStatus = (timeStr: string) =>
    getShopCalendarSlotStatus(selectedDate, timeStr, workingHours, busyRanges, slotOptions);

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
  const shopToday = getShopTodayYMD();

  const isToday = (date: Date) => toCalendarYMD(date) === shopToday;

  const isSelected = (date: Date) => toCalendarYMD(date) === selectedDate;

  const formatDate = (dateStr: string) => formatShopCalendarDateLabel(dateStr, locale, 'long');

  const formatMonthYear = (date: Date) => {
    if (locale === 'bg') {
      const bgMonths = ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'];
      return `${bgMonths[date.getMonth()]} ${date.getFullYear()}`;
    }
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
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
        <p className="text-gray-500">{t('dashboard.barber.loadingSchedule')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold">{t('dashboard.barber.scheduleCalendar')}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <Users className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {selectedBarberId === 'all'
                  ? t('dashboard.barber.allBarbers')
                  : barbers.find(b => b.id === selectedBarberId)?.displayName || t('dashboard.barber.mySchedule')}
              </span>
            </div>
          </div>
          {barbers.length > 0 && (
            <select
              value={selectedBarberId}
              onChange={e => setSelectedBarberId(e.target.value)}
              className="w-full sm:w-auto min-h-[44px] bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-black outline-none touch-manipulation"
            >
              <option value="all">{t('dashboard.barber.allBarbers')}</option>
              {barbers.map(b => (
                <option key={b.id} value={b.id}>
                  {b.displayName}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2.5 min-h-[44px] min-w-[44px] hover:bg-gray-100 rounded-lg transition-colors touch-manipulation flex items-center justify-center"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-base sm:text-lg font-bold flex-1 text-center min-w-0 px-1">
            {formatMonthYear(currentMonth)}
          </h3>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2.5 min-h-[44px] min-w-[44px] hover:bg-gray-100 rounded-lg transition-colors touch-manipulation flex items-center justify-center"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-6">
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2 sm:mb-4">
          {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map(day => (
            <div key={day} className="text-center text-[10px] sm:text-sm font-bold text-gray-500 py-1 sm:py-2">
              {t(`dashboard.barber.dayNames.${day}`)}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {calendarDays.map((dayInfo, index) => {
            const dateStr = toCalendarYMD(dayInfo.date);
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
                  aspect-square p-1 sm:p-2 rounded-lg border-2 transition-all touch-manipulation min-h-[40px] sm:min-h-0
                  ${!dayInfo.isCurrentMonth ? 'text-gray-300' : ''}
                  ${daySelected ? 'border-black bg-black text-white' : 'border-transparent hover:border-gray-300 active:bg-gray-50'}
                  ${dayIsToday && !daySelected ? 'border-blue-500' : ''}
                `}
                disabled={!dayInfo.isCurrentMonth}
              >
                <div className="text-xs sm:text-sm font-medium">{dayInfo.date.getDate()}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date and Time Slots */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-6">
        <div className="flex items-start gap-2 mb-4 sm:mb-6 min-w-0">
          <Calendar className="w-5 h-5 shrink-0 mt-0.5" />
          <h3 className="text-base sm:text-xl font-bold break-words">{formatDate(selectedDate)}</h3>
        </div>

        {timeSlots.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">{t('booking.dayClosed')}</p>
        ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
          {timeSlots.map((timeStr) => {
            const slotStatus = getSlotStatus(timeStr);
            const isTaken = slotStatus === 'taken';
            const isClosed = slotStatus === 'closed';
            const appointment = isTaken ? getAppointmentForSlot(timeStr) : null;
            
            return (
              <button
                key={timeStr}
                type="button"
                onClick={() => {
                  if (isClosed) return;
                  if (isTaken && appointment) {
                    setSelectedAppointment(appointment);
                    setIsDetailsModalOpen(true);
                    return;
                  }
                  
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
                disabled={isClosed || (!isTaken && !shopId)}
                className={`
                  py-3 px-2 min-h-[44px] rounded-lg text-center text-sm font-medium border-2 transition-all touch-manipulation
                  ${isClosed
                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isTaken 
                    ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-100 cursor-pointer' 
                    : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100 active:bg-green-100 cursor-pointer'
                  }
                `}
                title={appointment 
                  ? `${t('dashboard.barber.taken')}: ${formatAppointmentTimeInShopTz(appointment.startTime)} - ${formatAppointmentTimeInShopTz(appointment.endTime)}` 
                  : isClosed
                    ? t('booking.slotUnavailable')
                    : t('dashboard.barber.available')}
              >
                {timeStr}
              </button>
            );
          })}
        </div>
        )}

        {/* Legend */}
        <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-green-300 bg-green-50"></div>
            <span className="text-gray-600">{t('dashboard.barber.available')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-red-300 bg-red-50"></div>
            <span className="text-gray-600">{t('dashboard.barber.taken')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-gray-200 bg-gray-100"></div>
            <span className="text-gray-600">{t('booking.slotUnavailable')}</span>
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
          workingHours={workingHours}
          lunchStart={lunchStart}
          lunchEnd={lunchEnd}
          lunchHours={lunchHours}
        />
      )}

      <AppointmentDetailsModal
        appointment={selectedAppointment}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedAppointment(null);
        }}
      />
    </div>
  );
}
