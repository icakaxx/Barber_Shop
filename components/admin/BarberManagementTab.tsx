'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Edit, Trash2, Eye, Star, Loader2 } from 'lucide-react';
import { mockBarberSchedules, mockShops } from '@/lib/mock-data';
import { getBarbers, createBarber, updateBarber, deleteBarber } from '@/lib/supabase/barbers';
import type { Barber, BarberSchedule } from '@/lib/types';
import BarberFormModal from './BarberFormModal_new';
import BarberScheduleModal from './BarberScheduleModal';
import { useI18n } from '@/contexts/I18nContext';

export default function BarberManagementTab() {
  const { t } = useI18n();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);

  // Load barbers on component mount
  useEffect(() => {
    loadBarbers();
  }, []);

  const loadBarbers = async () => {
    setLoading(true);
    try {
      const data = await getBarbers();
      setBarbers(data);
    } catch (error) {
      console.error('Error loading barbers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBarberSchedule = (barberId: string): BarberSchedule | undefined => {
    // For now, use mock schedule data
    // TODO: Implement dynamic schedule loading from Supabase
    const today = new Date().toISOString().split('T')[0];
    return mockBarberSchedules.find(sch => sch.barberId === barberId && sch.date === today);
  };


  const handleAddBarber = () => {
    setEditingBarber(null);
    setShowFormModal(true);
  };

  const handleEditBarber = (barber: Barber) => {
    setEditingBarber(barber);
    setShowFormModal(true);
  };

  const handleViewSchedule = (barber: Barber) => {
    setSelectedBarber(barber);
    setShowScheduleModal(true);
  };

  const handleDeleteBarber = async (barberId: string) => {
    if (confirm(t('admin.deleteBarberConfirm'))) {
      try {
        const success = await deleteBarber(barberId);
        if (success) {
          setBarbers(barbers.map(b =>
            b.id === barberId ? { ...b, status: 'Inactive' } : b
          ));
        } else {
          alert(t('admin.failedDeleteBarber'));
        }
      } catch (error) {
        console.error('Error deleting barber:', error);
        alert(t('admin.failedDeleteBarber'));
      }
    }
  };

  const handleSaveBarber = async (barberData: {
    displayName: string;
    bio?: string;
    photoUrl?: string;
    isActive?: boolean;
  }) => {
    try {
      if (editingBarber) {
        // Update existing barber
        const updatedBarber = await updateBarber(editingBarber.id, barberData);
        if (updatedBarber) {
          setBarbers(barbers.map(b =>
            b.id === editingBarber.id ? updatedBarber : b
          ));
        } else {
          alert(t('admin.failedUpdateBarber'));
        }
      } else {
        // Add new barber
        const newBarber = await createBarber(barberData);
        if (newBarber) {
          setBarbers([...barbers, newBarber]);
        } else {
          alert(t('admin.failedCreateBarber'));
        }
      }
      setShowFormModal(false);
    } catch (error) {
      console.error('Error saving barber:', error);
      alert(t('admin.failedSaveBarber'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'On Leave': return 'bg-yellow-100 text-yellow-700';
      case 'Inactive': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{t('admin.barberManagement')}</h2>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">{t('admin.loadingBarbers')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('admin.barberManagement')}</h2>
        <button
          onClick={handleAddBarber}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-black/90 transition-all"
        >
          <UserPlus className="w-4 h-4" /> {t('admin.addBarber')}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{t('admin.barber')}</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{t('admin.role')}</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{t('admin.shop')}</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{t('admin.status')}</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">{t('admin.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {barbers.map((barber) => (
              <BarberRow
                key={barber.id}
                barber={barber}
                onEdit={handleEditBarber}
                onDelete={handleDeleteBarber}
                onViewSchedule={handleViewSchedule}
              />
            ))}
          </tbody>
        </table>
      </div>

      {showFormModal && (
        <BarberFormModal
          barber={editingBarber}
          onSave={handleSaveBarber}
          onClose={() => setShowFormModal(false)}
        />
      )}

      {showScheduleModal && selectedBarber && (
        <BarberScheduleModal
          barber={selectedBarber}
          schedule={getBarberSchedule(selectedBarber.id)}
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  );
}

// Separate component for barber rows
function BarberRow({
  barber,
  onEdit,
  onDelete,
  onViewSchedule
}: {
  barber: Barber;
  onEdit: (barber: Barber) => void;
  onDelete: (id: string) => void;
  onViewSchedule: (barber: Barber) => void;
}) {
  const { t } = useI18n();
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div>
          <p className="font-bold">{barber.displayName}</p>
          <p className="text-xs text-gray-500">{barber.profile?.fullName}</p>
          <p className="text-xs text-gray-400">{barber.profile?.phone}</p>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">{barber.profile?.role}</td>
      <td className="px-6 py-4 text-sm">{barber.shop?.name}</td>
      <td className="px-6 py-4">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${barber.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {barber.isActive ? t('status.active') : t('status.inactive')}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onViewSchedule(barber)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title={t('admin.viewSchedule')}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(barber)}
            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
            title={t('admin.editBarber')}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(barber.id)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title={t('admin.deleteBarber')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
