'use client';

import Link from 'next/link';
import { Home, Scissors, ShieldCheck, Crown, Building2, X, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Barber } from '@/lib/types';

export default function DevNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loadBarbers = async () => {
        setLoading(true);
        try {
          const response = await fetch('/api/barbers');
          if (response.ok) {
            const data = await response.json();
            setBarbers(data.filter((b: Barber) => b.isActive));
          }
        } catch (error) {
          console.error('Error loading barbers:', error);
        } finally {
          setLoading(false);
        }
      };
      loadBarbers();
    }
  }, [isOpen]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-black text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-all flex items-center gap-2"
          title="Quick Navigation"
        >
          <Crown className="w-5 h-5" />
          <span className="hidden sm:inline">Panels</span>
        </button>
      ) : (
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 min-w-[250px] max-w-[350px] max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-2 border-b border-gray-200">
            <h3 className="font-bold text-sm text-gray-900">Quick Navigation</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <nav className="space-y-2">
            {/* Main Pages */}
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2 px-2">Main Pages</p>
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                onClick={() => setIsOpen(false)}
              >
                <Home className="w-4 h-4" />
                Landing Page
              </Link>
              <Link
                href="/owner"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                onClick={() => setIsOpen(false)}
              >
                <Building2 className="w-4 h-4" />
                Owner Dashboard
              </Link>
              <Link
                href="/login/barber?redirect=/barbers"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                onClick={() => setIsOpen(false)}
              >
                <Scissors className="w-4 h-4" />
                Barber login → /barbers
              </Link>
              <Link
                href="/login/admin?redirect=/superadmin"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                onClick={() => setIsOpen(false)}
              >
                <Crown className="w-4 h-4" />
                Super Admin
              </Link>
            </div>

            {/* Barber team dashboard */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2 px-2">Barbers (team)</p>
              <Link
                href="/barbers"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                onClick={() => setIsOpen(false)}
              >
                <User className="w-4 h-4" />
                /barbers (sign in required)
              </Link>
              {loading ? (
                <div className="px-3 py-2 text-sm text-gray-400">Loading barbers...</div>
              ) : barbers.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-400">No active barbers</div>
              ) : (
                <div className="px-3 py-1 text-xs text-gray-500">
                  {barbers.length} active in API (use team view inside /barbers)
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}



