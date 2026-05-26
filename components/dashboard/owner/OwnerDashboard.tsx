'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, Calendar, Users, Plus, Edit2, Trash2, Scissors, Settings, LogOut, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { getStatusBadge } from '@/lib/utils/statusBadge';
import EditAppointmentModal from '@/components/dashboard/barber/EditAppointmentModal';
import CreateAppointmentModal from '@/components/dashboard/barber/CreateAppointmentModal';
import ServicesManagementTab from './ServicesManagementTab';
import BarbersTab from './BarbersTab';
import ShopSettingsTab from './ShopSettingsTab';
import OwnerNotificationPanel from './OwnerNotificationPanel';
import LanguageCurrencySwitcher from '@/components/shared/LanguageCurrencySwitcher';
import { useI18n } from '@/contexts/I18nContext';
import type { Barber, AppointmentStatus } from '@/lib/types';
import { formatDateYYYYMMDDInTimeZone, SHOP_BUSINESS_TIMEZONE } from '@/lib/utils/shopHours';
import {
  getTodayDateStr,
  loadOwnerNotifications,
  saveOwnerNotifications,
  playBookingAlertSound,
  initOwnerAlertAudio,
  type OwnerNotificationItem,
} from '@/lib/utils/ownerNotifications';

function isValidDateParam(d: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(d);
}

interface Shop {
  id: string;
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  heroDescription?: string;
  workingHours?: Record<string, { open: string; close: string } | null>;
  lunchStart?: string;
  lunchEnd?: string;
}

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

interface OwnerDashboardProps {
  userEmail?: string | null;
}

