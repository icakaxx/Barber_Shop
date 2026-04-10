'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Calendar, Scissors, LogOut, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import BarberManagementTab from './BarberManagementTab';
import CreateUserTab from './CreateUserTab';
import AppointmentsTab from './AppointmentsTab';
import ServicesManagementTab from '@/components/dashboard/owner/ServicesManagementTab';
import LanguageCurrencySwitcher from '@/components/shared/LanguageCurrencySwitcher';
import { useI18n } from '@/contexts/I18nContext';

interface Shop {
  id: string;
  name: string;
  city?: string;
}

interface SuperAdminDashboardProps {
  userEmail?: string | null;
}

export default function SuperAdminDashboard({ userEmail }: SuperAdminDashboardProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<'barbers' | 'appointments' | 'services' | 'users'>('barbers');
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [shops, setShops] = useState<Shop[]>([]);

  useEffect(() => {
    const loadShops = async () => {
      try {
        const response = await fetch('/api/shops', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setShops(data.filter((s: any) => !s.status || s.status !== 'Inactive'));
          if (data.length > 0 && !selectedShopId) {
            setSelectedShopId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading shops:', error);
      }
    };

    if (currentTab === 'services') {
      loadShops();
    }
  }, [currentTab]);

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white shadow-sm pt-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-y-2 py-2 sm:py-0 sm:h-16 sm:flex-nowrap">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 sm:flex-none">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-full shrink-0 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">{t('dashboard.admin.title')}</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0 flex-wrap justify-end">
              {userEmail && (
                <span className="text-xs text-gray-500 hidden md:inline max-w-[160px] truncate order-last md:order-none">
                  {userEmail}
                </span>
              )}
              <button
                type="button"
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  router.push('/login/admin');
                  router.refresh();
                }}
                className="flex items-center gap-2 px-3 py-2 min-h-[44px] text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="hidden min-[380px]:inline">{t('auth.logout')}</span>
              </button>
              <LanguageCurrencySwitcher />
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold">{t('dashboard.admin.globalAdmin')}</p>
                <p className="text-xs text-gray-500">{t('dashboard.admin.systemRoot')}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm shrink-0">
                SA
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200 -mx-4 px-4 sm:mx-0 sm:px-0">
          <nav className="flex gap-1 sm:gap-4 overflow-x-auto scrollbar-hide pb-px -mb-px">
            <button
              type="button"
              onClick={() => setCurrentTab('barbers')}
              className={`px-3 sm:px-4 py-2.5 min-h-[44px] font-bold text-sm border-b-2 transition-colors flex items-center gap-2 shrink-0 whitespace-nowrap touch-manipulation ${
                currentTab === 'barbers'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              {t('dashboard.admin.barbers')}
            </button>
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
              {t('dashboard.admin.appointments')}
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
              {t('dashboard.admin.services')}
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab('users')}
              className={`px-3 sm:px-4 py-2.5 min-h-[44px] font-bold text-sm border-b-2 transition-colors flex items-center gap-2 shrink-0 whitespace-nowrap touch-manipulation ${
                currentTab === 'users'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              {t('dashboard.admin.users')}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {currentTab === 'barbers' && <BarberManagementTab />}
        {currentTab === 'users' && <CreateUserTab />}
        {currentTab === 'appointments' && <AppointmentsTab />}
        {currentTab === 'services' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('dashboard.admin.selectShop')}
              </label>
              <select
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              >
                <option value="">{t('dashboard.admin.selectShopPlaceholder')}</option>
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name} {shop.city ? `- ${shop.city}` : ''}
                  </option>
                ))}
              </select>
            </div>
            {selectedShopId && (
              <ServicesManagementTab shopId={selectedShopId} />
            )}
            {!selectedShopId && (
              <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center">
                <p className="text-gray-500">{t('dashboard.admin.selectShopMessage')}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}



