'use client';

import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { mockServices } from '@/lib/mock-data';
import type { Service } from '@/lib/types';
import { useI18n } from '@/contexts/I18nContext';
import { extractPrice } from '@/lib/utils/price';

export default function ServicesSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, formatPrice, currency } = useI18n();

  useEffect(() => {
    loadServices();
  }, []);

  // Reload services when currency changes to update prices
  useEffect(() => {
    // This will trigger re-render when currency changes
    // The formatPrice calls in JSX will use the new currency
  }, [currency]);

  const loadServices = async () => {
    try {
      console.log('🔄 Fetching services from API...');
      const response = await fetch('/api/services');
      console.log('📡 API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Services loaded from database:', data.length, 'services');
        console.log('📋 Services:', data);
        
        if (data.length > 0) {
          // Convert API format to Service type
          const formattedServices: Service[] = data.map((svc: any) => ({
            id: svc.id,
            name: svc.name,
            duration: svc.duration || `${svc.durationMin || 30} ${t('services.min')}`,
            price: svc.price, // Keep original for display, but we have priceBgn for conversion
            priceBgn: svc.priceBgn || extractPrice(svc.price || '0'),
            best: false // You can set this based on business logic
          }));
          setServices(formattedServices);
          setLoading(false);
          return;
        } else {
          console.warn('⚠️ No services found in database, using mock data');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', response.status, errorData);
      }
    } catch (error) {
      console.error('❌ Error loading services:', error);
    }
    
    // Fallback to mock data only if database fetch fails
    console.log('📦 Using mock services as fallback');
    setServices(mockServices);
    setLoading(false);
  };

  const handleServiceClick = (serviceId: string) => {
    const modal = document.getElementById('bookingModal');
    if (modal) {
      modal.setAttribute('data-service-id', serviceId);
      modal.classList.remove('hidden');
      // Trigger React state update
      const event = new CustomEvent('bookingModalOpen', { detail: { serviceId } });
      document.dispatchEvent(event);
    }
  };

  if (loading) {
    return (
      <section id="services" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto px-2">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">{t('services.title')}</h2>
            <div className="mt-2 w-20 h-1 bg-black mx-auto" />
          </div>
          <div className="text-center text-gray-500">{t('common.loading')}</div>
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-3xl mx-auto px-2">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">{t('services.title')}</h2>
          <div className="mt-2 w-20 h-1 bg-black mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto justify-items-stretch">
          {services.map((service) => (
            <div
              key={service.id}
              onClick={() => handleServiceClick(service.id)}
              className={`p-6 rounded-2xl border transition-all cursor-pointer hover:shadow-lg group text-center ${
                service.best
                  ? 'border-black bg-black text-white hover:scale-[1.02]'
                  : 'border-gray-200 hover:border-black'
              }`}
            >
              {service.best && (
                <div className="flex flex-col items-center gap-3 mb-4">
                  <span className="bg-white text-black text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                    {t('services.bestValue')}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold mb-1">{service.name}</h3>
                    <p className="text-sm text-gray-400 mb-1">{service.duration} • {t('services.theWorks')}</p>
                  </div>
                </div>
              )}
              {!service.best && (
                <>
                  <h3 className="text-xl font-bold mb-1">{service.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{service.duration} • {t('services.professionalCut')}</p>
                </>
              )}
              <div className="flex justify-center items-end gap-3 flex-wrap">
                <p className="text-3xl font-bold">
                  {service.priceBgn ? formatPrice(service.priceBgn) : service.price}
                </p>
                <span
                  className={`text-sm font-bold inline-flex items-center gap-1 ${
                    service.best
                      ? 'opacity-100'
                      : 'opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity'
                  }`}
                >
                  {t('nav.bookNow')} <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center flex justify-center px-2">
          <button
            type="button"
            onClick={() => {
              const modal = document.getElementById('bookingModal');
              if (modal) {
                modal.classList.remove('hidden');
                document.dispatchEvent(new CustomEvent('bookingModalOpen'));
              }
            }}
            className="inline-flex items-center justify-center rounded-md bg-black px-8 sm:px-10 py-3.5 sm:py-4 min-h-[48px] w-full max-w-md text-base sm:text-lg font-bold text-white shadow hover:bg-black/90 transition-all touch-manipulation"
          >
            {t('nav.bookNow')}
          </button>
        </div>
      </div>
    </section>
  );
}