export default function OwnerDashboard({ userEmail }: OwnerDashboardProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDateState] = useState(() => {
    const fromUrl = searchParams.get('date');
    if (fromUrl && isValidDateParam(fromUrl)) return fromUrl;
    return formatDateYYYYMMDDInTimeZone(new Date(), SHOP_BUSINESS_TIMEZONE);
  });
  const [notifications, setNotifications] = useState<OwnerNotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const knownAppointmentIdsRef = useRef<Set<string>>(new Set());
  const pollSessionStartRef = useRef<string>(new Date().toISOString());
  const skipNotificationIdsRef = useRef<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'appointments' | 'services' | 'barbers' | 'settings'>('appointments');
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [barberAppointments, setBarberAppointments] = useState<Appointment[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'appointments'>('name');
  const [barberViewDate, setBarberViewDateState] = useState(() => {
    const fromUrl = searchParams.get('barberDate');
    if (fromUrl && isValidDateParam(fromUrl)) return fromUrl;
    return formatDateYYYYMMDDInTimeZone(new Date(), SHOP_BUSINESS_TIMEZONE);
  });

  const syncDateToUrl = useCallback(
    (date: string, param: 'date' | 'barberDate' = 'date') => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(param, date);
      router.replace(`/owner?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const setSelectedDate = useCallback(
    (value: string | ((prev: string) => string)) => {
      setSelectedDateState((prev) => {
        const next = typeof value === 'function' ? value(prev) : value;
        syncDateToUrl(next, 'date');
        return next;
      });
    },
    [syncDateToUrl]
  );

  const setBarberViewDate = useCallback(
    (value: string | ((prev: string) => string)) => {
      setBarberViewDateState((prev) => {
        const next = typeof value === 'function' ? value(prev) : value;
        syncDateToUrl(next, 'barberDate');
        return next;
      });
    },
    [syncDateToUrl]
  );

  const refreshSelectedDateAppointments = useCallback(async () => {
    if (shops.length === 0 || !selectedShopId) return;
    try {
      const response = await fetch(
        `/api/appointments?shopId=${selectedShopId}&date=${selectedDate}`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data: Appointment[] = await response.json();
        data.sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
        setAppointments(data);
      }
    } catch (error) {
      console.error('Error refreshing appointments:', error);
    }
  }, [selectedShopId, selectedDate, shops.length]);

  const pushNotification = useCallback(
    (item: OwnerNotificationItem) => {
      if (skipNotificationIdsRef.current.has(item.appointmentId)) return;
      setNotifications((prev) => {
        if (prev.some((n) => n.appointmentId === item.appointmentId)) return prev;
        playBookingAlertSound();
        setNotificationsOpen(true);
        return [item, ...prev];
      });
    },
    []
  );

  useEffect(() => {
    initOwnerAlertAudio();
  }, []);

  useEffect(() => {
    if (!selectedShopId) return;
    pollSessionStartRef.current = new Date().toISOString();
    knownAppointmentIdsRef.current.clear();
    const today = getTodayDateStr();
    setNotifications(loadOwnerNotifications(selectedShopId, today));
  }, [selectedShopId]);

  useEffect(() => {
    if (!selectedShopId) return;
    saveOwnerNotifications(selectedShopId, getTodayDateStr(), notifications);
  }, [selectedShopId, notifications]);

  useEffect(() => {
    const loadShops = async () => {
      try {
        // Get shops owned by the current user
        // In production, this would use the authenticated user's ID
        const response = await fetch('/api/shops?owner=true', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setShops(data);
          if (data.length > 0) {
            setSelectedShopId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading shops:', error);
      }
    };

    loadShops();
  }, []);

  useEffect(() => {
    const loadBarbers = async () => {
      if (!selectedShopId) return;
      
      // Load barbers for selected shop
      try {
        const response = await fetch('/api/barbers', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          const shopBarbers = data.filter((b: Barber) => b.shopId === selectedShopId);
          setBarbers(shopBarbers);
        }
      } catch (error) {
        console.error('Error loading barbers:', error);
      }
    };

    if (selectedShopId) {
      loadBarbers();
    }
  }, [selectedShopId]);

  useEffect(() => {
    const loadAppointments = async () => {
      if (shops.length === 0) {
        setLoading(false);
        return;
      }

      try {
        let allAppointments: Appointment[] = [];

        if (selectedShopId) {
          // Load appointments for selected shop
          const response = await fetch(`/api/appointments?shopId=${selectedShopId}&date=${selectedDate}`, {
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            allAppointments = data;
          }
        }

        // Sort by start time
        allAppointments.sort((a, b) => 
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
        setAppointments(allAppointments);
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [selectedShopId, selectedDate, shops]);

  const handleNewBookingDetected = useCallback(
    (apt: {
      id: string;
      customerName: string;
      startTime: string;
      barberId?: string;
      status?: string;
    }) => {
      if (apt.status && !['PENDING', 'CONFIRMED'].includes(apt.status)) return;
      if (skipNotificationIdsRef.current.has(apt.id)) return;
      if (knownAppointmentIdsRef.current.has(apt.id)) return;
      knownAppointmentIdsRef.current.add(apt.id);

      const barberName = barbers.find((b) => b.id === apt.barberId)?.displayName;
      pushNotification({
        id: `${apt.id}-${Date.now()}`,
        appointmentId: apt.id,
        customerName: apt.customerName,
        barberName,
        startTime: apt.startTime,
        read: false,
        createdAt: new Date().toISOString(),
      });

      const aptDate = formatDateYYYYMMDDInTimeZone(new Date(apt.startTime), SHOP_BUSINESS_TIMEZONE);
      if (selectedDate === aptDate && selectedShopId) {
        void fetch(`/api/appointments?shopId=${selectedShopId}&date=${selectedDate}`, {
          credentials: 'include',
        })
          .then((r) => (r.ok ? r.json() : []))
          .then((data: Appointment[]) => setAppointments(data));
      }
    },
    [barbers, pushNotification, selectedDate, selectedShopId]
  );

  useEffect(() => {
    if (!selectedShopId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`shop-appointments-${selectedShopId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: `shop_id=eq.${selectedShopId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            customer_name: string;
            start_time: string;
            barber_id: string;
            status: string;
          };
          if (!row?.id) return;
          handleNewBookingDetected({
            id: row.id,
            customerName: row.customer_name,
            startTime: row.start_time,
            barberId: row.barber_id,
            status: row.status,
          });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Owner appointment realtime unavailable — using polling fallback');
        }
      });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedShopId, handleNewBookingDetected]);

  useEffect(() => {
    if (!selectedShopId) return;
    const poll = async () => {
      try {
        const since = encodeURIComponent(pollSessionStartRef.current);
        const res = await fetch(
          `/api/appointments?shopId=${selectedShopId}&createdAfter=${since}`,
          { credentials: 'include' }
        );
        if (!res.ok) return;
        const data: Appointment[] = await res.json();
        for (const apt of data) {
          handleNewBookingDetected({
            id: apt.id,
            customerName: apt.customerName,
            startTime: apt.startTime,
            barberId: apt.barberId,
            status: apt.status,
          });
        }
      } catch {
        // ignore polling errors
      }
    };
    void poll();
    const interval = setInterval(() => void poll(), 12000);
    return () => clearInterval(interval);
  }, [selectedShopId, handleNewBookingDetected]);

  // Load appointments for barber view when barber is selected
  useEffect(() => {
    const loadBarberAppointments = async () => {
      if (!selectedBarberId || currentTab !== 'barbers') {
        setBarberAppointments([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/barbers/${selectedBarberId}/appointments?date=${barberViewDate}`,
          { credentials: 'include' }
        );
        if (response.ok) {
          const data = await response.json();
          // Map the response to match Appointment interface
          const mappedAppointments: Appointment[] = data.map((apt: any) => ({
            id: apt.id,
            barberId: apt.barberId,
            barberName: barbers.find(b => b.id === apt.barberId)?.displayName || 'Unknown',
            serviceName: apt.serviceName,
            customerName: apt.customerName,
            customerPhone: apt.customerPhone,
            customerEmail: apt.customerEmail,
            startTime: apt.startTime,
            endTime: apt.endTime,
            status: apt.status,
            notes: apt.notes,
            shopId: apt.shopId,
            shopName: apt.shopName
          }));
          setBarberAppointments(mappedAppointments);
        }
      } catch (error) {
        console.error('Error loading barber appointments:', error);
      }
    };

    loadBarberAppointments();
  }, [selectedBarberId, barberViewDate, currentTab, barbers]);

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
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

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(`${dateString}T12:00:00`);
    return date.toLocaleDateString(locale === 'bg' ? 'bg-BG' : 'en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const shiftDateByDays = (dateString: string, days: number) => {
    const date = new Date(`${dateString}T12:00:00`);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsEditModalOpen(true);
  };

  const handleSave = async (updatedAppointment: Appointment) => {
    try {
      const response = await fetch(`/api/appointments/${updatedAppointment.id}`, {
        method: 'PUT',
        credentials: 'include',
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
        if (selectedShopId) {
          const reloadResponse = await fetch(
            `/api/appointments?shopId=${selectedShopId}&date=${selectedDate}`,
            { credentials: 'include' }
          );
          if (reloadResponse.ok) {
            const data = await reloadResponse.json();
            setAppointments(data);
          }
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
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      });

      if (response.ok) {
        const created = await response.json();
        if (created?.id) {
          skipNotificationIdsRef.current.add(created.id);
          knownAppointmentIdsRef.current.add(created.id);
        }
        if (selectedShopId) {
          const reloadResponse = await fetch(
            `/api/appointments?shopId=${selectedShopId}&date=${selectedDate}`,
            { credentials: 'include' }
          );
          if (reloadResponse.ok) {
            const data = await reloadResponse.json();
            setAppointments(data);
          }
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

  const handleDelete = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel/delete this appointment?')) return;

    setDeletingId(appointmentId);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        knownAppointmentIdsRef.current.delete(appointmentId);
        setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));
        setBarberAppointments((prev) => prev.filter((a) => a.id !== appointmentId));
        setNotifications((prev) => prev.filter((n) => n.appointmentId !== appointmentId));

        if (selectedShopId) {
          const reloadResponse = await fetch(
            `/api/appointments?shopId=${selectedShopId}&date=${selectedDate}`,
            { credentials: 'include' }
          );
          if (reloadResponse.ok) {
            const data = await reloadResponse.json();
            setAppointments(data);
          }
        }
        
        // Reload barber appointments if viewing barber tab
        if (selectedBarberId && currentTab === 'barbers') {
          const barberResponse = await fetch(
            `/api/barbers/${selectedBarberId}/appointments?date=${barberViewDate}`,
            { credentials: 'include' }
          );
          if (barberResponse.ok) {
            const barberData = await barberResponse.json();
            const barber = barbers.find(b => b.id === selectedBarberId);
            const mappedAppointments: Appointment[] = barberData.map((apt: any) => ({
              id: apt.id,
              barberId: apt.barberId,
              barberName: barber?.displayName || 'Unknown',
              serviceName: apt.serviceName,
              customerName: apt.customerName,
              customerPhone: apt.customerPhone,
              customerEmail: apt.customerEmail,
              startTime: apt.startTime,
              endTime: apt.endTime,
              status: apt.status,
              notes: apt.notes,
              shopId: apt.shopId,
              shopName: apt.shopName
            }));
            setBarberAppointments(mappedAppointments);
          }
        }
      } else {
        const error = await response.json();
        alert(`Failed to delete appointment: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Failed to delete appointment');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-500">Loading owner dashboard...</p>
        </div>
      </div>
    );
  }

  const activeBarbers = barbers.filter(b => b.isActive);
  const selectedShop = shops.find(s => s.id === selectedShopId);

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-2">
            <div className="flex items-start gap-3 min-w-0">
              <div className="bg-black p-2.5 sm:p-3 rounded-lg shrink-0">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold">{t('dashboard.owner.title')}</h1>
                <p className="text-gray-500 text-sm sm:text-base">{t('dashboard.owner.subtitle')}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 sm:justify-end">
              <OwnerNotificationPanel
                notifications={notifications}
                isOpen={notificationsOpen}
                onToggle={() => setNotificationsOpen((o) => !o)}
                onMarkRead={markNotificationRead}
                onDelete={deleteNotification}
                onSelectAppointmentDate={(dateStr) => setSelectedDate(dateStr)}
              />
              {userEmail && (
                <span className="text-xs sm:text-sm text-gray-500 truncate max-w-full sm:max-w-[200px] order-last sm:order-none w-full sm:w-auto">
                  {userEmail}
                </span>
              )}
              <button
                type="button"
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  router.push('/login?redirect=/owner');
                  router.refresh();
                }}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                {t('auth.logout')}
              </button>
              <LanguageCurrencySwitcher />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-end">
            {currentTab !== 'settings' && (
              <>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('dashboard.owner.date')}
                  </label>
                  <div className="flex items-center gap-2 w-full max-w-md sm:max-w-lg">
                    <button
                      type="button"
                      onClick={() => setSelectedDate((prev) => shiftDateByDays(prev, -1))}
                      aria-label={t('dashboard.owner.previousDay')}
                      className="h-[44px] w-[44px] shrink-0 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="min-w-[9.5rem] flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedDate((prev) => shiftDateByDays(prev, 1))}
                      aria-label={t('dashboard.owner.nextDay')}
                      className="h-[44px] w-[44px] shrink-0 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void refreshSelectedDateAppointments()}
                      className="h-[44px] w-[44px] shrink-0 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center"
                      aria-label={t('dashboard.owner.refreshAppointments')}
                      title={t('dashboard.owner.refreshAppointments')}
                    >
                      <RefreshCw className="w-4 h-4" aria-hidden />
                    </button>
                  </div>
                </div>
                <div className="w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-full sm:w-auto bg-black text-white px-6 py-3 min-h-[44px] rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-black/90 transition-all touch-manipulation"
                    disabled={activeBarbers.length === 0}
                  >
                    <Plus className="w-4 h-4 shrink-0" /> {t('dashboard.owner.newAppointment')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">{t('dashboard.owner.activeWorkers')}</span>
            </div>
            <p className="text-2xl font-bold">{activeBarbers.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">{t('dashboard.owner.appointmentsToday')}</span>
            </div>
            <p className="text-2xl font-bold">{appointments.length}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200 -mx-4 px-4 sm:mx-0 sm:px-0">
          <nav className="flex gap-1 sm:gap-4 overflow-x-auto scrollbar-hide pb-px -mb-px">
            <button
              type="button"
              onClick={() => setCurrentTab('appointments')}
              className={`px-3 sm:px-4 py-2.5 min-h-[44px] font-bold text-sm border-b-2 transition-colors flex items-center gap-2 shrink-0 whitespace-nowrap touch-manipulation ${
                currentTab === 'appointments'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              {t('dashboard.owner.appointments')}
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentTab('barbers');
                setSelectedBarberId(null);
              }}
              className={`px-3 sm:px-4 py-2.5 min-h-[44px] font-bold text-sm border-b-2 transition-colors flex items-center gap-2 shrink-0 whitespace-nowrap touch-manipulation ${
                currentTab === 'barbers'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              {t('dashboard.owner.barbers')}
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab('services')}
              className={`px-3 sm:px-4 py-2.5 min-h-[44px] font-bold text-sm border-b-2 transition-colors flex items-center gap-2 shrink-0 whitespace-nowrap touch-manipulation ${
                currentTab === 'services'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Scissors className="w-4 h-4" />
              {t('dashboard.owner.services')}
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab('settings')}
              className={`px-3 sm:px-4 py-2.5 min-h-[44px] font-bold text-sm border-b-2 transition-colors flex items-center gap-2 shrink-0 whitespace-nowrap touch-manipulation ${
                currentTab === 'settings'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="w-4 h-4" />
              {t('dashboard.owner.settings')}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {currentTab === 'appointments' && (
          <>
            {/* Appointments List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold">
                  {t('dashboard.owner.appointments')} {selectedShop && `- ${selectedShop.name}`}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDisplayDate(selectedDate)}
                </p>
              </div>

          <div className="p-6">
            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-bold text-lg mb-2">{t('appointments.noAppointments')}</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  {t('appointments.noAppointments')}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {appointments.map((app) => (
                  <div
                    key={app.id}
                    className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="bg-white p-3 rounded-lg text-center min-w-[100px]">
                        <p className="text-xs font-bold text-gray-500 uppercase">{t('appointments.time')}</p>
                        <p className="font-bold">{formatTime(app.startTime)}</p>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-lg">{app.customerName}</h3>
                           {getStatusBadge(app.status as AppointmentStatus)}
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">
                            {app.barberName}
                          </span>
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
                        <p className="text-sm text-gray-400">{app.customerPhone}</p>
                        {app.notes && !app.notes.match(/Additional services:/i) && (
                          <p className="text-sm text-gray-500 mt-2 italic">Note: {app.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(app)}
                        className="px-4 py-2 border border-gray-200 text-sm font-bold rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" /> {t('common.edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(app.id)}
                        disabled={deletingId === app.id}
                        className="px-4 py-2 border border-red-200 text-red-600 text-sm font-bold rounded-lg hover:bg-red-50 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" /> {deletingId === app.id ? t('common.loading') : t('common.delete')}
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

        {currentTab === 'barbers' && (
          <BarbersTab
            barbers={activeBarbers}
            appointments={appointments}
            barberAppointments={barberAppointments}
            selectedBarberId={selectedBarberId}
            onBarberSelect={setSelectedBarberId}
            barberViewDate={barberViewDate}
            onDateChange={setBarberViewDate}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onEditAppointment={handleEdit}
            onDeleteAppointment={handleDelete}
            deletingId={deletingId}
            onReloadAppointments={() => {
              setSelectedDate(new Date().toISOString().split('T')[0]);
            }}
            onBarberUpdate={async (barberId, data) => {
              const response = await fetch(`/api/barbers/${barberId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
              if (response.ok) {
                const updated = await response.json();
                setBarbers(barbers.map(b => b.id === barberId ? { ...b, ...updated } : b));
              } else {
                const err = await response.json();
                throw new Error(err.error || 'Failed to update barber');
              }
            }}
          />
        )}

        {currentTab === 'services' && selectedShopId !== 'all' && selectedShopId && (
          <ServicesManagementTab shopId={selectedShopId} />
        )}

        {currentTab === 'settings' && selectedShopId && (
          <ShopSettingsTab
            shopId={selectedShopId}
            shop={selectedShop}
            onShopUpdate={(updated) => {
              setShops(shops.map(s => s.id === updated.id ? { ...s, ...updated } : s));
            }}
          />
        )}

      </div>

      {/* Modals */}
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
        shopId={selectedShopId}
        barbers={activeBarbers}
        selectedDate={selectedDate}
      />
    </div>
  );
}

