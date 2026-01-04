export type Locale = 'bg' | 'en';
export type Currency = 'BGN' | 'EUR';

export const translations = {
  bg: {
    // Common
    common: {
      loading: 'Зареждане...',
      cancel: 'Отказ',
      save: 'Запази',
      delete: 'Изтрий',
      edit: 'Редактирай',
      close: 'Затвори',
      back: 'Назад',
      next: 'Напред',
      confirm: 'Потвърди',
      yes: 'Да',
      no: 'Не',
      search: 'Търсене',
      filter: 'Филтър',
      all: 'Всички',
    },
    // Navigation
    nav: {
      home: 'Начало',
      services: 'Услуги',
      about: 'За нас',
      contact: 'Контакт',
      bookNow: 'Резервирай сега',
      dashboard: 'Табло',
      barberDashboard: 'Табло на бръснаря',
      ownerDashboard: 'Табло на собственика',
      adminDashboard: 'Админ табло',
    },
    // Hero
    hero: {
      title: 'Barber King',
      subtitle: 'Професионални прически и поддръжка на брада',
      cta: 'Резервирай час',
      location: 'София, България',
    },
    // Services
    services: {
      title: 'Нашите услуги',
      subtitle: 'Открийте нашия пълен спектър от услуги',
      duration: 'Продължителност',
      price: 'Цена',
      min: 'мин',
    },
    // Booking
    booking: {
      title: 'Резервирай час',
      selectServices: 'Избери услуги',
      selectBarber: 'Избери бръснар',
      selectDate: 'Избери дата',
      selectTime: 'Избери час',
      customerDetails: 'Вашите данни',
      name: 'Име',
      phone: 'Телефон',
      email: 'Имейл',
      total: 'Общо',
      confirmBooking: 'Потвърди резервацията',
      bookingConfirmed: 'Резервацията е потвърдена!',
      anyBarber: 'Всеки бръснар',
      availableTimes: 'Налични часове',
      noAvailableTimes: 'Няма налични часове за тази дата',
      selectAtLeastOneService: 'Моля, изберете поне една услуга',
      fillAllFields: 'Моля, попълнете всички полета',
    },
    // Appointments
    appointments: {
      title: 'Резервации',
      todayAppointments: 'Днешни резервации',
      noAppointments: 'Няма резервации',
      customer: 'Клиент',
      time: 'Час',
      status: 'Статус',
      services: 'Услуги',
      pending: 'Изчакваща',
      confirmed: 'Потвърдена',
      done: 'Завършена',
      cancelled: 'Отменена',
      markDone: 'Маркирай като завършена',
      cancel: 'Отмени',
    },
    // Dashboard
    dashboard: {
      barber: {
        todaySchedule: 'Днешен график',
        calendarView: 'Календарен изглед',
        manageAvailability: 'Управление на наличност',
        teamView: 'Преглед на екипа',
      },
      owner: {
        appointments: 'Резервации',
        barbers: 'Бръснари',
        services: 'Услуги',
        shops: 'Магазини',
      },
    },
    // Status
    status: {
      active: 'Активен',
      inactive: 'Неактивен',
    },
  },
  en: {
    // Common
    common: {
      loading: 'Loading...',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      search: 'Search',
      filter: 'Filter',
      all: 'All',
    },
    // Navigation
    nav: {
      home: 'Home',
      services: 'Services',
      about: 'About',
      contact: 'Contact',
      bookNow: 'Book Now',
      dashboard: 'Dashboard',
      barberDashboard: 'Barber Dashboard',
      ownerDashboard: 'Owner Dashboard',
      adminDashboard: 'Admin Dashboard',
    },
    // Hero
    hero: {
      title: 'Barber King',
      subtitle: 'Professional Haircuts & Beard Trims',
      cta: 'Book Appointment',
      location: 'Sofia, Bulgaria',
    },
    // Services
    services: {
      title: 'Our Services',
      subtitle: 'Discover our full range of services',
      duration: 'Duration',
      price: 'Price',
      min: 'min',
    },
    // Booking
    booking: {
      title: 'Book Appointment',
      selectServices: 'Select Services',
      selectBarber: 'Select Barber',
      selectDate: 'Select Date',
      selectTime: 'Select Time',
      customerDetails: 'Your Details',
      name: 'Name',
      phone: 'Phone',
      email: 'Email',
      total: 'Total',
      confirmBooking: 'Confirm Booking',
      bookingConfirmed: 'Booking Confirmed!',
      anyBarber: 'Any Barber',
      availableTimes: 'Available Times',
      noAvailableTimes: 'No available times for this date',
      selectAtLeastOneService: 'Please select at least one service',
      fillAllFields: 'Please fill in all fields',
    },
    // Appointments
    appointments: {
      title: 'Appointments',
      todayAppointments: 'Today\'s Appointments',
      noAppointments: 'No appointments',
      customer: 'Customer',
      time: 'Time',
      status: 'Status',
      services: 'Services',
      pending: 'Pending',
      confirmed: 'Confirmed',
      done: 'Done',
      cancelled: 'Cancelled',
      markDone: 'Mark as Done',
      cancel: 'Cancel',
    },
    // Dashboard
    dashboard: {
      barber: {
        todaySchedule: 'Today\'s Schedule',
        calendarView: 'Calendar View',
        manageAvailability: 'Manage Availability',
        teamView: 'Team View',
      },
      owner: {
        appointments: 'Appointments',
        barbers: 'Barbers',
        services: 'Services',
        shops: 'Shops',
      },
    },
    // Status
    status: {
      active: 'Active',
      inactive: 'Inactive',
    },
  },
};

// Currency conversion (1 EUR = 1.96 BGN, approximate rate)
const EUR_TO_BGN_RATE = 1.96;

export function convertCurrency(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount;
  if (from === 'EUR' && to === 'BGN') {
    return Math.round(amount * EUR_TO_BGN_RATE * 100) / 100;
  }
  if (from === 'BGN' && to === 'EUR') {
    return Math.round((amount / EUR_TO_BGN_RATE) * 100) / 100;
  }
  return amount;
}

export function formatPrice(amount: number, currency: Currency, locale: Locale = 'bg'): string {
  const formattedAmount = amount.toFixed(2);
  if (currency === 'BGN') {
    return `${formattedAmount} лв`;
  }
  return `€${formattedAmount}`;
}

export function formatPriceWithConversion(
  amountBgn: number,
  currency: Currency,
  locale: Locale = 'bg'
): string {
  if (currency === 'BGN') {
    return formatPrice(amountBgn, 'BGN', locale);
  }
  const amountEur = convertCurrency(amountBgn, 'BGN', 'EUR');
  return formatPrice(amountEur, 'EUR', locale);
}
