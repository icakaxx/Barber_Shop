'use client';

import { useState, useEffect, useRef } from 'react';
import { Globe, DollarSign, ChevronDown } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import type { Locale, Currency } from '@/lib/i18n/translations';

export default function LanguageCurrencySwitcher() {
  const { locale, currency, setLocale, setCurrency } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownType, setDropdownType] = useState<'language' | 'currency' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setDropdownType(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages: { code: Locale; label: string; flag: string }[] = [
    { code: 'bg', label: 'Български', flag: '🇧🇬' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  const currencies: { code: Currency; label: string; symbol: string }[] = [
    { code: 'BGN', label: 'BGN (лв)', symbol: 'лв' },
    { code: 'EUR', label: 'EUR (€)', symbol: '€' },
  ];

  const currentLanguage = languages.find(l => l.code === locale) || languages[0];
  const currentCurrency = currencies.find(c => c.code === currency) || currencies[0];

  return (
    <div className="relative flex items-center gap-2" ref={dropdownRef}>
      {/* Language Switcher */}
      <div className="relative">
        <button
          onClick={() => {
            setIsOpen(!isOpen || dropdownType !== 'language');
            setDropdownType(isOpen && dropdownType === 'language' ? null : 'language');
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          aria-label="Change language"
        >
          <Globe className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">{currentLanguage.flag}</span>
          <ChevronDown className="w-3 h-3 text-gray-500" />
        </button>

        {isOpen && dropdownType === 'language' && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-50">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLocale(lang.code);
                  setIsOpen(false);
                  setDropdownType(null);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                  locale === lang.code ? 'bg-gray-50 font-medium' : ''
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
                {locale === lang.code && (
                  <span className="ml-auto text-black">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Currency Switcher */}
      <div className="relative">
        <button
          onClick={() => {
            setIsOpen(!isOpen || dropdownType !== 'currency');
            setDropdownType(isOpen && dropdownType === 'currency' ? null : 'currency');
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          aria-label="Change currency"
        >
          <DollarSign className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">{currentCurrency.symbol}</span>
          <ChevronDown className="w-3 h-3 text-gray-500" />
        </button>

        {isOpen && dropdownType === 'currency' && (
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg border border-gray-200 shadow-lg z-50">
            {currencies.map((curr) => (
              <button
                key={curr.code}
                onClick={() => {
                  setCurrency(curr.code);
                  setIsOpen(false);
                  setDropdownType(null);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                  currency === curr.code ? 'bg-gray-50 font-medium' : ''
                }`}
              >
                <span>{curr.label}</span>
                {currency === curr.code && (
                  <span className="text-black">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
