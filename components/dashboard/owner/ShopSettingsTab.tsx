'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import ImageUploadField from '@/components/shared/ImageUploadField';
import { DAY_KEYS, type WorkingHoursMap } from '@/lib/utils/shopHours';

interface Shop {
  id: string;
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  heroDescription?: string;
  workingHours?: WorkingHoursMap;
  workingHoursText?: string;
  lunchStart?: string;
  lunchEnd?: string;
}

interface ShopSettingsTabProps {
  shopId: string;
  shop: Shop | undefined;
  onShopUpdate: (shop: Shop) => void;
}

const DEFAULT_HOURS: WorkingHoursMap = {
  mon: { open: '09:00', close: '18:00' },
  tue: { open: '09:00', close: '18:00' },
  wed: { open: '09:00', close: '18:00' },
  thu: { open: '09:00', close: '18:00' },
  fri: { open: '09:00', close: '18:00' },
  sat: { open: '09:00', close: '18:00' },
  sun: null
};

const DAY_LABELS: Record<string, string> = {
  mon: 'dashboard.owner.dayMon',
  tue: 'dashboard.owner.dayTue',
  wed: 'dashboard.owner.dayWed',
  thu: 'dashboard.owner.dayThu',
  fri: 'dashboard.owner.dayFri',
  sat: 'dashboard.owner.daySat',
  sun: 'dashboard.owner.daySun'
};

