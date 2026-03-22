'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut } from 'lucide-react';
import TodayAppointments from './TodayAppointments';
import ScheduleCalendar from './ScheduleCalendar';
import LanguageCurrencySwitcher from '@/components/shared/LanguageCurrencySwitcher';
import { useI18n } from '@/contexts/I18nContext';
import { createClient } from '@/lib/supabase/browser';
import type { Barber } from '@/lib/types';

interface BarberDashboardProps {
  barberId?: string;
  barberName?: string;
  /** Load shop + team from session (/api/barbers/me) — unified /barbers dashboard */
  sessionBacked?: boolean;
}

interface MeApiResponse {
  me: { id: string; displayName: string; shopId: string } | null;
  team: Barber[];
  shopId: string | null;
  role: string;
  email?: string;
  fullName?: string | null;
}

export default function BarberDashboard({
  barberId,
  barberName,
  sessionBacked = false,
}: BarberDashboardProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<'today' | 'calendar'>('today');
  const [barber, setBarber] = useState<Barber | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [team, setTeam] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  /** For "Днес": всички в салона или един колега */
  const [todayFilterBarberId, setTodayFilterBarberId] = useState<string | 'all'>('all');
  /** When user has no `barbers` row (owner/admin): show session name, never another barber's avatar */
  const [viewerLabel, setViewerLabel] = useState('');

  useEffect(() => {
    const loadBarber = async () => {
      if (sessionBacked) {
        try {
          const res = await fetch('/api/session/barber', { credentials: 'include' });
          if (res.status === 401) {
            setSessionError('unauthorized');
            setLoading(false);
            return;
          }
          if (!res.ok) {
            setSessionError('error');
            setLoading(false);
            return;
          }
          const data: MeApiResponse = await res.json();
          setShopId(data.shopId);
          setTeam(data.team || []);

          if (data.me) {
            setViewerLabel('');
            const self = data.team.find((b) => b.id === data.me!.id);
            if (self) {
              setBarber(self);
            } else {
              setBarber({
                id: data.me.id,
                profileId: '',
                shopId: data.me.shopId,
                displayName: data.me.displayName,
                isActive: true,
                shop: data.team[0]?.shop,
              } as Barber);
            }
          } else if (data.shopId) {
            // Logged in as owner/super admin (or worker without barber row): no barbers row — do NOT use team[0] for identity
            setBarber(null);
            const fromProfile = (data.fullName && data.fullName.trim()) || '';
            const fromEmail = data.email?.split('@')[0]?.trim() || '';
            setViewerLabel(fromProfile || fromEmail || data.email || '');
          } else {
            setSessionError('no_shop');
          }
        } catch {
          setSessionError('error');
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        const response = await fetch('/api/barbers');
        if (response.ok) {
          const barbers: Barber[] = await response.json();

          let found: Barber | undefined;

          if (barberId) {
            found = barbers.find((b) => b.id === barberId);
          } else if (barberName) {
            const normalizedName = barberName.toLowerCase().replace(/-/g, ' ');
            found = barbers.find(
              (b) =>
                b.displayName.toLowerCase() === normalizedName ||
                b.displayName.toLowerCase().replace(/\s+/g, '-') === barberName.toLowerCase()
            );
          }

          if (found) {
            setBarber(found);
            setShopId(found.shopId);
          }
        }
      } catch (error) {
        console.error('Error fetching barber:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBarber();
  }, [barberId, barberName, sessionBacked]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login/barber');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (sessionError === 'unauthorized') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <p className="text-gray-700 mb-4">{t('auth.barberSessionRequired')}</p>
          <Link href="/login/barber" className="text-black font-bold underline">
            {t('auth.barberLoginPageTitle')}
          </Link>
        </div>
      </div>
    );
  }

  if (sessionError === 'no_shop') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md space-y-4">
          <p className="text-gray-700">{t('auth.barberNoShop')}</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm font-bold underline"
          >
            {t('auth.signOut')}
          </button>
        </div>
      </div>
    );
  }

  if (sessionError === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <p className="text-gray-700">{t('auth.barberLoadError')}</p>
      </div>
    );
  }

  const displayName = barber?.displayName || viewerLabel || 'Barber';
  const shopName = barber?.shop?.name || team[0]?.shop?.name || 'Barber Shop';
  const initials =
    displayName
      .split(/[\s@]+/)
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'B';

  const showTeamFilters = sessionBacked && shopId && team.length > 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold tracking-tight">{t('nav.barberDashboard')}</h1>
            </div>
            <div className="flex items-center gap-3">
              {sessionBacked && (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('auth.logout')}</span>
                </button>
              )}
              <LanguageCurrencySwitcher />
              <div className="hidden sm:block text-right max-w-[200px]">
                {sessionBacked ? (
                  <>
                    <p className="text-sm font-bold text-gray-900 truncate" title={shopName}>
                      {shopName}
                    </p>
                    <p className="text-xs text-gray-500 truncate" title={displayName}>
                      {t('dashboard.barber.signedInAs')}: {displayName}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold truncate">{displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{shopName}</p>
                  </>
                )}
              </div>
              {barber?.photoUrl ? (
                <img
                  src={barber.photoUrl}
                  alt=""
                  title={`${t('dashboard.barber.signedInAs')}: ${displayName}`}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm ring-2 ring-gray-100"
                  title={`${t('dashboard.barber.signedInAs')}: ${displayName}`}
                >
                  {initials}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showTeamFilters && currentTab === 'today' && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-gray-700">{t('dashboard.barber.todayWho')}</label>
            <select
              value={todayFilterBarberId}
              onChange={(e) =>
                setTodayFilterBarberId(e.target.value === 'all' ? 'all' : e.target.value)
              }
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-black focus:outline-none"
            >
              <option value="all">{t('dashboard.barber.todayAllBarbers')}</option>
              {team.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.displayName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setCurrentTab('today')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentTab === 'today'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            {t('dashboard.barber.todaySchedule')}
          </button>
          <button
            onClick={() => setCurrentTab('calendar')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentTab === 'calendar'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            {t('dashboard.barber.calendarView')}
          </button>
        </div>

        {currentTab === 'today' && (
          <TodayAppointments
            barberId={todayFilterBarberId === 'all' ? undefined : todayFilterBarberId}
            shopId={todayFilterBarberId === 'all' ? shopId || undefined : undefined}
            showBarberLabels={todayFilterBarberId === 'all' && !!shopId}
          />
        )}
        {currentTab === 'calendar' && (
          <ScheduleCalendar
            barberId={barber?.id}
            shopId={shopId || barber?.shopId}
            defaultTeamView={sessionBacked && !!shopId}
          />
        )}
      </main>
    </div>
  );
}
