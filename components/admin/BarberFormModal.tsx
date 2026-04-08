'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import ImageUploadField from '@/components/shared/ImageUploadField';
import type { Barber } from '@/lib/types';

interface BarberFormModalProps {
  barber: Barber | null;
  onSave: (barberData: {
    displayName: string;
    bio?: string;
    photoUrl?: string;
    isActive?: boolean;
  }) => void;
  onClose: () => void;
  /** When true, shows upload field (owners only). When false, URL input only. */
  allowUpload?: boolean;
}

export default function BarberFormModal({ barber, onSave, onClose, allowUpload = false }: BarberFormModalProps) {
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    photoUrl: '',
    isActive: true,
  });

  useEffect(() => {
    if (barber) {
      setFormData({
        displayName: barber.displayName,
        bio: barber.bio || '',
        photoUrl: barber.photoUrl || '',
        isActive: barber.isActive ?? true,
      });
    }
  }, [barber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold">{barber ? 'Edit Barber' : 'Add New Barber'}</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Display Name *</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              placeholder="How the barber is displayed to customers"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              placeholder="Short description about the barber..."
            />
          </div>

          {allowUpload && barber ? (
            <ImageUploadField
              type="barber-profile"
              value={formData.photoUrl}
              onChange={(url) => handleChange('photoUrl', url)}
              entityId={barber.id}
              label="Profile Photo"
              helpText="Upload or paste URL. Compressed to ~150 KB."
              placeholder="https://example.com/photo.jpg"
            />
          ) : (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Photo URL</label>
              <input
                type="url"
                value={formData.photoUrl}
                onChange={(e) => handleChange('photoUrl', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                placeholder="https://example.com/photo.jpg"
              />
            </div>
          )}

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

          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
            >
              {barber ? 'Update Barber' : 'Create Barber'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
