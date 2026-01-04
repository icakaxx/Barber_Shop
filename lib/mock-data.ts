import type { Appointment, Slot, Barber, Shop, Profile, AuditLog, Service, BarberSchedule } from './types';

interface BarberShopAssignment {
  id: string;
  barberId: string;
  shopId: string;
  isPrimary: boolean;
  assignedAt: string;
  assignedBy: string;
}

export const mockServices: Service[] = [
  { id: 's1', name: 'Haircut', duration: '30 min', price: '25 лв' },
  { id: 's2', name: 'Beard shaping / Beard trim', duration: '20 min', price: '15 лв' },
  { id: 's3', name: 'Eyebrow grooming / Eyebrow shaping', duration: '5 min', price: '10 лв' },
  { id: 's4', name: 'Ear cleaning', duration: '5 min', price: '8 лв' },
  { id: 's5', name: 'Nose hair removal / Nose grooming', duration: '5 min', price: '8 лв' }
];

export const mockBarbers: Barber[] = [
  {
    id: 'b1',
    profileId: 'p1',
    shopId: 's1',
    displayName: 'Alex Master',
    bio: 'Specializes in modern cuts and beard designs',
    photoUrl: '',
    isActive: true,
    createdAt: '2018-03-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
    profile: {
      fullName: 'Alexander Petrov',
      role: 'BARBER_WORKER'
    },
    shop: {
      name: 'Sofia Center',
      city: 'Sofia'
    }
  },
  {
    id: 'b2',
    profileId: 'p2',
    shopId: 's1',
    displayName: 'Martin Senior',
    bio: 'Excellent with traditional cuts',
    photoUrl: '',
    isActive: true,
    createdAt: '2020-01-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
    profile: {
      fullName: 'Martin Dimitrov',
      role: 'BARBER_WORKER'
    },
    shop: {
      name: 'Sofia Center',
      city: 'Sofia'
    }
  },
  {
    id: 'b3',
    profileId: 'p3',
    shopId: 's2',
    displayName: 'George Style',
    bio: 'Specializes in creative styling and coloring',
    photoUrl: '',
    isActive: false,
    createdAt: '2021-06-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
    profile: {
      fullName: 'Georgi Kostov',
      role: 'BARBER_WORKER'
    },
    shop: {
      name: 'Plovdiv Old Town',
      city: 'Plovdiv'
    }
  }
];

