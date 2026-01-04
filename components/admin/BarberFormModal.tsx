'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Barber } from '@/lib/types';

interface BarberFormModalProps {
  barber: Barber | null;
  onSave: (barberData: {
    profileId: string;
    shopId: string;
    displayName: string;
    bio?: string;
    photoUrl?: string;
    isActive?: boolean;
  }) => void;
  onClose: () => void;
}

export default function BarberFormModal({ barber, onSave, onClose }: BarberFormModalProps) {
  const [formData, setFormData] = useState({
    profileId: '',
    shopId: '',
    displayName: '',
    bio: '',
    photoUrl: '',
    isActive: true
  });

  // Mock data for profiles and shops (in real app, this would come from API)
  const mockProfiles = [
    { id: 'p1', fullName: 'Alexander Petrov', role: 'BARBER_WORKER' },
    { id: 'p2', fullName: 'Martin Dimitrov', role: 'BARBER_WORKER' },
    { id: 'p3', fullName: 'Georgi Kostov', role: 'BARBER_WORKER' }
  ];

  const mockShops = [
    { id: 's1', name: 'Sofia Center' },
    { id: 's2', name: 'Plovdiv Old Town' }
  ];

  useEffect(() => {
    if (barber) {
      setFormData({
        profileId: barber.profileId || '',
        shopId: barber.shopId || '',
        displayName: barber.displayName,
        bio: barber.bio || '',
        photoUrl: barber.photoUrl || '',
        isActive: barber.isActive
      });
    }
  }, [barber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {barber ? 'Edit Barber' : 'Add New Barber'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
          {/* Profile Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Profile *</label>
            <select
              value={formData.profileId}
              onChange={(e) => handleChange('profileId', e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              required
            >
              <option value="">Select a profile</option>
              {mockProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.fullName} ({profile.role})
                </option>
              ))}
            </select>
          </div>

          {/* Shop Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Shop *</label>
            <select
              value={formData.shopId}
              onChange={(e) => handleChange('shopId', e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              required
            >
              <option value="">Select a shop</option>
              {mockShops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Display Name *</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              placeholder="How the barber is displayed to customers"
              required
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              placeholder="Short description about the barber..."
            />
          </div>

          {/* Photo URL */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Photo URL</label>
            <input
              type="url"
              value={formData.photoUrl}
              onChange={(e) => handleChange('photoUrl', e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              placeholder="https://example.com/photo.jpg"
            />
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="w-4 h-4 text-black bg-gray-100 border-gray-300 rounded focus:ring-black"
              />
              <span className="text-sm font-bold text-gray-700">Active (visible to customers)</span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-bold border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-bold bg-black text-white rounded-lg hover:bg-black/90"
            >
              {barber ? 'Update Barber' : 'Add Barber'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
