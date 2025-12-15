'use client';

import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import type { Barber } from '@/lib/types';

interface Service {
  id: string;
  name: string;
  durationMin: number;
  priceBgn?: number;
}

interface CreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: any) => void;
  shopId?: string;
  barbers: Barber[];
}

export default function CreateAppointmentModal({
  isOpen,
  onClose,
  onSave,
  shopId,
  barbers
}: CreateAppointmentModalProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    barberId: barbers[0]?.id || '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    startTime: '',
    endTime: '',
    notes: ''
  });

  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await fetch(`/api/services${shopId ? `?shopId=${shopId}` : ''}`);
        if (response.ok) {
          const data = await response.json();
          setServices(data);
        }
      } catch (error) {
        console.error('Error loading services:', error);
      }
    };

    if (isOpen && shopId) {
      loadServices();
      // Reset selections when modal opens
      setSelectedServiceIds([]);
      setFormData(prev => ({ ...prev, startTime: '', endTime: '' }));
    }
  }, [isOpen, shopId]);

  useEffect(() => {
    if (barbers.length > 0 && !formData.barberId) {
      setFormData(prev => ({ ...prev, barberId: barbers[0].id }));
    }
  }, [barbers]);

  const handleClose = () => {
    setSelectedServiceIds([]);
    setFormData({
      barberId: barbers[0]?.id || '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      startTime: '',
      endTime: '',
      notes: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds(prev => {
      const newSelection = prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId];
      
      // Recalculate end time if start time is set
      if (formData.startTime && newSelection.length > 0) {
        const totalDuration = newSelection.reduce((total, id) => {
          const service = services.find(s => s.id === id);
          return total + (service?.durationMin || 0);
        }, 0);
        
        const start = new Date(formData.startTime);
        const end = new Date(start.getTime() + totalDuration * 60000);
        setFormData(prev => ({ ...prev, endTime: end.toISOString().slice(0, 16) }));
      }
      
      return newSelection;
    });
  };

  const handleStartTimeChange = (startTime: string) => {
    if (selectedServiceIds.length > 0) {
      const totalDuration = selectedServiceIds.reduce((total, id) => {
        const service = services.find(s => s.id === id);
        return total + (service?.durationMin || 0);
      }, 0);
      
      const start = new Date(startTime);
      const end = new Date(start.getTime() + totalDuration * 60000);
      setFormData({
        ...formData,
        startTime,
        endTime: end.toISOString().slice(0, 16)
      });
    } else {
      setFormData({ ...formData, startTime, endTime: '' });
    }
  };

  const selectedServices = services.filter(s => selectedServiceIds.includes(s.id));
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMin, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + (s.priceBgn || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shopId || !formData.barberId || selectedServiceIds.length === 0) {
      alert('Please select at least one service and fill in all required fields');
      return;
    }

    // Use the first selected service as the primary service (or longest one)
    const primaryService = selectedServices.length > 0 
      ? selectedServices.reduce((longest, current) => 
          current.durationMin > longest.durationMin ? current : longest
        )
      : services.find(s => s.id === selectedServiceIds[0]);

    // Build notes with all selected services
    const serviceNames = selectedServices.map(s => s.name).join(', ');
    const servicesNote = selectedServices.length > 1 
      ? `Services: ${serviceNames}${formData.notes ? `\n\n${formData.notes}` : ''}`
      : formData.notes || null;

    onSave({
      shopId,
      barberId: formData.barberId,
      serviceId: primaryService?.id || selectedServiceIds[0],
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerEmail: formData.customerEmail || null,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
      notes: servicesNote
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold">Create New Appointment</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Barber *
            </label>
            <select
              value={formData.barberId}
              onChange={(e) => setFormData({ ...formData, barberId: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              required
            >
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.displayName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Services * (Select multiple)
            </label>
            <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
              {services.length === 0 ? (
                <p className="text-sm text-gray-400">No services available</p>
              ) : (
                services.map((service) => {
                  const isSelected = selectedServiceIds.includes(service.id);
                  return (
                    <label
                      key={service.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-black text-white'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-5 h-5 border-2 rounded flex items-center justify-center ${
                        isSelected ? 'border-white' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{service.name}</div>
                        <div className={`text-xs ${isSelected ? 'text-gray-200' : 'text-gray-500'}`}>
                          {service.durationMin} min
                          {service.priceBgn && ` • ${service.priceBgn} лв`}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleService(service.id)}
                        className="sr-only"
                      />
                    </label>
                  );
                })
              )}
            </div>
            {selectedServiceIds.length > 0 && (
              <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Selected: </span>
                  {selectedServices.map(s => s.name).join(', ')}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  <span className="font-medium">Total Duration: </span>
                  {totalDuration} min
                  {totalPrice > 0 && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="font-medium">Total Price: </span>
                      {totalPrice} лв
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (optional)
            </label>
            <input
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time *
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 border border-gray-200 rounded-lg font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-black text-white rounded-lg font-bold hover:bg-black/90 transition-colors"
            >
              Create Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