export const mockBarberSchedules: BarberSchedule[] = [
  {
    barberId: 'b1',
    date: '2024-12-15',
    slots: [
      { id: 'slot1', barberId: 'b1', startTime: '2024-12-15T09:00:00Z', endTime: '2024-12-15T12:00:00Z', type: 'AVAILABLE', isAvailable: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'slot2', barberId: 'b1', startTime: '2024-12-15T12:00:00Z', endTime: '2024-12-15T13:00:00Z', type: 'BREAK', isAvailable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'slot3', barberId: 'b1', startTime: '2024-12-15T13:00:00Z', endTime: '2024-12-15T18:00:00Z', type: 'AVAILABLE', isAvailable: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ]
  },
  {
    barberId: 'b2',
    date: '2024-12-15',
    slots: [
      { id: 'slot4', barberId: 'b2', startTime: '2024-12-15T10:00:00Z', endTime: '2024-12-15T14:00:00Z', type: 'AVAILABLE', isAvailable: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'slot5', barberId: 'b2', startTime: '2024-12-15T14:00:00Z', endTime: '2024-12-15T15:00:00Z', type: 'BREAK', isAvailable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'slot6', barberId: 'b2', startTime: '2024-12-15T15:00:00Z', endTime: '2024-12-15T19:00:00Z', type: 'AVAILABLE', isAvailable: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ]
  },
  {
    barberId: 'b3',
    date: '2024-12-15',
    slots: [
      { id: 'slot7', barberId: 'b3', startTime: '2024-12-15T09:00:00Z', endTime: '2024-12-15T13:00:00Z', type: 'AVAILABLE', isAvailable: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'slot8', barberId: 'b3', startTime: '2024-12-15T13:00:00Z', endTime: '2024-12-15T14:00:00Z', type: 'BREAK', isAvailable: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'slot9', barberId: 'b3', startTime: '2024-12-15T14:00:00Z', endTime: '2024-12-15T18:00:00Z', type: 'AVAILABLE', isAvailable: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ]
  }
];

export const mockBarberShopAssignments: BarberShopAssignment[] = [
  {
    id: 'assign1',
    barberId: 'b1',
    shopId: 's1',
    isPrimary: true,
    assignedAt: '2024-01-01T00:00:00Z',
    assignedBy: 'admin'
  },
  {
    id: 'assign2',
    barberId: 'b2',
    shopId: 's1',
    isPrimary: true,
    assignedAt: '2024-01-01T00:00:00Z',
    assignedBy: 'admin'
  },
  {
    id: 'assign3',
    barberId: 'b3',
    shopId: 's2',
    isPrimary: true,
    assignedAt: '2024-01-01T00:00:00Z',
    assignedBy: 'admin'
  }
];

export const mockAppointments: Appointment[] = [
  { id: 1, time: '09:00 - 09:30', service: 'Haircut', customer: 'Ivan Ivanov', phone: '+359 888 111 222', status: 'CONFIRMED', barber: 'Alex', shop: 'Sofia Center' },
  { id: 2, time: '10:00 - 10:50', service: 'Hair + Beard', customer: 'Stefan Draganov', phone: '+359 888 333 444', status: 'PENDING', barber: 'Martin', shop: 'Sofia Center' },
  { id: 3, time: '11:00 - 11:30', service: 'Kids Cut', customer: 'Leo (Child)', phone: '+359 888 555 666', status: 'CONFIRMED', barber: 'George', shop: 'Plovdiv Old Town' },
  { id: 4, time: '13:30 - 14:00', service: 'Beard Trim', customer: 'Dimitar Bonev', phone: '+359 888 777 888', status: 'CONFIRMED', barber: 'Alex', shop: 'Sofia Center' },
  { id: 5, time: '14:30 - 15:00', service: 'Haircut', customer: 'Yavor Kolev', phone: '+359 888 999 000', status: 'CANCELLED', barber: 'Martin', shop: 'Sofia Center', cancelReason: 'Customer sick' },
];

export const mockSlots: Slot[] = [
  { id: 101, time: '09:00 - 12:00', type: 'AVAILABLE' },
  { id: 102, time: '12:00 - 13:00', type: 'BREAK' },
  { id: 103, time: '13:00 - 18:00', type: 'AVAILABLE' },
];

export const mockShops: Shop[] = [
  { id: 's1', name: 'Sofia Center', city: 'Sofia', owner: 'Admin King', status: 'Active' },
  { id: 's2', name: 'Plovdiv Old Town', city: 'Plovdiv', owner: 'Marta P.', status: 'Active' },
  { id: 's3', name: 'Varna Beach', city: 'Varna', owner: 'None', status: 'Inactive' },
];

export const mockProfiles: Profile[] = [
  { id: 'u1', name: 'Admin King', email: 'admin@barberking.com', role: 'BARBER_OWNER' },
  { id: 'u2', name: 'Alex Master', email: 'alex@barberking.com', role: 'BARBER_WORKER' },
  { id: 'u3', name: 'Marta P.', email: 'marta@example.com', role: 'BARBER_OWNER' },
  { id: 'u4', name: 'Stefan D.', email: 'stefan@example.com', role: 'USER' },
  { id: 'u5', name: 'Global Root', email: 'root@barberking.com', role: 'SUPER_ADMIN' },
];

export const mockAuditLogs: AuditLog[] = [
  { id: 501, time: '2024-05-24 10:15', actor: 'Global Root', action: 'ROLE_UPDATE', target: 'Stefan D.', details: 'USER -> BARBER_WORKER' },
  { id: 502, time: '2024-05-24 09:45', actor: 'Global Root', action: 'SHOP_CREATE', target: 'Varna Beach', details: 'New shop initialized' },
  { id: 503, time: '2024-05-23 18:20', actor: 'Admin King', action: 'APPOINTMENT_CANCEL', target: 'Ivan Ivanov', details: 'Barber emergency' },
];



