'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Scissors } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { convertCurrency } from '@/lib/i18n/translations';

interface Service {
  id: string;
  name: string;
  durationMin: number;
  priceBgn: number;
  sortOrder: number;
  isActive: boolean;
}

interface ServicesManagementTabProps {
  shopId: string;
}

export default function ServicesManagementTab({ shopId }: ServicesManagementTabProps) {
  const { t, formatPrice } = useI18n();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    durationMin: 30,
    priceBgn: 0,
    sortOrder: 0,
    isActive: true
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  /** EUR field text; BGN in formData is only overwritten when this changes (keeps exact BGN on edit until user edits price). */
  const [priceEurDraft, setPriceEurDraft] = useState('');

  useEffect(() => {
    loadServices();
  }, [shopId]);

  const loadServices = async () => {
    try {
      const response = await fetch(`/api/services?shopId=${shopId}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        durationMin: service.durationMin,
        priceBgn: service.priceBgn,
        sortOrder: service.sortOrder,
        isActive: service.isActive
      });
      setPriceEurDraft(convertCurrency(service.priceBgn, 'BGN', 'EUR').toFixed(2));
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        durationMin: 30,
        priceBgn: 0,
        sortOrder: services.length,
        isActive: true
      });
      setPriceEurDraft('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
    setFormData({
      name: '',
      durationMin: 30,
      priceBgn: 0,
      sortOrder: 0,
      isActive: true
    });
    setPriceEurDraft('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingService 
        ? `/api/services/${editingService.id}`
        : '/api/services';
      
      const method = editingService ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          shopId: shopId
        })
      });

      if (response.ok) {
        await loadServices();
        handleCloseModal();
      } else {
        const error = await response.json();
        const actionLabel = editingService
          ? t('dashboard.owner.servicesUpdateAction')
          : t('dashboard.owner.servicesCreateAction');
        alert(`${t('dashboard.owner.servicesSaveFailed')} (${actionLabel}): ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving service:', error);
      alert(t('dashboard.owner.servicesSaveFailed'));
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm(t('dashboard.owner.servicesDeleteConfirm'))) {
      return;
    }

    setDeletingId(serviceId);
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await loadServices();
      } else {
        const error = await response.json();
        alert(`${t('dashboard.owner.servicesDeleteFailed')}: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert(t('dashboard.owner.servicesDeleteFailed'));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-500">{t('dashboard.owner.servicesLoading')}</p>
      </div>
    );
  }

  const statusBadge = (isActive: boolean) => (
    <span
      className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
        isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
      }`}
    >
      {isActive ? t('status.active') : t('status.inactive')}
    </span>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold">{t('dashboard.owner.servicesManagementTitle')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('dashboard.owner.servicesManagementSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto bg-black text-white px-4 py-3 sm:py-2 min-h-[44px] rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-black/90 transition-all touch-manipulation shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" /> {t('dashboard.owner.servicesAdd')}
        </button>
      </div>

      {services.length === 0 ? (
        <div className="bg-white p-8 sm:p-12 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Scissors className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-bold text-lg">{t('dashboard.owner.servicesEmptyTitle')}</h3>
          <p className="text-gray-500 max-w-sm mt-2 text-sm sm:text-base">
            {t('dashboard.owner.servicesEmptyDescription')}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile / tablet: card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:hidden">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <h3 className="font-semibold text-gray-900 leading-snug break-words min-w-0 flex-1">
                    {service.name}
                  </h3>
                  {statusBadge(service.isActive)}
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t('services.duration')}
                    </dt>
                    <dd className="mt-0.5 text-gray-900">
                      {service.durationMin} {t('services.min')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t('services.price')}
                    </dt>
                    <dd className="mt-0.5 font-semibold text-gray-900 tabular-nums">
                      {formatPrice(service.priceBgn)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t('dashboard.owner.servicesOrder')}
                    </dt>
                    <dd className="mt-0.5 text-gray-900 tabular-nums">{service.sortOrder}</dd>
                  </div>
                </dl>
                <div className="flex gap-2 pt-1 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(service)}
                    className="flex-1 flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                  >
                    <Edit2 className="w-4 h-4 shrink-0" />
                    {t('common.edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(service.id)}
                    disabled={deletingId === service.id}
                    className="flex-1 flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 touch-manipulation"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden lg:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.service')}</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('services.duration')}</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('services.price')}</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('dashboard.owner.servicesOrder')}</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.status')}</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{service.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {service.durationMin} {t('services.min')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold tabular-nums">{formatPrice(service.priceBgn)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 tabular-nums">
                        {service.sortOrder}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {statusBadge(service.isActive)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(service)}
                            className="p-2.5 min-h-[44px] min-w-[44px] text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors touch-manipulation flex items-center justify-center"
                            title={t('common.edit')}
                            aria-label={t('common.edit')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(service.id)}
                            disabled={deletingId === service.id}
                            className="p-2.5 min-h-[44px] min-w-[44px] text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 touch-manipulation flex items-center justify-center"
                            title={t('common.delete')}
                            aria-label={t('common.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-md sm:mx-4 max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg sm:text-xl font-bold pr-2">
                {editingService ? t('dashboard.owner.servicesEditTitle') : t('dashboard.owner.servicesCreateTitle')}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2.5 min-h-[44px] min-w-[44px] hover:bg-gray-100 rounded-full transition-colors touch-manipulation flex items-center justify-center shrink-0"
                aria-label={t('common.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('dashboard.owner.servicesNameLabel')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  required
                  placeholder={t('dashboard.owner.servicesNamePlaceholder')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('dashboard.owner.servicesDurationLabel')} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="480"
                    value={formData.durationMin || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, durationMin: value === '' ? 0 : parseInt(value) || 0 });
                    }}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('dashboard.owner.servicesPriceLabel')} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={priceEurDraft}
                    onChange={(e) => {
                      const raw = e.target.value.replace(',', '.');
                      setPriceEurDraft(raw);
                      const n = parseFloat(raw);
                      if (!Number.isNaN(n) && raw !== '') {
                        setFormData((prev) => ({
                          ...prev,
                          priceBgn: convertCurrency(n, 'EUR', 'BGN')
                        }));
                      }
                    }}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none tabular-nums"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1.5 tabular-nums">
                    {t('dashboard.owner.servicesPriceStoredHint')}: {formatPrice(formData.priceBgn)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('dashboard.owner.servicesSortOrderLabel')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.sortOrder || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, sortOrder: value === '' ? 0 : parseInt(value) || 0 });
                  }}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  placeholder={t('dashboard.owner.servicesSortOrderPlaceholder')}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  {t('dashboard.owner.servicesActiveLabel')}
                </label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 min-h-[44px] border border-gray-200 rounded-lg font-bold hover:bg-gray-50 transition-colors touch-manipulation"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 min-h-[44px] bg-black text-white rounded-lg font-bold hover:bg-black/90 transition-colors touch-manipulation"
                >
                  {editingService ? t('dashboard.owner.servicesUpdate') : t('dashboard.owner.servicesCreate')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

