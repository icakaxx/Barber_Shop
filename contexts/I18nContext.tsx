'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Locale, Currency, translations, formatPriceWithConversion } from '@/lib/i18n/translations';

interface I18nContextType {
  locale: Locale;
  currency: Currency;
  setLocale: (locale: Locale) => void;
  setCurrency: (currency: Currency) => void;
  t: (key: string) => string;
  formatPrice: (amountBgn: number) => string;
  translateServiceName: (serviceName: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('bg');
  const [currency, setCurrencyState] = useState<Currency>('BGN');

  // Load preferences from localStorage
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    const savedCurrency = localStorage.getItem('currency') as Currency;
    
    if (savedLocale && (savedLocale === 'bg' || savedLocale === 'en')) {
      setLocaleState(savedLocale);
    }
    if (savedCurrency && (savedCurrency === 'BGN' || savedCurrency === 'EUR')) {
      setCurrencyState(savedCurrency);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
    // Update HTML lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale;
    }
  };

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  const formatPrice = useMemo(() => {
    return (amountBgn: number): string => {
      return formatPriceWithConversion(amountBgn, currency, locale);
    };
  }, [currency, locale]);

  const translateServiceName = useMemo(() => {
    return (serviceName: string): string => {
      // Get serviceNames mapping directly from translations
      const serviceNames = translations[locale]?.serviceNames || {};
      if (typeof serviceNames === 'object') {
        // Check for exact match
        if (serviceName in serviceNames) {
          return serviceNames[serviceName as keyof typeof serviceNames] as string;
        }
        
        // Try case-insensitive match
        for (const [key, value] of Object.entries(serviceNames)) {
          if (serviceName.toLowerCase() === key.toLowerCase()) {
            return value as string;
          }
        }
      }
      
      // If no match found, return the original name
      // This allows new services to display their original name until translation is added
      return serviceName;
    };
  }, [locale]);

  const value = useMemo(() => ({
    locale,
    currency,
    setLocale,
    setCurrency,
    t,
    formatPrice,
    translateServiceName,
  }), [locale, currency, formatPrice, translateServiceName]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
