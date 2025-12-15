'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Calendar, Scissors } from 'lucide-react';
import BarberManagementTab from './BarberManagementTab';
import AppointmentsTab from './AppointmentsTab';
import ServicesManagementTab from '@/components/dashboard/owner/ServicesManagementTab';

interface Shop {
  id: string;
  name: string;
  city?: string;
}

export default function SuperAdminDashboard() {
  const [currentTab, setCurrentTab] = useState<'barbers' | 'appointments' | 'services'>('barbers');
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [shops, setShops] = useState<Shop[]>([]);

  useEffect(() => {
    const loadShops = async () => {
      try {
        const response = await fetch('/api/shops');
        if (response.ok) {
          const data = await response.json();
          setShops(data.filter((s: Shop) => s.isActive !== false));
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
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold tracking-tight">Super Admin Panel</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold">Global Admin</p>
                <p className="text-xs text-gray-500">System Root</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
                SA
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setCurrentTab('barbers')}
              className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
                currentTab === 'barbers'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Barbers
            </button>
            <button
              onClick={() => setCurrentTab('appointments')}
              className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
                currentTab === 'appointments'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Appointments
            </button>
            <button
              onClick={() => setCurrentTab('services')}
              className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
                currentTab === 'services'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Scissors className="w-4 h-4" />
              Services
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {currentTab === 'barbers' && <BarberManagementTab />}
        {currentTab === 'appointments' && <AppointmentsTab />}
        {currentTab === 'services' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Shop to Manage Services
              </label>
              <select
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              >
                <option value="">-- Select a shop --</option>
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
                <p className="text-gray-500">Please select a shop to manage services.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}



