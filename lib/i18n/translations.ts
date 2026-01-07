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
        title: 'Табло на собственика',
        subtitle: 'Управление на всички резервации по магазините',
        shop: 'Магазин',
        allShops: 'Всички магазини',
        date: 'Дата',
        newAppointment: 'Нова резервация',
        shopsCount: 'Магазини',
        activeWorkers: 'Активни работници',
        appointmentsToday: 'Резервации днес',
        selectShop: 'Избери магазин',
        selectShopMessage: 'Моля, изберете конкретен магазин от падащото меню по-горе, за да управлявате неговите услуги.',
      },
      admin: {
        title: 'Super Admin Panel',
        globalAdmin: 'Глобален админ',
        systemRoot: 'Системен корен',
        barbers: 'Бръснари',
        appointments: 'Резервации',
        services: 'Услуги',
        selectShop: 'Избери магазин за управление на услуги',
        selectShopPlaceholder: '-- Избери магазин --',
        selectShopMessage: 'Моля, изберете магазин за управление на услуги.',
      },
    },
    // Admin
    admin: {
      barberManagement: 'Управление на бръснари',
      appointmentsManagement: 'Управление на резервации',
      addBarber: 'Добави бръснар',
      barber: 'Бръснар',
      role: 'Роля',
      shop: 'Магазин',
      status: 'Статус',
      actions: 'Действия',
      viewSchedule: 'Преглед на график',
      editBarber: 'Редактирай бръснар',
      deleteBarber: 'Изтрий бръснар',
      loadingBarbers: 'Зареждане на бръснари...',
      deleteBarberConfirm: 'Сигурни ли сте, че искате да изтриете този бръснар? Това ще го направи неактивен.',
      failedDeleteBarber: 'Неуспешно изтриване на бръснар',
      failedUpdateBarber: 'Неуспешно обновяване на бръснар',
      failedCreateBarber: 'Неуспешно създаване на бръснар',
      failedSaveBarber: 'Грешка при запазване на бръснар',
      filters: 'Филтри',
      allBarbers: 'Всички бръснари',
      allStatuses: 'Всички статуси',
      clearFilters: 'Изчисти филтри',
      loadingAppointments: 'Зареждане на резервации...',
      noAppointmentsFound: 'Няма намерени резервации',
      tryAdjustingFilters: 'Опитайте да промените филтрите',
      time: 'Час',
      service: 'Услуга',
      cancelled: 'Отменена',
      note: 'Бележка',
      markDone: 'Маркирай като завършена',
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
        title: 'Owner Dashboard',
        subtitle: 'Manage all appointments across your shops',
        shop: 'Shop',
        allShops: 'All Shops',
        date: 'Date',
        newAppointment: 'New Appointment',
        shopsCount: 'Shops',
        activeWorkers: 'Active Workers',
        appointmentsToday: 'Appointments Today',
        selectShop: 'Select a Shop',
        selectShopMessage: 'Please select a specific shop from the dropdown above to manage its services.',
      },
      admin: {
        title: 'Super Admin Panel',
        globalAdmin: 'Global Admin',
        systemRoot: 'System Root',
        barbers: 'Barbers',
        appointments: 'Appointments',
        services: 'Services',
        selectShop: 'Select Shop to Manage Services',
        selectShopPlaceholder: '-- Select a shop --',
        selectShopMessage: 'Please select a shop to manage services.',
      },
    },
    // Admin
    admin: {
      barberManagement: 'Barber Management',
      appointmentsManagement: 'Appointments Management',
      addBarber: 'Add Barber',
      barber: 'Barber',
      role: 'Role',
      shop: 'Shop',
      status: 'Status',
      actions: 'Actions',
      viewSchedule: 'View Schedule',
      editBarber: 'Edit Barber',
      deleteBarber: 'Delete Barber',
      loadingBarbers: 'Loading barbers...',
      deleteBarberConfirm: 'Are you sure you want to delete this barber? This will set them as inactive.',
      failedDeleteBarber: 'Failed to delete barber',
      failedUpdateBarber: 'Failed to update barber',
      failedCreateBarber: 'Failed to create barber',
      failedSaveBarber: 'Error saving barber',
      filters: 'Filters',
      allBarbers: 'All Barbers',
      allStatuses: 'All Statuses',
      clearFilters: 'Clear Filters',
      loadingAppointments: 'Loading appointments...',
      noAppointmentsFound: 'No appointments found',
      tryAdjustingFilters: 'Try adjusting your filters',
      time: 'Time',
      service: 'Service',
      cancelled: 'Cancelled',
      note: 'Note',
      markDone: 'Mark Done',
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
