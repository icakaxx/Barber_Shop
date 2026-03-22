'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import type { WorkingHoursMap } from '@/lib/utils/shopHours';

export interface ShopBranding {
  id: string;
  name: string;
  logoUrl?: string;
  heroImageUrl?: string;
  heroDescription?: string;
  address?: string;
  city?: string;
  phone?: string;
  workingHoursText?: string;
  workingHours?: WorkingHoursMap;
  lunchStart?: string;
  lunchEnd?: string;
}

export interface BarberPreview {
  id: string;
  displayName: string;
  bio?: string;
  photoUrl?: string;
  shopId: string;
}

interface ShopBrandingState {
  shop: ShopBranding | null;
  barbers: BarberPreview[];
  isLoading: boolean;
}

const ShopBrandingContext = createContext<ShopBrandingState>({ shop: null, barbers: [], isLoading: true });

export function ShopBrandingProvider({ children }: { children: React.ReactNode }) {
  const [shop, setShop] = useState<ShopBranding | null>(null);
  const [barbers, setBarbers] = useState<BarberPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch shops, barbers, services in parallel - page ready when all complete
    Promise.all([
      fetch('/api/shops', { cache: 'no-store' }).then((res) => (res.ok ? res.json() : [])),
      fetch('/api/barbers', { cache: 'no-store' }).then((res) => (res.ok ? res.json() : [])),
      fetch('/api/services', { cache: 'no-store' }).then((res) => (res.ok ? res.json() : []))
    ])
      .then(([shops, barbersData]) => {
        const shopData = shops?.[0];
        if (shopData) {
          setShop({
            id: shopData.id,
            name: shopData.name,
            logoUrl: shopData.logoUrl,
            heroImageUrl: shopData.heroImageUrl,
            heroDescription: shopData.heroDescription,
            address: shopData.address,
            city: shopData.city,
            phone: shopData.phone,
            workingHoursText: shopData.workingHoursText,
            workingHours: shopData.workingHours,
            lunchStart: shopData.lunchStart,
            lunchEnd: shopData.lunchEnd
          });
        }
        const activeBarbers = (barbersData || []).filter((b: any) => b.isActive);
        setBarbers(activeBarbers.map((b: any) => ({
          id: b.id,
          displayName: b.displayName,
          bio: b.bio,
          photoUrl: b.photoUrl,
          shopId: b.shopId
        })));
      })
      .catch((err) => console.error('Page load failed:', err))
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <ShopBrandingContext.Provider value={{ shop, barbers, isLoading }}>
      {children}
    </ShopBrandingContext.Provider>
  );
}

export function useShopBranding() {
  const { shop, barbers, isLoading } = useContext(ShopBrandingContext);
  return { shop, barbers, isLoading };
}
