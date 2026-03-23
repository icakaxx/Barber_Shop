'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { useI18n } from '@/contexts/I18nContext';

type UserRole = 'USER' | 'BARBER_OWNER' | 'BARBER_WORKER' | 'SUPER_ADMIN';

interface Shop {
  id: string;
  name: string;
  city?: string;
}

export default function CreateUserTab() {
  const { t } = useI18n();
  const [shops, setShops] = useState<Shop[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('USER');
  const [shopId, setShopId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/shops', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setShops(Array.isArray(data) ? data : []);
        }
      } catch {
        /* ignore */
      }
    };
    void load();
  }, []);

  const functionUrl = () => {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return null;
    return `${base.replace(/\/$/, '')}/functions/v1/create-user`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const url = functionUrl();
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      setError(t('dashboard.admin.createUserMissingEnv'));
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError(t('dashboard.admin.createUserNotSignedIn'));
        setLoading(false);
        return;
      }

      const body: Record<string, unknown> = {
        email: email.trim().toLowerCase(),
        password,
        role,
      };
      if (fullName.trim()) body.full_name = fullName.trim();
      if (phone.trim()) body.phone = phone.trim();
      if (role === 'BARBER_WORKER') {
        body.shop_id = shopId;
        body.display_name = displayName.trim();
        if (bio.trim()) body.bio = bio.trim();
        if (photoUrl.trim()) body.photo_url = photoUrl.trim();
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: anon,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : t('dashboard.admin.createUserFailed'));
        setLoading(false);
        return;
      }

      setMessage(t('dashboard.admin.createUserSuccess'));
      setEmail('');
      setPassword('');
      setFullName('');
      setPhone('');
      setRole('USER');
      setShopId('');
      setDisplayName('');
      setBio('');
      setPhotoUrl('');
    } catch {
      setError(t('dashboard.admin.createUserFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        {t('dashboard.admin.createUserWarning')}
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        {message && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">{message}</div>
        )}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.admin.createUserFullName')}</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.admin.createUserPhone')}</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.role')}</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
          >
            <option value="USER">{t('dashboard.admin.roleUser')}</option>
            <option value="BARBER_OWNER">{t('dashboard.admin.roleOwner')}</option>
            <option value="BARBER_WORKER">{t('dashboard.admin.roleWorker')}</option>
            <option value="SUPER_ADMIN">{t('dashboard.admin.roleSuperAdmin')}</option>
          </select>
        </div>

        {role === 'BARBER_WORKER' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.shop')}</label>
              <select
                required
                value={shopId}
                onChange={(e) => setShopId(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              >
                <option value="">{t('dashboard.admin.selectShopPlaceholder')}</option>
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.city ? ` — ${s.city}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.admin.createUserDisplayName')}</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.admin.createUserBio')}</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.admin.createUserPhotoUrl')}</label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-black text-white font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? t('common.loading') : t('dashboard.admin.createUserSubmit')}
        </button>
      </form>
    </div>
  );
}