export default function ShopSettingsTab({ shopId, shop, onShopUpdate }: ShopSettingsTabProps) {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    heroImageUrl: '',
    heroDescription: '',
    phone: '',
    address: '',
    city: '',
    lunchStart: '',
    lunchEnd: '',
    workingHours: { ...DEFAULT_HOURS } as WorkingHoursMap
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (shop) {
      const wh = (shop.workingHours || DEFAULT_HOURS) as WorkingHoursMap;
      setFormData({
        name: shop.name || '',
        logoUrl: shop.logoUrl || '',
        heroImageUrl: shop.heroImageUrl || '',
        heroDescription: shop.heroDescription || '',
        phone: shop.phone || '',
        address: shop.address || '',
        city: shop.city || '',
        lunchStart: shop.lunchStart || '',
        lunchEnd: shop.lunchEnd || '',
        workingHours: { ...DEFAULT_HOURS, ...wh }
      });
    }
  }, [shop]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const handleWorkingHoursChange = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setFormData(prev => {
      const next = { ...prev };
      const dayHours = { ...(prev.workingHours[day as keyof WorkingHoursMap] as { open: string; close: string } | null) };
      if (field === 'closed') {
        next.workingHours = { ...prev.workingHours, [day]: value ? null : { open: '09:00', close: '18:00' } };
      } else if (typeof value === 'string') {
        next.workingHours = {
          ...prev.workingHours,
          [day]: { ...(dayHours || { open: '09:00', close: '18:00' }), [field]: value }
        };
      }
      return next;
    });
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;

    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/shops/${shopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || undefined,
          logoUrl: formData.logoUrl || undefined,
          heroImageUrl: formData.heroImageUrl || undefined,
          heroDescription: formData.heroDescription || undefined,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          workingHours: formData.workingHours,
          lunchStart: formData.lunchStart || undefined,
          lunchEnd: formData.lunchEnd || undefined
        })
      });

      if (response.ok) {
        const updated = await response.json();
        onShopUpdate(updated);
        setMessage({ type: 'success', text: t('dashboard.owner.settingsSaved') });
      } else {
        const err = await response.json();
        setMessage({ type: 'error', text: err.error || t('dashboard.owner.settingsSaveFailed') });
      }
    } catch (error) {
      console.error('Error saving shop settings:', error);
      setMessage({ type: 'error', text: t('dashboard.owner.settingsSaveFailed') });
    } finally {
      setSaving(false);
    }
  };

  if (!shopId) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
        <p className="text-gray-500">{t('dashboard.owner.loadingShop')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('dashboard.owner.shopSettings')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('dashboard.owner.shopSettingsDescription')}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        {/* Shop Name */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            {t('dashboard.owner.shopName')} *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
            placeholder="Barber King"
            required
          />
          <p className="text-xs text-gray-500 mt-1">{t('dashboard.owner.shopNameHelp')}</p>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            {t('dashboard.owner.phone')}
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
            placeholder="+359 888 123 456"
          />
          <p className="text-xs text-gray-500 mt-1">{t('dashboard.owner.phoneHelp')}</p>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            {t('dashboard.owner.address')}
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
            placeholder="ул. Пример 12, 1000 Център"
          />
          <p className="text-xs text-gray-500 mt-1">{t('dashboard.owner.addressHelp')}</p>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            {t('dashboard.owner.city')}
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
            placeholder="София"
          />
          <p className="text-xs text-gray-500 mt-1">{t('dashboard.owner.cityHelp')}</p>
        </div>

        {/* Hero Description */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            {t('dashboard.owner.heroDescription')}
          </label>
          <textarea
            value={formData.heroDescription}
            onChange={(e) => handleChange('heroDescription', e.target.value)}
            rows={2}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
            placeholder={t('hero.premiumCuts')}
          />
          <p className="text-xs text-gray-500 mt-1">{t('dashboard.owner.heroDescriptionHelp')}</p>
        </div>

        {/* Working Hours */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            {t('dashboard.owner.workingHours')}
          </label>
          <p className="text-xs text-gray-500 mb-3">{t('dashboard.owner.workingHoursHelp')}</p>
          <div className="space-y-2">
            {DAY_KEYS.map((day) => {
              const hours = formData.workingHours[day];
              const isClosed = !hours;
              return (
                <div key={day} className="flex flex-wrap items-center gap-2">
                  <span className="w-12 text-sm font-medium">{t(DAY_LABELS[day])}</span>
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={isClosed}
                      onChange={(e) => handleWorkingHoursChange(day, 'closed', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    {t('dashboard.owner.closed')}
                  </label>
                  {!isClosed && (
                    <>
                      <input
                        type="time"
                        value={hours?.open || '09:00'}
                        onChange={(e) => handleWorkingHoursChange(day, 'open', e.target.value)}
                        className="p-2 border border-gray-200 rounded-lg text-sm"
                      />
                      <span className="text-gray-400">–</span>
                      <input
                        type="time"
                        value={hours?.close || '18:00'}
                        onChange={(e) => handleWorkingHoursChange(day, 'close', e.target.value)}
                        className="p-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Lunch Break */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            {t('dashboard.owner.lunchBreak')}
          </label>
          <p className="text-xs text-gray-500 mb-2">{t('dashboard.owner.lunchBreakHelp')}</p>
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={formData.lunchStart}
              onChange={(e) => handleChange('lunchStart', e.target.value)}
              className="p-2 border border-gray-200 rounded-lg text-sm"
            />
            <span className="text-gray-400">–</span>
            <input
              type="time"
              value={formData.lunchEnd}
              onChange={(e) => handleChange('lunchEnd', e.target.value)}
              className="p-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Logo */}
        <ImageUploadField
          type="logo"
          value={formData.logoUrl}
          onChange={(url) => handleChange('logoUrl', url)}
          entityId={shopId}
          label={t('dashboard.owner.logoUrl')}
          helpText={t('dashboard.owner.logoUrlHelp')}
          placeholder="https://example.com/logo.png"
        />

        {/* Hero Image */}
        <ImageUploadField
          type="hero"
          value={formData.heroImageUrl}
          onChange={(url) => handleChange('heroImageUrl', url)}
          entityId={shopId}
          label={t('dashboard.owner.heroImageUrl')}
          helpText={t('dashboard.owner.heroImageUrlHelp')}
          placeholder="https://images.unsplash.com/photo-..."
        />

        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-black/90 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t('common.save')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
