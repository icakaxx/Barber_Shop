'use client';

import { useState, useEffect } from 'react';
import { X, Check, Calendar } from 'lucide-react';
import type { Barber } from '@/lib/types';
import { useI18n } from '@/contexts/I18nContext';

interface Service {
  id: string;
  name: string;
  durationMin: number;
  priceBgn?: number;
}

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface CreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: any) => void;
  shopId?: string;
  barbers: Barber[];
  selectedDate?: string; // Add this prop to pass the selected date
}

export default function CreateAppointmentModal({
  isOpen,
  onClose,
  onSave,
  shopId,
  barbers,
  selectedDate: initialSelectedDate
}: CreateAppointmentModalProps) {
  const { t, translateServiceName, locale } = useI18n();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate || new Date().toISOString().split('T')[0]);
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
        const response = await fetch(`/api/services${shopId ? `?shopId=${shopId}` : ''}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          // Translate service names
          const translatedServices = data.map((svc: any) => ({
            ...svc,
            name: translateServiceName(svc.name)
          }));
          setServices(translatedServices);
        }
      } catch (error) {
        console.error('Error loading services:', error);
      }
    };

    if (isOpen && shopId) {
      loadServices();
      // Reset selections when modal opens
      setSelectedServiceIds([]);
      setSelectedDate(initialSelectedDate || new Date().toISOString().split('T')[0]);
      setFormData(prev => ({ ...prev, startTime: '', endTime: '' }));
    }
  }, [isOpen, shopId, initialSelectedDate, translateServiceName]);

  useEffect(() => {
    if (barbers.length > 0 && !formData.barberId) {
      setFormData(prev => ({ ...prev, barberId: barbers[0].id }));
    }
  }, [barbers]);

  // Load appointments when barber or date changes
  useEffect(() => {
    const loadAppointments = async () => {
      if (!formData.barberId || !selectedDate) return;
      
      try {
        const response = await fetch(
          `/api/barbers/${formData.barberId}/appointments?date=${selectedDate}`,
          { credentials: 'include' }
        );
        if (response.ok) {
          const data = await response.json();
          setAppointments(data.filter((apt: Appointment) => 
            apt.status === 'PENDING' || apt.status === 'CONFIRMED'
          ));
        }
      } catch (error) {
        console.error('Error loading appointments:', error);
      }
    };

    if (isOpen && formData.barberId && selectedDate) {
      loadAppointments();
    }
  }, [isOpen, formData.barberId, selectedDate]);

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

  // Generate time slots (9:00 AM to 6:00 PM in 5-minute intervals)
  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeStr);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Check if a time slot is taken
  const isTimeSlotTaken = (timeStr: string): boolean => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const slotStart = new Date(selectedDate);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + 5 * 60000); // 5 minutes

    return appointments.some(apt => {
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);
      // Check if the slot overlaps with any appointment
      return (slotStart < aptEnd && slotEnd > aptStart);
    });
  };

  // Check if a slot can fit the selected services
  const canFitServices = (timeStr: string): boolean => {
    if (selectedServiceIds.length === 0) return true;
    
    const totalDuration = selectedServiceIds.reduce((total, id) => {
      const service = services.find(s => s.id === id);
      return total + (service?.durationMin || 0);
    }, 0);

    const [hours, minutes] = timeStr.split(':').map(Number);
    const slotStart = new Date(selectedDate);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + totalDuration * 60000);

    // Check if end time goes beyond business hours (18:00)
    if (slotEnd.getHours() >= 18 || (slotEnd.getHours() === 18 && slotEnd.getMinutes() > 0)) {
      return false;
    }

    // Check if the appointment would overlap with any existing appointment
    const wouldOverlap = appointments.some(apt => {
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);
      return (slotStart < aptEnd && slotEnd > aptStart);
    });

    return !wouldOverlap;
  };

  const handleTimeSlotClick = (timeStr: string) => {
    if (selectedServiceIds.length === 0) {
      alert(t('dashboard.barber.pleaseSelectService'));
      return;
    }

    if (!canFitServices(timeStr)) {
      alert(t('dashboard.barber.servicesCannotFit'));
      return;
    }

    const totalDuration = selectedServiceIds.reduce((total, id) => {
      const service = services.find(s => s.id === id);
      return total + (service?.durationMin || 0);
    }, 0);

    // Create date in local timezone to avoid timezone conversion issues
    const [hours, minutes] = timeStr.split(':').map(Number);
    const start = new Date(selectedDate);
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start.getTime() + totalDuration * 60000);

    // Format as local datetime-local string (YYYY-MM-DDTHH:mm)
    const formatLocalDateTime = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hour}:${minute}`;
    };

    setFormData({
      ...formData,
      startTime: formatLocalDateTime(start),
      endTime: formatLocalDateTime(end)
    });
  };

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
        
        // Format as local datetime-local string
        const formatLocalDateTime = (date: Date): string => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hour = String(date.getHours()).padStart(2, '0');
          const minute = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hour}:${minute}`;
        };
        
        setFormData(prev => ({ ...prev, endTime: formatLocalDateTime(end) }));
      } else if (newSelection.length === 0) {
        setFormData(prev => ({ ...prev, startTime: '', endTime: '' }));
      }
      
      return newSelection;
    });
  };

  const selectedServices = services.filter(s => selectedServiceIds.includes(s.id));
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMin, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + (s.priceBgn || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shopId || !formData.barberId || selectedServiceIds.length === 0 || !formData.startTime) {
      alert(t('dashboard.barber.pleaseSelectServiceAndFields'));
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
    const servicesLabel = locale === 'bg' ? 'Услуги' : 'Services';
    const servicesNote = selectedServices.length > 1 
      ? `${servicesLabel}: ${serviceNames}${formData.notes ? `\n\n${formData.notes}` : ''}`
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

  const isSelectedTime = (timeStr: string): boolean => {
    if (!formData.startTime) return false;
    // Parse the datetime-local string as local time
    const selectedTime = new Date(formData.startTime);
    const [hours, minutes] = timeStr.split(':').map(Number);
    return selectedTime.getHours() === hours && selectedTime.getMinutes() === minutes;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold">{t('dashboard.barber.createNewAppointment')}</h2>
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
              {t('dashboard.barber.barberLabel')} *
            </label>
            <select
              value={formData.barberId}
              onChange={(e) => {
                setFormData({ ...formData, barberId: e.target.value, startTime: '', endTime: '' });
              }}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dashboard.barber.dateLabel')} *
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setFormData(prev => ({ ...prev, startTime: '', endTime: '' }));
              }}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('dashboard.barber.servicesLabel')} * ({t('dashboard.barber.selectMultiple')})
            </label>
            <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
              {services.length === 0 ? (
                <p className="text-sm text-gray-400">{t('dashboard.barber.noServicesAvailable')}</p>
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
                  <span className="font-medium">{t('dashboard.barber.selected')}: </span>
                  {selectedServices.map(s => s.name).join(', ')}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  <span className="font-medium">{t('dashboard.barber.totalDuration')}: </span>
                  {totalDuration} {t('services.min')}
                  {totalPrice > 0 && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="font-medium">{t('dashboard.barber.totalPrice')}: </span>
                      {totalPrice} {locale === 'bg' ? 'лв' : 'лв'}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Time Slot Selector */}
          {selectedServiceIds.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('dashboard.barber.selectStartTime')} * {t('dashboard.barber.clickAvailableSlot')}
              </label>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-64 overflow-y-auto">
                  {timeSlots.map((timeStr) => {
                    const isTaken = isTimeSlotTaken(timeStr);
                    const canFit = canFitServices(timeStr);
                    const isSelected = isSelectedTime(timeStr);
                    
                    return (
                      <button
                        key={timeStr}
                        type="button"
                        onClick={() => handleTimeSlotClick(timeStr)}
                        disabled={isTaken || !canFit}
                        className={`
                          py-2 px-2 rounded-lg text-center text-xs font-medium border-2 transition-all
                          ${isSelected
                            ? 'border-black bg-black text-white'
                            : isTaken
                            ? 'border-red-300 bg-red-50 text-red-700 cursor-not-allowed opacity-60'
                            : canFit
                            ? 'border-green-300 bg-green-50 text-green-700 hover:border-green-400 hover:bg-green-100 cursor-pointer'
                            : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                          }
                        `}
                        title={isTaken ? t('dashboard.barber.timeSlotTaken') : !canFit ? t('dashboard.barber.servicesCannotFit') : t('dashboard.barber.clickToSelect')}
                      >
                        {timeStr}
                      </button>
                    );
                  })}
                </div>
                {formData.startTime && (
                  <div className="mt-3 p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                    <span className="font-medium">{t('dashboard.barber.selected')}: </span>
                    {(() => {
                      // Parse datetime-local strings as local time and format
                      const start = new Date(formData.startTime);
                      const end = new Date(formData.endTime);
                      const formatTime = (date: Date) => {
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        return `${hours}:${minutes}`;
                      };
                      return `${formatTime(start)} - ${formatTime(end)}`;
                    })()}
                  </div>
                )}
                <div className="mt-3 flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border-2 border-green-300 bg-green-50"></div>
                    <span className="text-gray-600">{t('dashboard.barber.available')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border-2 border-red-300 bg-red-50"></div>
                    <span className="text-gray-600">{t('dashboard.barber.taken')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dashboard.barber.customerName')} *
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
              {t('dashboard.barber.phoneNumber')} *
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
              {t('dashboard.barber.emailOptional')}
            </label>
            <input
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dashboard.barber.notesOptional')}
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
              {t('dashboard.barber.cancelButton')}
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-black text-white rounded-lg font-bold hover:bg-black/90 transition-colors"
            >
              {t('dashboard.barber.createAppointment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
