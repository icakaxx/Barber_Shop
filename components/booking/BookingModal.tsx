'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, Check, User } from 'lucide-react';
import { mockServices } from '@/lib/mock-data';
import type { BookingState, Service, Barber } from '@/lib/types';
import { useI18n } from '@/contexts/I18nContext';
import { extractPrice } from '@/lib/utils/price';
import { useShopBranding } from '@/contexts/ShopBrandingContext';
import { getHoursForDate, overlapsLunch } from '@/lib/utils/shopHours';

// Simplified barber type for booking modal UI
type BarberOption = {
  id: string;
  name: string;
  role: string;
  photoUrl?: string;
};

export default function BookingModal() {
  const { t, formatPrice, currency, translateServiceName, locale } = useI18n();
  const { shop } = useShopBranding();
  const [isOpen, setIsOpen] = useState(false);
  const [services, setServices] = useState<Service[]>(mockServices);
  const [serviceOriginalNames, setServiceOriginalNames] = useState<Map<string, string>>(new Map());
  const [barbers, setBarbers] = useState<BarberOption[]>([]);
  const [fullBarbers, setFullBarbers] = useState<Barber[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [findingBarber, setFindingBarber] = useState(false);
  const [availableBarbersList, setAvailableBarbersList] = useState<Array<{ barberId: string; shopId: string; barber: Barber }>>([]);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [bookingState, setBookingState] = useState<BookingState>({
    step: 1,
    services: [],
    barber: null,
    date: null,
    time: null,
    details: { name: '', phone: '', email: '' },
  });

  // Load services from API on mount and when locale changes
  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            const nameMap = new Map<string, string>();
            const formattedServices: Service[] = data.map((svc: any) => {
              const originalName = svc.name;
              const translatedName = translateServiceName(originalName);
              nameMap.set(svc.id, originalName); // Store original name for API calls
              return {
                id: svc.id,
                name: translatedName, // Translate service name for display
                duration: svc.duration || `${svc.durationMin || 30} ${t('services.min')}`,
                price: svc.price || `${svc.priceBgn || 0} лв`, // Keep for backward compatibility
                priceBgn: svc.priceBgn || extractPrice(svc.price || '0'),
                best: false
              };
            });
            setServiceOriginalNames(nameMap);
            setServices(formattedServices);
            return;
          }
        }
      } catch (error) {
        console.error('Error loading services:', error);
      }
      
      // Fallback to mockServices if API fails - translate them too
      const nameMap = new Map<string, string>();
      const translatedMockServices: Service[] = mockServices.map((svc) => {
        const originalName = svc.name;
        const translatedName = translateServiceName(originalName);
        nameMap.set(svc.id, originalName);
        return {
          ...svc,
          name: translatedName,
        };
      });
      setServiceOriginalNames(nameMap);
      setServices(translatedMockServices);
    };
    loadServices();
  }, [translateServiceName, t, locale]);

  // Load barbers from API on mount and when locale changes
  useEffect(() => {
    const loadBarbers = async () => {
      try {
        const response = await fetch('/api/barbers');
        if (response.ok) {
          const data: Barber[] = await response.json();
          if (data.length > 0) {
            setFullBarbers(data);
            // Transform API barbers to UI format with translated roles
            const formattedBarbers: BarberOption[] = data.map((barber: Barber) => ({
              id: barber.id,
              name: barber.displayName,
              role: barber.profile?.role === 'BARBER_WORKER' ? t('booking.barberRole') : t('booking.professionalRole'),
              photoUrl: barber.photoUrl
            }));
            setBarbers(formattedBarbers);
          }
        }
      } catch (error) {
        console.error('Error loading barbers:', error);
      }
    };
    loadBarbers();
  }, [t, locale]);

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
      const detail = customEvent.detail || {};
      let nextState: Partial<BookingState> = {};

      if (detail.serviceId) {
        const service = services.find((s) => s.id === detail.serviceId);
        if (service) {
          nextState = { services: [service], step: 2 };
        }
      }
      if (detail.barberId) {
        const barberOption = barbers.find((b) => b.id === detail.barberId);
        if (barberOption) {
          nextState = {
            ...nextState,
            barber: { id: barberOption.id, name: barberOption.name, role: barberOption.role },
            step: nextState.step ?? 1,
          };
        }
      }

      if (Object.keys(nextState).length > 0) {
        setBookingState((prev) => ({ ...prev, ...nextState }));
      }
      setIsOpen(true);
    };
    document.addEventListener('bookingModalOpen', handleOpen);

    return () => {
      observer.disconnect();
      document.removeEventListener('bookingModalOpen', handleOpen);
    };
  }, [services, barbers]);

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
      alert(t('booking.selectAtLeastOneService'));
      return;
    }
    
    // Validate step 3: date and time must be selected, and barber must be assigned (if "Any Barber" was selected)
    if (bookingState.step === 3) {
      if (!selectedDate || !bookingState.time) {
        alert(t('booking.pleaseSelectDateAndTime'));
        return;
      }
      
      // If "Any Barber" is selected but no specific barber assigned yet, user needs to select one
      if (bookingState.barber?.id === 'any' && availableBarbersList.length === 0) {
        // This shouldn't happen if setDateTime worked correctly, but safety check
        alert(t('booking.pleaseSelectBarber'));
        return;
      }
      
      // If there are available barbers but none selected yet, prompt user to select
      if (bookingState.barber?.id === 'any' && availableBarbersList.length > 0) {
        alert(t('booking.selectBarberFromList'));
        return;
      }
    }
    
    if (bookingState.step < 4) {
      setBookingState(prev => ({ ...prev, step: prev.step + 1 }));
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
    const barberData = barber || (barberId === 'any' ? { id: 'any', name: t('booking.anyBarber'), role: t('booking.fastestAvailable') } : null);
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

  // Helper function to format weekday based on locale
  const formatWeekday = (date: Date): string => {
    if (locale === 'bg') {
      // Bulgarian short day names: Sunday=0, Monday=1, ..., Saturday=6
      const bgDays = ['Нед', 'Пон', 'Вт', 'Ср', 'Чет', 'Пет', 'Съб'];
      return bgDays[date.getDay()];
    }
    return date.toLocaleDateString('en-GB', { weekday: 'short' });
  };

  // Helper function to format full date based on locale (used in summary)
  const formatFullDate = (date: Date): string => {
    if (locale === 'bg') {
      // Bulgarian short day names and month abbreviations
      const bgDays = ['Нед', 'Пон', 'Вт', 'Ср', 'Чет', 'Пет', 'Съб'];
      const bgMonths = ['яну', 'фев', 'мар', 'апр', 'май', 'юни', 'юли', 'авг', 'сеп', 'окт', 'ное', 'дек'];
      const dayName = bgDays[date.getDay()];
      const day = date.getDate();
      const month = bgMonths[date.getMonth()];
      return `${dayName}, ${day} ${month}`;
    }
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const setDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    const date = new Date(dateStr + 'T00:00:00');
    const formattedDate = formatFullDate(date);
    setBookingState({ ...bookingState, date: formattedDate });
    
    // Load available times for selected date and barber
    loadAvailableTimes(dateStr);
  };

  const loadAvailableTimes = async (dateStr: string) => {
    const totalDurationMinutes = bookingState.services.reduce((sum, service) => {
      const minutes = parseInt(service.duration.replace(/\D/g, '')) || 0;
      return sum + minutes;
    }, 0);

    const date = new Date(dateStr + 'T12:00:00');
    const dayHours = getHoursForDate(shop?.workingHours, date);
    const lunchStart = shop?.lunchStart;
    const lunchEnd = shop?.lunchEnd;

    if (!dayHours) {
      setAvailableTimes([]);
      return;
    }

    const startOfDay = new Date(dateStr + `T${dayHours.open}:00`);
    const endOfDay = new Date(dateStr + `T${dayHours.close}:00`);

    const isDuringLunch = (timeStr: string) => {
      if (!lunchStart || !lunchEnd) return false;
      const [h, m] = timeStr.split(':').map(Number);
      const [lStartH, lStartM] = lunchStart.split(':').map(Number);
      const [lEndH, lEndM] = lunchEnd.split(':').map(Number);
      const minutes = h * 60 + m;
      const lunchStartMinutes = lStartH * 60 + lStartM;
      const lunchEndMinutes = lEndH * 60 + lEndM;
      return minutes >= lunchStartMinutes && minutes < lunchEndMinutes;
    };

    const wouldOverlapLunch = (startStr: string) =>
      overlapsLunch(dateStr, startStr, totalDurationMinutes, lunchStart, lunchEnd);

    if (!bookingState.barber || bookingState.barber.id === 'any') {
      const times: string[] = [];
      for (let slot = new Date(startOfDay); slot < endOfDay; slot.setMinutes(slot.getMinutes() + 30)) {
        const timeStr = `${slot.getHours().toString().padStart(2, '0')}:${slot.getMinutes().toString().padStart(2, '0')}`;
        if (!isDuringLunch(timeStr) && !wouldOverlapLunch(timeStr)) times.push(timeStr);
      }
      setAvailableTimes(times);
      return;
    }

    try {
      const response = await fetch(`/api/appointments?barberId=${bookingState.barber.id}&date=${dateStr}`);
      if (response.ok) {
        const existingAppointments = await response.json();
        const activeAppointments = existingAppointments
          .filter((apt: any) => apt.status === 'PENDING' || apt.status === 'CONFIRMED')
          .map((apt: any) => ({ start: new Date(apt.startTime), end: new Date(apt.endTime) }))
          .sort((a: any, b: any) => a.start.getTime() - b.start.getTime());

        const isTimeBlocked = (time: Date) =>
          activeAppointments.some((apt: any) => time >= apt.start && time < apt.end);

        const servicesFitInWindow = (startTime: Date): boolean => {
          if (totalDurationMinutes === 0) return true;
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + totalDurationMinutes);
          if (endTime > endOfDay) return false;
          const startStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
          if (wouldOverlapLunch(startStr)) return false;
          if (activeAppointments.some((apt: any) => startTime < apt.end && endTime > apt.start)) return false;
          return true;
        };

        const candidateTimes: Date[] = [];
        for (let slot = new Date(startOfDay); slot < endOfDay; slot.setMinutes(slot.getMinutes() + 5)) {
          candidateTimes.push(new Date(slot));
        }

        const validTimes: string[] = [];
        for (const candidateTime of candidateTimes) {
          const timeStr = `${candidateTime.getHours().toString().padStart(2, '0')}:${candidateTime.getMinutes().toString().padStart(2, '0')}`;
          if (isDuringLunch(timeStr)) continue;
          if (!isTimeBlocked(candidateTime) && servicesFitInWindow(candidateTime) && !validTimes.includes(timeStr)) {
            validTimes.push(timeStr);
          }
        }

        if (totalDurationMinutes === 0) {
          const simplified: string[] = [];
          for (let slot = new Date(startOfDay); slot < endOfDay; slot.setMinutes(slot.getMinutes() + 30)) {
            const timeStr = `${slot.getHours().toString().padStart(2, '0')}:${slot.getMinutes().toString().padStart(2, '0')}`;
            if (!isDuringLunch(timeStr) && !isTimeBlocked(slot)) simplified.push(timeStr);
          }
          setAvailableTimes(simplified);
        } else {
          setAvailableTimes(validTimes);
        }
      }
    } catch (error) {
      console.error('Error loading available times:', error);
      setAvailableTimes([]);
    }
  };

  const setDateTime = async (time: string) => {
    // If "Any Barber" is selected, find and assign an available barber when time is selected
    if (bookingState.barber?.id === 'any' && selectedDate) {
      setFindingBarber(true);
      
      try {
        // Calculate total duration
        const totalMinutes = bookingState.services.reduce((sum, service) => {
          const minutes = parseInt(service.duration.replace(/\D/g, '')) || 0;
          return sum + minutes;
        }, 0);

        // Create start and end times
        const [hours, minutes] = time.split(':').map(Number);
        const startTime = new Date(selectedDate);
        startTime.setHours(hours, minutes, 0, 0);
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + totalMinutes);

        const dateForCheck = new Date(selectedDate + 'T12:00:00');
        const dayH = getHoursForDate(shop?.workingHours, dateForCheck);
        if (dayH) {
          const [closeH, closeM] = dayH.close.split(':').map(Number);
          if (endTime.getHours() > closeH || (endTime.getHours() === closeH && endTime.getMinutes() > closeM)) {
            alert(t('booking.servicesExceedBusinessHours'));
            setFindingBarber(false);
            return;
          }
          if (overlapsLunch(selectedDate, time, totalMinutes, shop?.lunchStart, shop?.lunchEnd)) {
            alert(t('booking.servicesExceedBusinessHours'));
            setFindingBarber(false);
            return;
          }
        }

        // Find all available barbers
        const availableBarbers = await findAllAvailableBarbers(startTime, endTime);
        
        if (availableBarbers.length === 0) {
          alert(t('booking.noBarberAvailable'));
          setFindingBarber(false);
          return;
        }

        // Format the date for display
        const date = new Date(selectedDate + 'T00:00:00');
        const formattedDate = formatFullDate(date);
        
        // Store available barbers list
        setAvailableBarbersList(availableBarbers);
        
        // If only one barber available, auto-assign them
        if (availableBarbers.length === 1) {
          const assignedBarber = availableBarbers[0].barber;
          setBookingState(prev => ({
            ...prev,
            time,
            date: formattedDate,
            barber: {
              id: assignedBarber.id,
              name: assignedBarber.displayName,
              role: assignedBarber.profile?.role === 'BARBER_WORKER' ? t('booking.barberRole') : t('booking.professionalRole')
            }
          }));
          setAvailableBarbersList([]); // Clear the list since barber is assigned
        } else {
          // Multiple barbers available - show list for user to choose
          // Set time and date, but keep barber as 'any' until user selects one
          setBookingState(prev => ({
            ...prev,
            time,
            date: formattedDate
            // Barber stays as 'any' until user selects from the list
          }));
        }
      } catch (error) {
        console.error('Error finding available barber:', error);
        alert(t('booking.noBarberAvailable'));
      } finally {
        setFindingBarber(false);
      }
    } else {
      // Specific barber already selected, just set time and move to step 4
      setBookingState(prev => ({ ...prev, time, step: 4 }));
    }
  };

  // Find all available barbers at the specified date/time
  const findAllAvailableBarbers = async (startTime: Date, endTime: Date): Promise<Array<{ barberId: string; shopId: string; barber: Barber }>> => {
    try {
      // Get all active barbers (across all shops)
      const activeBarbers = fullBarbers.filter(b => b.isActive && b.shopId);
      
      if (activeBarbers.length === 0) {
        return [];
      }

      const dateStr = startTime.toISOString().split('T')[0];
      const availableBarbers: Array<{ barberId: string; shopId: string; barber: Barber }> = [];

      // Check each barber's availability
      for (const barber of activeBarbers) {
        try {
          // Check existing appointments for this barber on this date
          const response = await fetch(`/api/barbers/${barber.id}/appointments?date=${dateStr}`);
          
          if (response.ok) {
            const existingAppointments = await response.json();
            
            // Filter active appointments (PENDING or CONFIRMED)
            const activeAppointments = existingAppointments
              .filter((apt: any) => apt.status === 'PENDING' || apt.status === 'CONFIRMED')
              .map((apt: any) => ({
                start: new Date(apt.startTime),
                end: new Date(apt.endTime)
              }));

            // Check if the requested time slot overlaps with any existing appointment
            const hasConflict = activeAppointments.some((apt: any) => {
              return (startTime < apt.end && endTime > apt.start);
            });

            // If no conflict, this barber is available
            if (!hasConflict && barber.shopId) {
              availableBarbers.push({
                barberId: barber.id,
                shopId: barber.shopId,
                barber: barber
              });
            }
          }
        } catch (error) {
          console.error(`Error checking availability for barber ${barber.id}:`, error);
          // Continue checking other barbers if one fails
          continue;
        }
      }

      return availableBarbers;
    } catch (error) {
      console.error('Error finding available barbers:', error);
      return [];
    }
  };

  // Find the first available barber (for backwards compatibility)
  const findAvailableBarber = async (startTime: Date, endTime: Date): Promise<{ barberId: string; shopId: string } | null> => {
    const availableBarbers = await findAllAvailableBarbers(startTime, endTime);
    if (availableBarbers.length === 0) {
      return null;
    }
    return {
      barberId: availableBarbers[0].barberId,
      shopId: availableBarbers[0].shopId
    };
  };

  const confirmBooking = async () => {
    const nameInput = document.getElementById('custName') as HTMLInputElement;
    const phoneInput = document.getElementById('custPhone') as HTMLInputElement;
    const emailInput = document.getElementById('custEmail') as HTMLInputElement;

    if (!nameInput?.value || !phoneInput?.value || !emailInput?.value) {
      alert(t('booking.fillAllFields'));
      return;
    }

    if (!selectedDate || !bookingState.time) {
      alert(t('booking.pleaseSelectDateAndTime'));
      return;
    }

    if (bookingState.services.length === 0) {
      alert(t('booking.selectAtLeastOneService'));
      return;
    }

    setLoading(true);

    try {
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

      const dateForCheck = new Date(selectedDate + 'T12:00:00');
      const dayH = getHoursForDate(shop?.workingHours, dateForCheck);
      if (dayH) {
        const [closeH, closeM] = dayH.close.split(':').map(Number);
        if (endTime.getHours() > closeH || (endTime.getHours() === closeH && endTime.getMinutes() > closeM)) {
          alert(t('booking.servicesExceedBusinessHours'));
          setLoading(false);
          return;
        }
        if (overlapsLunch(selectedDate, bookingState.time!, totalMinutes, shop?.lunchStart, shop?.lunchEnd)) {
          alert(t('booking.servicesExceedBusinessHours'));
          setLoading(false);
          return;
        }
      }

      // Ensure barbers are loaded
      if (fullBarbers.length === 0) {
        alert(t('booking.noShopAvailable'));
        setLoading(false);
        return;
      }

      // Handle barber selection - at this point (step 4), a specific barber should be selected
      // If "Any Barber" was originally selected, a barber should have been assigned in step 3
      let selectedBarberId: string;
      let shopId: string;

      if (!bookingState.barber || bookingState.barber.id === 'any') {
        // This shouldn't happen if validation worked correctly, but safety check
        // Try to find an available barber as fallback
        const availableBarber = await findAvailableBarber(startTime, endTime);
        
        if (!availableBarber) {
          alert(t('booking.noBarberAvailable'));
          setLoading(false);
          return;
        }

        selectedBarberId = availableBarber.barberId;
        shopId = availableBarber.shopId;
      } else {
        // Specific barber selected (either from step 2 or chosen from list in step 3)
        selectedBarberId = bookingState.barber.id;
        
        // Get barber details to find shopId
        const fullBarber = fullBarbers.find(b => b.id === selectedBarberId);
        if (!fullBarber || !fullBarber.shopId) {
          alert(t('booking.unableToDetermineShop'));
          setLoading(false);
          return;
        }

        shopId = fullBarber.shopId || (shops.length > 0 ? shops[0].id : null);
        if (!shopId) {
          alert(t('booking.noShopAvailable'));
          setLoading(false);
          return;
        }
      }

      // For multiple services, create one appointment with the primary service and list others in notes
      const primaryService = bookingState.services[0];
      const otherServices = bookingState.services.slice(1);
      const serviceNotes = otherServices.length > 0 
        ? `${t('booking.additionalServices')}: ${otherServices.map(s => s.name).join(', ')}`
        : null;
      // Use original service names for API (stored in database)
      const allServiceNames = bookingState.services.map(s => serviceOriginalNames.get(s.id) || s.name);

      // Create appointment
      const appointmentData = {
        shopId,
        serviceId: primaryService.id,
        barberId: selectedBarberId,
        customerName: nameInput.value,
        customerPhone: phoneInput.value,
        customerEmail: emailInput.value,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: serviceNotes,
        allServiceNames
      };

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        if (response.status === 409) {
          alert(t('booking.timeSlotBooked'));
        } else {
          alert(`${t('booking.bookingError')}: ${error.error || 'Unknown error'}`);
        }
        setLoading(false);
        return;
      }

      // Success - move to confirmation step
      setBookingState({ ...bookingState, step: 5 });
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert(t('booking.failedToBook'));
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
            <h2 className="text-xl font-bold">{t('booking.title')}</h2>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
              {bookingState.step === 5 ? t('booking.success') : `${t('booking.step')} ${bookingState.step} ${t('booking.of')} 4`}
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
              <h3 className="text-xl font-bold mb-2">{t('booking.chooseServices')}</h3>
              <p className="text-sm text-gray-500 mb-6">{t('booking.selectOneOrMoreServices')}</p>
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
                            {t('services.bestValue')}
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
                    <span className="text-sm font-medium text-gray-700">{t('booking.totalDuration')}:</span>
                    <span className="text-sm font-bold">{calculateTotal().totalDuration}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{t('booking.totalPrice')}:</span>
                    <span className="text-lg font-bold">{calculateTotal().totalPrice}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {bookingState.step === 2 && (
            <div>
              <h3 className="text-xl font-bold mb-6">{t('booking.selectBarber')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...barbers, { id: 'any', name: t('booking.anyBarber'), role: t('booking.fastestAvailable'), photoUrl: undefined }].map((barber) => {
                  const showImage = barber.photoUrl && !imageErrors.has(barber.id);
                  
                  return (
                    <button
                      key={barber.id}
                      onClick={() => setBarber(barber.id)}
                      className={`p-4 border rounded-xl text-center transition-all hover:border-black ${
                        bookingState.barber?.id === barber.id ? 'border-black bg-black text-white' : 'border-gray-200'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden ${
                        bookingState.barber?.id === barber.id ? 'bg-white' : 'bg-gray-100'
                      }`}>
                        {showImage ? (
                          <img 
                            src={barber.photoUrl} 
                            alt={barber.name}
                            className="w-full h-full object-cover"
                            onError={() => {
                              setImageErrors(prev => new Set(prev).add(barber.id));
                            }}
                          />
                        ) : (
                          <User className={`w-6 h-6 ${bookingState.barber?.id === barber.id ? 'text-black' : 'text-gray-400'}`} />
                        )}
                      </div>
                      <p className="font-bold">{barber.name}</p>
                      <p className={`text-xs ${bookingState.barber?.id === barber.id ? 'text-gray-400' : 'text-gray-500'}`}>
                        {barber.role}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {bookingState.step === 3 && (
            <div>
              <h3 className="text-xl font-bold mb-2">{t('booking.selectDate')}</h3>
              <p className="text-sm text-gray-500 mb-6">{t('booking.chooseDate')}</p>
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
                      <div className="text-xs text-gray-500 mb-1">{formatWeekday(date)}</div>
                      <div className="font-bold">{date.getDate()}</div>
                      {isToday && <div className="text-[10px] text-gray-400 mt-1">{t('booking.today')}</div>}
                    </button>
                  );
                })}
              </div>
              
              {selectedDate && (
                <div className="mt-6">
                  <h4 className="text-lg font-bold mb-3">{t('booking.availableTimes')}</h4>
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
                      <p className="col-span-full text-sm text-gray-500 text-center py-4">{t('booking.noAvailableTimes')}</p>
                    )}
                  </div>
                  
                  {/* Show loading state while finding available barbers */}
                  {findingBarber && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
                      <p className="text-sm text-blue-900 font-medium">
                        {t('booking.findingBarber')}
                      </p>
                    </div>
                  )}
                  
                  {/* Show multiple available barbers if "Any Barber" was selected, time is chosen, and multiple barbers are available */}
                  {!findingBarber && bookingState.time && bookingState.barber?.id === 'any' && availableBarbersList.length > 1 && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-sm font-bold text-blue-900 mb-3">
                        {t('booking.multipleBarbersAvailable').replace('{count}', availableBarbersList.length.toString())}
                      </p>
                      <p className="text-xs text-blue-700 mb-3">
                        {t('booking.selectBarberFromList')}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {availableBarbersList.map(({ barber }) => {
                          const showImage = barber.photoUrl && !imageErrors.has(barber.id);
                          return (
                            <button
                              key={barber.id}
                              onClick={() => {
                                const selectedBarber = {
                                  id: barber.id,
                                  name: barber.displayName,
                                  role: barber.profile?.role === 'BARBER_WORKER' ? t('booking.barberRole') : t('booking.professionalRole')
                                };
                                setBookingState(prev => ({ ...prev, barber: selectedBarber }));
                                setAvailableBarbersList([]); // Clear the list after selection
                              }}
                              className="p-3 bg-white border-2 border-blue-200 rounded-lg text-left transition-all hover:border-blue-400 hover:shadow-sm"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {showImage ? (
                                    <img 
                                      src={barber.photoUrl} 
                                      alt={barber.displayName}
                                      className="w-full h-full object-cover"
                                      onError={() => {
                                        setImageErrors(prev => new Set(prev).add(barber.id));
                                      }}
                                    />
                                  ) : (
                                    <User className="w-5 h-5 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm text-gray-900 truncate">{barber.displayName}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {barber.profile?.role === 'BARBER_WORKER' ? t('booking.barberRole') : t('booking.professionalRole')}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Show assigned barber info if "Any Barber" was selected, time is chosen, and barber is assigned (single available or user selected from list) */}
                  {!findingBarber && bookingState.time && bookingState.barber && bookingState.barber.id !== 'any' && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-blue-300 flex items-center justify-center overflow-hidden">
                          {(() => {
                            const assignedFullBarber = fullBarbers.find(b => b.id === bookingState.barber?.id);
                            const showImage = assignedFullBarber?.photoUrl && !imageErrors.has(bookingState.barber!.id);
                            return showImage ? (
                              <img 
                                src={assignedFullBarber!.photoUrl!} 
                                alt={assignedFullBarber?.displayName ?? (bookingState.barber && 'name' in bookingState.barber ? bookingState.barber.name : (bookingState.barber as { displayName?: string })?.displayName) ?? ''}
                                className="w-full h-full object-cover"
                                onError={() => {
                                  setImageErrors(prev => new Set(prev).add(bookingState.barber!.id));
                                }}
                              />
                            ) : (
                              <User className="w-5 h-5 text-blue-700" />
                            );
                          })()}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-blue-600 uppercase mb-1">{t('booking.assignedBarber')}</p>
                          <p className="text-base font-bold text-blue-900">{fullBarbers.find(b => b.id === bookingState.barber?.id)?.displayName ?? (bookingState.barber && 'name' in bookingState.barber ? bookingState.barber.name : (bookingState.barber as { displayName?: string })?.displayName)}</p>
                          {bookingState.barber && 'role' in bookingState.barber && bookingState.barber.role && (
                            <p className="text-xs text-blue-700 mt-0.5">{bookingState.barber.role}</p>
                          )}
                          <p className="text-xs text-blue-600 mt-2">
                            {t('booking.assignedBarberInfo')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {bookingState.step === 4 && (
            <div>
              <h3 className="text-xl font-bold mb-6">{t('booking.customerDetails')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('booking.fullName')}</label>
                  <input
                    type="text"
                    id="custName"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                    placeholder={t('booking.name')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('booking.phoneNumber')}</label>
                  <input
                    type="tel"
                    id="custPhone"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                    placeholder={t('booking.phone')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('booking.email')}</label>
                  <input
                    type="email"
                    id="custEmail"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                    placeholder={t('booking.email')}
                  />
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-6">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-3">{t('booking.summary')}</p>
                  
                  {/* Show assigned barber prominently */}
                  {bookingState.barber && bookingState.barber.id !== 'any' && (
                    <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-1">{t('booking.selectBarber')}</p>
                      <p className="text-sm font-bold text-gray-900">{fullBarbers.find(b => b.id === bookingState.barber?.id)?.displayName ?? (bookingState.barber && 'name' in bookingState.barber ? bookingState.barber.name : (bookingState.barber as { displayName?: string })?.displayName)}</p>
                      {bookingState.barber && 'role' in bookingState.barber && bookingState.barber.role && (
                        <p className="text-xs text-gray-500 mt-0.5">{bookingState.barber.role}</p>
                      )}
                    </div>
                  )}
                  
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
                      <span className="text-sm font-medium text-gray-700">{t('booking.total')}:</span>
                      <span className="text-lg font-bold">{calculateTotal().totalPrice}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {bookingState.date} {locale === 'bg' ? 'в' : 'at'} {bookingState.time} • {calculateTotal().totalDuration}
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
              <h3 className="text-3xl font-bold mb-2">{t('booking.bookingConfirmed')}</h3>
              <p className="text-gray-500 mb-8 px-8">
                {t('booking.bookingConfirmationMessage')}
              </p>
              <button
                onClick={closeModal}
                className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-black/90 transition-all"
              >
                {t('booking.gotIt')}
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
              <ChevronLeft className="w-4 h-4" /> {t('booking.back')}
            </button>
            <div>
              {bookingState.step < 4 && (
                <button
                  onClick={nextStep}
                  className="bg-black text-white px-8 py-2 rounded-lg font-bold hover:bg-black/90 transition-colors"
                >
                  {t('booking.continue')}
                </button>
              )}
              {bookingState.step === 4 && (
                <button
                  onClick={confirmBooking}
                  disabled={loading}
                  className="bg-black text-white px-8 py-2 rounded-lg font-bold hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('booking.booking') : t('booking.confirmAppointment')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

