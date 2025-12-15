'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import TodayAppointments from './TodayAppointments';
import ManageAvailability from './ManageAvailability';
import TeamView from './TeamView';
import type { Barber } from '@/lib/types';

interface BarberDashboardProps {
  barberId?: string;
  barberName?: string;
}

export default function BarberDashboard({ barberId, barberName }: BarberDashboardProps) {
  const [currentTab, setCurrentTab] = useState<'today' | 'my-slots' | 'team'>('today');
  const [barber, setBarber] = useState<Barber | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBarber = async () => {
      try {
        const response = await fetch('/api/barbers');
        if (response.ok) {
          const barbers: Barber[] = await response.json();
          
          let found: Barber | undefined;
          
          if (barberId) {
            found = barbers.find(b => b.id === barberId);
          } else if (barberName) {
            // Try to match by name (handle URL-friendly names like "alex-master")
            const normalizedName = barberName.toLowerCase().replace(/-/g, ' ');
            found = barbers.find(
              b => b.displayName.toLowerCase() === normalizedName ||
                   b.displayName.toLowerCase().replace(/\s+/g, '-') === barberName.toLowerCase()
            );
          }
          
          if (found) {
            setBarber(found);
          }
        }
      } catch (error) {
        console.error('Error fetching barber:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBarber();
  }, [barberId, barberName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-500">Loading barber dashboard...</p>
        </div>
      </div>
    );
  }

  const displayName = barber?.displayName || 'Barber';
  const shopName = barber?.shop?.name || 'Barber Shop';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'B';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold tracking-tight">Barber Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold">{displayName}</p>
                <p className="text-xs text-gray-500">{shopName}</p>
              </div>
              {barber?.photoUrl ? (
                <img
                  src={barber.photoUrl}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
                  {initials}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setCurrentTab('today')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentTab === 'today' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            Today&apos;s Schedule
          </button>
          <button
            onClick={() => setCurrentTab('my-slots')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentTab === 'my-slots' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            Manage My Availability
          </button>
          <button
            onClick={() => setCurrentTab('team')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentTab === 'team' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            Team View
          </button>
        </div>

        {currentTab === 'today' && <TodayAppointments barberId={barber?.id} />}
        {currentTab === 'my-slots' && <ManageAvailability barberId={barber?.id} />}
        {currentTab === 'team' && <TeamView shopId={barber?.shopId} currentBarberId={barber?.id} />}
      </main>
    </div>
  );
}

