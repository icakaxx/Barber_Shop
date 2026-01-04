export type Role = 'USER' | 'BARBER_WORKER' | 'BARBER_OWNER' | 'SUPER_ADMIN';

export type AppointmentStatus = 'CONFIRMED' | 'PENDING' | 'DONE' | 'CANCELLED';

export type SlotType = 'AVAILABLE' | 'BREAK';

export interface Service {
  id: string;
  name: string;
  duration: string;
  price: string;
  priceBgn?: number; // Optional: numeric price in BGN for currency conversion
  best?: boolean;
}

export interface Barber {
  id: string;
  profileId: string; // References profiles table
  shopId: string; // References shops table
  displayName: string;
  bio?: string;
  photoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Additional data from joined tables
  profile?: {
    fullName?: string;
    phone?: string;
    role: Role;
  };
  shop?: {
    name: string;
    city: string;
    address?: string;
  };
}

export interface TimeSlot {
  id: string;
  barberId: string;
  startTime: string; // ISO timestamp
  endTime: string; // ISO timestamp
  type: 'AVAILABLE' | 'BREAK';
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BarberSchedule {
  barberId: string;
  date: string; // YYYY-MM-DD
  slots: TimeSlot[];
}

export interface Appointment {
  id: number;
  time: string;
  service: string;
  customer: string;
  phone: string;
  status: AppointmentStatus;
  barber: string;
  shop: string;
  cancelReason?: string;
}

export interface Slot {
  id: number;
  time: string;
  type: SlotType;
}

export interface Shop {
  id: string;
  name: string;
  city: string;
  owner: string;
  status?: 'Active' | 'Inactive';
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuditLog {
  id: number;
  time: string;
  actor: string;
  action: string;
  target: string;
  details: string;
}

export interface BookingState {
  step: number;
  services: Service[]; // Changed to array for multiple selections
  barber: Barber | { id: string; name: string; role: string } | null;
  date: string | null;
  time: string | null;
  details: {
    name: string;
    phone: string;
    email: string;
  };
}



