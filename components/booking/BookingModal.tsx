'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, Check, User } from 'lucide-react';
import { mockServices } from '@/lib/mock-data';
import type { BookingState, Service, Barber } from '@/lib/types';
import { useI18n } from '@/contexts/I18nContext';
import { extractPrice } from '@/lib/utils/price';

// Simplified barber type for booking modal UI
type BarberOption = {
  id: string;
  name: string;
  role: string;
};

export default function BookingModal() {
  const { t, formatPrice, currency } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [services, setServices] = useState<Service[]>(mockServices);
  const [barbers, setBarbers] = useState<BarberOption[]>([]);
  const [fullBarbers, setFullBarbers] = useState<Barber[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingState, setBookingState] = useState<BookingState>({
    step: 1,
    services: [],
    barber: null,
    date: null,
    time: null,
    details: { name: '', phone: '', email: '' },
  });

  // Load services from API on mount
  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            const formattedServices: Service[] = data.map((svc: any) => ({
              id: svc.id,
              name: svc.name,
              duration: svc.duration || `${svc.durationMin || 30} ${t('services.min')}`,
              price: svc.price || `${svc.priceBgn || 0} лв`, // Keep for backward compatibility
              priceBgn: svc.priceBgn || extractPrice(svc.price || '0'),
              best: false
            }));
            setServices(formattedServices);
          }
        }
      } catch (error) {
        console.error('Error loading services:', error);
      }
    };
    loadServices();
  }, []);

  // Load barbers from API on mount
  useEffect(() => {
    const loadBarbers = async () => {
      try {
        const response = await fetch('/api/barbers');
        if (response.ok) {
          const data: Barber[] = await response.json();
          if (data.length > 0) {
            setFullBarbers(data);
            // Transform API barbers to UI format
            const formattedBarbers: BarberOption[] = data.map((barber: Barber) => ({
              id: barber.id,
              name: barber.displayName,
              role: barber.profile?.role === 'BARBER_WORKER' ? 'Barber' : 'Professional'
            }));
            setBarbers(formattedBarbers);
          }
        }
      } catch (error) {
        console.error('Error loading barbers:', error);
      }
    };
    loadBarbers();
  }, []);

  // Load shops on mount
  useEffect(() => {
    const loadShops = async () => {
      try {
        const response = await fetch('/api/shops');
        if (response.ok) {
          const data = await response.json();
          setShops(data);
        }
      } catch (error) {
        console.error('Error loading shops:', error);
      }
    };
    loadShops();
  }, []);

  useEffect(() => {
    const modal = document.getElementById('bookingModal');
    if (!modal) return;

    const checkVisibility = () => {
      setIsOpen(!modal.classList.contains('hidden'));
    };

    // Check initial state
    checkVisibility();

    // Watch for class changes
    const observer = new MutationObserver(checkVisibility);
    observer.observe(modal, { attributes: true, attributeFilter: ['class'] });

    // Listen for custom events
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.serviceId) {
        const service = services.find((s) => s.id === customEvent.detail.serviceId);
        if (service) {
          setBookingState((prev) => ({ 
            ...prev, 
            services: [service], 
            step: 2 
          }));
        }
      }
      setIsOpen(true);
    };
    document.addEventListener('bookingModalOpen', handleOpen);

    return () => {
      observer.disconnect();
      document.removeEventListener('bookingModalOpen', handleOpen);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Reload available times when services change (to validate they fit in time windows)
  useEffect(() => {
    if (selectedDate && bookingState.barber && bookingState.barber.id !== 'any') {
      loadAvailableTimes(selectedDate);
    }
  }, [bookingState.services]);

  const closeModal = () => {
    const modal = document.getElementById('bookingModal');
    if (modal) {
      modal.classList.add('hidden');
    }
    setIsOpen(false);
    setSelectedDate('');
    setAvailableTimes([]);
    setBookingState({
      step: 1,
      services: [],
      barber: null,
      date: null,
      time: null,
      details: { name: '', phone: '', email: '' },
    });
  };

  const nextStep = () => {
    // Validate step 1: at least one service must be selected
    if (bookingState.step === 1 && bookingState.services.length === 0) {
      alert('Please select at least one service.');
      return;
    }
    
    // Validate step 3: date and time must be selected
    if (bookingState.step === 3 && (!selectedDate || !bookingState.time)) {
      alert('Please select a date and time.');
      return;
    }
    
    if (bookingState.step < 4) {
      setBookingState({ ...bookingState, step: bookingState.step + 1 });
    }
  };

  const prevStep = () => {
    if (bookingState.step > 1) {
      setBookingState({ ...bookingState, step: bookingState.step - 1 });
    }
  };

  const toggleService = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    const isSelected = bookingState.services.some((s) => s.id === serviceId);
    
    if (isSelected) {
      // Remove service
      setBookingState({
        ...bookingState,
        services: bookingState.services.filter((s) => s.id !== serviceId),
      });
    } else {
      // Add service
      setBookingState({
        ...bookingState,
        services: [...bookingState.services, service],
      });
    }
  };

  // Calculate total duration and price
  const calculateTotal = () => {
    let totalMinutes = 0;
    let totalPriceBgn = 0;

    bookingState.services.forEach((service) => {
      // Extract minutes from duration string (e.g., "30 min" -> 30)
      const minutes = parseInt(service.duration.replace(/\D/g, '')) || 0;
      totalMinutes += minutes;

      // Use priceBgn if available, otherwise extract from price string
      if (service.priceBgn) {
        totalPriceBgn += service.priceBgn;
      } else {
        const price = extractPrice(service.price || '0');
        totalPriceBgn += price;
      }
    });

    return {
      totalDuration: `${totalMinutes} ${t('services.min')}`,
      totalPrice: formatPrice(totalPriceBgn),
      totalPriceBgn: totalPriceBgn,
    };
  };

  const setBarber = (barberId: string) => {
    const barber = barbers.find((b) => b.id === barberId) || null;
    const barberData = barber || (barberId === 'any' ? { id: 'any', name: 'Any Barber', role: 'Fastest available' } : null);
    if (barberData) {
      setBookingState({ ...bookingState, barber: barberData, step: 3 });
      // Reset date when barber changes
      setSelectedDate('');
      setAvailableTimes([]);
    }
  };

  // Generate available dates (next 21 days)
  const getAvailableDates = () => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 21; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const setDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    const date = new Date(dateStr + 'T00:00:00');
    const formattedDate = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    setBookingState({ ...bookingState, date: formattedDate });
    
    // Load available times for selected date and barber
    loadAvailableTimes(dateStr);
  };

  const loadAvailableTimes = async (dateStr: string) => {
    // Calculate total duration needed for selected services
    const totalDurationMinutes = bookingState.services.reduce((sum, service) => {
      const minutes = parseInt(service.duration.replace(/\D/g, '')) || 0;
      return sum + minutes;
    }, 0);

    if (!bookingState.barber || bookingState.barber.id === 'any') {
      // Generate default times if no barber selected or "any barber"
      // Still validate if services fit
      const defaultTimes = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];
      setAvailableTimes(defaultTimes);
      return;
    }

    try {
      // Check existing appointments for this barber on this date
      const response = await fetch(`/api/appointments?barberId=${bookingState.barber.id}&date=${dateStr}`);
      if (response.ok) {
        const existingAppointments = await response.json();
        
        // Get active appointments with their time ranges
        const activeAppointments = existingAppointments
          .filter((apt: any) => apt.status === 'PENDING' || apt.status === 'CONFIRMED')
          .map((apt: any) => ({
            start: new Date(apt.startTime),
            end: new Date(apt.endTime)
          }))
          .sort((a: any, b: any) => a.start.getTime() - b.start.getTime());

        // Helper function to check if a time falls within any appointment
        const isTimeBlocked = (time: Date): boolean => {
          return activeAppointments.some((apt: any) => {
            return time >= apt.start && time < apt.end;
          });
        };

        // Helper function to find next appointment after a given time
        const getNextAppointment = (time: Date) => {
          return activeAppointments.find((apt: any) => apt.start > time);
        };

        // Helper function to check if services fit in available window
        const servicesFitInWindow = (startTime: Date): boolean => {
          if (totalDurationMinutes === 0) return true; // No services selected yet
          
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + totalDurationMinutes);
          
          // Check if end time goes beyond business hours (18:00)
          if (endTime.getHours() >= 18 || (endTime.getHours() === 18 && endTime.getMinutes() > 0)) {
            return false;
          }

          // Check if the appointment would overlap with any existing appointment
          const wouldOverlap = activeAppointments.some((apt: any) => {
            return (startTime < apt.end && endTime > apt.start);
          });

          if (wouldOverlap) {
            return false;
          }

          return true;
        };

        // Generate candidate time slots (every 5 minutes for precision, then round to display times)
        const candidateTimes: Date[] = [];
        const startOfDay = new Date(dateStr + 'T09:00:00');
        const endOfDay = new Date(dateStr + 'T18:00:00');
        
        for (let time = new Date(startOfDay); time < endOfDay; time.setMinutes(time.getMinutes() + 5)) {
          candidateTimes.push(new Date(time));
        }

        // Filter time slots: must not be blocked AND services must fit
        const validTimes: string[] = [];
        for (const candidateTime of candidateTimes) {
          if (!isTimeBlocked(candidateTime) && servicesFitInWindow(candidateTime)) {
            const timeStr = `${candidateTime.getHours().toString().padStart(2, '0')}:${candidateTime.getMinutes().toString().padStart(2, '0')}`;
            // Only add if we don't already have this time (avoid duplicates)
            if (!validTimes.includes(timeStr)) {
              validTimes.push(timeStr);
            }
          }
        }

        // If no services selected yet, show all available slots in 30-min intervals for better UX
        if (totalDurationMinutes === 0) {
          const simplifiedTimes: string[] = [];
          for (let hour = 9; hour < 18; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
              const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
              const testTime = new Date(dateStr + `T${timeStr}:00`);
              if (!isTimeBlocked(testTime)) {
                simplifiedTimes.push(timeStr);
              }
            }
          }
          setAvailableTimes(simplifiedTimes);
        } else {
          setAvailableTimes(validTimes);
        }
      }
    } catch (error) {
      console.error('Error loading available times:', error);
      // Fallback to default times
      const defaultTimes = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];
      setAvailableTimes(defaultTimes);
    }
  };

  const setDateTime = (time: string) => {
    setBookingState({ ...bookingState, time, step: 4 });
  };

  const confirmBooking = async () => {
    const nameInput = document.getElementById('custName') as HTMLInputElement;
    const phoneInput = document.getElementById('custPhone') as HTMLInputElement;

    if (!nameInput?.value || !phoneInput?.value) {
      alert('Please fill in your details.');
      return;
    }

    if (!bookingState.barber || bookingState.barber.id === 'any') {
      alert('Please select a barber.');
      return;
    }

    if (!selectedDate || !bookingState.time) {
      alert('Please select a date and time.');
      return;
    }

    if (bookingState.services.length === 0) {
      alert('Please select at least one service.');
      return;
    }

    setLoading(true);

    try {
      // Get barber details to find shopId
      const fullBarber = fullBarbers.find(b => b.id === bookingState.barber!.id);
      if (!fullBarber || !fullBarber.shopId) {
        alert('Unable to determine shop. Please try again.');
        setLoading(false);
        return;
      }

      // Get first shop if no shopId in barber
      const shopId = fullBarber.shopId || (shops.length > 0 ? shops[0].id : null);
      if (!shopId) {
        alert('No shop available. Please contact support.');
        setLoading(false);
        return;
      }

      // Calculate total duration
      const totalMinutes = bookingState.services.reduce((sum, service) => {
        const minutes = parseInt(service.duration.replace(/\D/g, '')) || 0;
        return sum + minutes;
      }, 0);

      // Create start and end times
      const [hours, minutes] = bookingState.time.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + totalMinutes);

      // For multiple services, create one appointment with the primary service and list others in notes
      const primaryService = bookingState.services[0];
      const otherServices = bookingState.services.slice(1);
      const serviceNotes = otherServices.length > 0 
        ? `Additional services: ${otherServices.map(s => s.name).join(', ')}`
        : null;

      // Create appointment
      const appointmentData = {
        shopId,
        serviceId: primaryService.id,
        barberId: bookingState.barber.id,
        customerName: nameInput.value,
        customerPhone: phoneInput.value,
        customerEmail: '', // Can be added later
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: serviceNotes
      };

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        if (response.status === 409) {
          alert('This time slot is already booked. Please choose another time.');
        } else {
          alert(`Error booking appointment: ${error.error || 'Unknown error'}`);
        }
        setLoading(false);
        return;
      }

      // Success - move to confirmation step
      setBookingState({ ...bookingState, step: 5 });
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const progress = (bookingState.step / 4) * 100;

  return (
    <div
      id="bookingModal"
      className={`fixed inset-0 z-[100] ${isOpen ? '' : 'hidden'}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
      <div className="absolute inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:max-w-2xl bg-white md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold">Book an Appointment</h2>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
              {bookingState.step === 5 ? 'Success!' : `Step ${bookingState.step} of 4`}
            </p>
          </div>
          <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {bookingState.step !== 5 && (
          <div className="h-1.5 w-full bg-gray-100">
            <div className="h-full bg-black transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {bookingState.step === 1 && (
            <div>
              <h3 className="text-xl font-bold mb-2">Choose Services</h3>
              <p className="text-sm text-gray-500 mb-6">Select one or more services</p>
              <div className="space-y-3">
                {services.map((service) => {
                  const isSelected = bookingState.services.some((s) => s.id === service.id);
                  return (
                    <button
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={`w-full p-4 border rounded-xl text-left flex justify-between items-center transition-all hover:border-black ${
                        isSelected
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'border-white bg-white' : 'border-gray-400'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-black" />}
                        </div>
                        <div>
                          <p className="font-bold">{service.name}</p>
                          <p className={`text-sm ${isSelected ? 'text-gray-400' : 'text-gray-500'}`}>
                            {service.duration}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {service.priceBgn ? formatPrice(service.priceBgn) : service.price}
                        </p>
                        {service.best && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            isSelected ? 'bg-white text-black' : 'bg-black text-white'
                          }`}>
                            Best Value
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              {bookingState.services.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Total Duration:</span>
                    <span className="text-sm font-bold">{calculateTotal().totalDuration}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total Price:</span>
                    <span className="text-lg font-bold">{calculateTotal().totalPrice}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {bookingState.step === 2 && (
            <div>
              <h3 className="text-xl font-bold mb-6">Select a Barber</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...barbers, { id: 'any', name: 'Any Barber', role: 'Fastest available' }].map((barber) => (
                  <button
                    key={barber.id}
                    onClick={() => setBarber(barber.id)}
                    className={`p-4 border rounded-xl text-center transition-all hover:border-black ${
                      bookingState.barber?.id === barber.id ? 'border-black bg-black text-white' : 'border-gray-200'
                    }`}
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center text-black">
                      <User className="w-6 h-6" />
                    </div>
                    <p className="font-bold">{barber.name}</p>
                    <p className={`text-xs ${bookingState.barber?.id === barber.id ? 'text-gray-400' : 'text-gray-500'}`}>
                      {barber.role}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {bookingState.step === 3 && (
            <div>
              <h3 className="text-xl font-bold mb-2">Select Date</h3>
              <p className="text-sm text-gray-500 mb-6">Choose a date for your appointment</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6 max-h-64 overflow-y-auto">
                {getAvailableDates().map((dateStr) => {
                  const date = new Date(dateStr + 'T00:00:00');
                  const isToday = dateStr === new Date().toISOString().split('T')[0];
                  const isSelected = selectedDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setDate(dateStr)}
                      className={`py-3 border rounded-lg text-center text-sm font-medium transition-all ${
                        isSelected
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 hover:border-black'
                      }`}
                    >
                      <div className="text-xs text-gray-500 mb-1">{date.toLocaleDateString('en-GB', { weekday: 'short' })}</div>
                      <div className="font-bold">{date.getDate()}</div>
                      {isToday && <div className="text-[10px] text-gray-400 mt-1">Today</div>}
                    </button>
                  );
                })}
              </div>
              
              {selectedDate && (
                <div className="mt-6">
                  <h4 className="text-lg font-bold mb-3">Available Times</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                    {availableTimes.length > 0 ? (
                      availableTimes.map((time) => (
                        <button
                          key={time}
                          onClick={() => setDateTime(time)}
                          className={`py-2 border rounded-lg text-center text-sm font-medium transition-all ${
                            bookingState.time === time
                              ? 'border-black bg-black text-white'
                              : 'border-gray-200 hover:border-black'
                          }`}
                        >
                          {time}
                        </button>
                      ))
                    ) : (
                      <p className="col-span-full text-sm text-gray-500 text-center py-4">No available times for this date</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {bookingState.step === 4 && (
            <div>
              <h3 className="text-xl font-bold mb-6">Your Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    id="custName"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    id="custPhone"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                    placeholder="+359 ..."
                  />
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-6">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-3">Summary</p>
                  <div className="space-y-2 mb-3">
                    {bookingState.services.map((service) => (
                      <div key={service.id} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{service.name}</span>
                        <span className="text-sm font-bold">
                          {service.priceBgn ? formatPrice(service.priceBgn) : service.price}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Total:</span>
                      <span className="text-lg font-bold">{calculateTotal().totalPrice}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {bookingState.barber?.name} • {bookingState.date} at {bookingState.time} • {calculateTotal().totalDuration}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {bookingState.step === 5 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-bold mb-2">Confirmed!</h3>
              <p className="text-gray-500 mb-8 px-8">
                Your appointment is booked. We&apos;ve sent the details to your phone.
              </p>
              <button
                onClick={closeModal}
                className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-black/90 transition-all"
              >
                Got it
              </button>
            </div>
          )}
        </div>

        {bookingState.step !== 5 && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
            <button
              onClick={prevStep}
              className={`text-sm font-semibold text-gray-600 hover:text-black flex items-center gap-1 ${
                bookingState.step === 1 ? 'invisible' : ''
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <div>
              {bookingState.step < 4 && (
                <button
                  onClick={nextStep}
                  className="bg-black text-white px-8 py-2 rounded-lg font-bold hover:bg-black/90 transition-colors"
                >
                  Continue
                </button>
              )}
              {bookingState.step === 4 && (
                <button
                  onClick={confirmBooking}
                  disabled={loading}
                  className="bg-black text-white px-8 py-2 rounded-lg font-bold hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Booking...' : 'Confirm Appointment'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

