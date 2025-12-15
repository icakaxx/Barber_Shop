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
        profileId: barber.profileId,
        shopId: barber.shopId,
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Basic Information</h3>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleChange('displayName', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  placeholder="How they appear to customers"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  >
                    <option value="Apprentice">Apprentice</option>
                    <option value="Stylist">Stylist</option>
                    <option value="Senior Barber">Senior Barber</option>
                    <option value="Master Barber">Master Barber</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Professional Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Hire Date</label>
                  <input
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => handleChange('hireDate', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Years of Experience</label>
                <input
                  type="number"
                  min="0"
                  value={formData.experience}
                  onChange={(e) => handleChange('experience', parseInt(e.target.value) || 0)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>

              {/* Specializations */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Specializations</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSpecialization}
                    onChange={(e) => setNewSpecialization(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                    className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-sm"
                    placeholder="e.g. haircuts, beard, coloring"
                  />
                  <button
                    type="button"
                    onClick={addSpecialization}
                    className="p-2 bg-black text-white rounded-lg hover:bg-black/90"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.specializations?.map((spec) => (
                    <span
                      key={spec}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {spec}
                      <button
                        type="button"
                        onClick={() => removeSpecialization(spec)}
                        className="hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Certifications</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                    className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-sm"
                    placeholder="e.g. Master Barber License"
                  />
                  <button
                    type="button"
                    onClick={addCertification}
                    className="p-2 bg-black text-white rounded-lg hover:bg-black/90"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.certifications?.map((cert) => (
                    <span
                      key={cert}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {cert}
                      <button
                        type="button"
                        onClick={() => removeCertification(cert)}
                        className="hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={formData.emergencyContact?.name}
                  onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.emergencyContact?.phone}
                  onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Relationship</label>
                <input
                  type="text"
                  value={formData.emergencyContact?.relationship}
                  onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  placeholder="e.g. Wife, Brother"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-6">
            <label className="block text-sm font-bold text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              placeholder="Additional notes about the barber..."
            />
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
