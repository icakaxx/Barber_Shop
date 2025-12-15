'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, Check, User } from 'lucide-react';
import { mockServices, mockBarbers } from '@/lib/mock-data';
import type { BookingState, Service } from '@/lib/types';

export default function BookingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [services, setServices] = useState<Service[]>(mockServices);
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
              duration: svc.duration,
              price: svc.price,
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

  const closeModal = () => {
    const modal = document.getElementById('bookingModal');
    if (modal) {
      modal.classList.add('hidden');
    }
    setIsOpen(false);
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
    let totalPrice = 0;

    bookingState.services.forEach((service) => {
      // Extract minutes from duration string (e.g., "30 min" -> 30)
      const minutes = parseInt(service.duration.replace(/\D/g, '')) || 0;
      totalMinutes += minutes;

      // Extract price from price string (e.g., "25 лв" -> 25)
      const price = parseInt(service.price.replace(/\D/g, '')) || 0;
      totalPrice += price;
    });

    return {
      totalDuration: `${totalMinutes} min`,
      totalPrice: `${totalPrice} лв`,
    };
  };

  const setBarber = (barberId: string) => {
    const barber = mockBarbers.find((b) => b.id === barberId) || null;
    const barberData = barber || (barberId === 'any' ? { id: 'any', name: 'Any Barber', role: 'Fastest available' as any } : null);
    if (barberData) {
      setBookingState({ ...bookingState, barber: barberData, step: 3 });
    }
  };

  const setDateTime = (time: string) => {
    const date = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    setBookingState({ ...bookingState, time, date, step: 4 });
  };

  const confirmBooking = () => {
    const nameInput = document.getElementById('custName') as HTMLInputElement;
    const phoneInput = document.getElementById('custPhone') as HTMLInputElement;

    if (!nameInput?.value || !phoneInput?.value) {
      alert('Please fill in your details.');
      return;
    }

    setBookingState({ ...bookingState, step: 5 });
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
                        <p className="font-bold">{service.price}</p>
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
                {[...mockBarbers, { id: 'any', name: 'Any Barber', role: 'Fastest available' }].map((barber) => (
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
              <h3 className="text-xl font-bold mb-2">Pick a Time</h3>
              <p className="text-sm text-gray-500 mb-6">Availability for Today</p>
              <div className="grid grid-cols-3 gap-3">
                {['09:00', '09:30', '10:00', '11:00', '13:30', '14:00', '15:30', '16:00', '17:30'].map((time) => (
                  <button
                    key={time}
                    onClick={() => setDateTime(time)}
                    className="py-3 border border-gray-200 rounded-lg text-center font-medium hover:border-black hover:bg-black hover:text-white transition-all"
                  >
                    {time}
                  </button>
                ))}
              </div>
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
                        <span className="text-sm font-bold">{service.price}</span>
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
                  className="bg-black text-white px-8 py-2 rounded-lg font-bold hover:bg-black/90 transition-colors"
                >
                  Confirm Appointment
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

