import type { Appointment, Slot, Barber, Shop, Profile, AuditLog, Service, BarberSchedule, BarberShopAssignment } from './types';

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
    name: 'Alexander Petrov',
    displayName: 'Alex Master',
    role: 'Master Barber',
    status: 'Active',
    email: 'alex@barberking.com',
    phone: '+359 888 123 456',
    dateOfBirth: '1990-05-15',
    hireDate: '2018-03-01',
    experience: 6,
    specializations: ['haircuts', 'beard', 'styling', 'coloring'],
    certifications: ['Master Barber License', 'Color Specialist'],
    emergencyContact: {
      name: 'Maria Petrov',
      phone: '+359 888 654 321',
      relationship: 'Wife'
    },
    notes: 'Specializes in modern cuts and beard designs',
    rating: 4.9,
    totalAppointments: 1250
  },
  {
    id: 'b2',
    name: 'Martin Dimitrov',
    displayName: 'Martin Senior',
    role: 'Senior Barber',
    status: 'Active',
    email: 'martin@barberking.com',
    phone: '+359 888 234 567',
    dateOfBirth: '1992-08-22',
    hireDate: '2020-01-15',
    experience: 4,
    specializations: ['haircuts', 'beard', 'shaves'],
    certifications: ['Professional Barber License'],
    emergencyContact: {
      name: 'Ivan Dimitrov',
      phone: '+359 888 765 432',
      relationship: 'Brother'
    },
    notes: 'Excellent with traditional cuts',
    rating: 4.7,
    totalAppointments: 890
  },
  {
    id: 'b3',
    name: 'Georgi Kostov',
    displayName: 'George Style',
    role: 'Stylist',
    status: 'On Leave',
    email: 'george@barberking.com',
    phone: '+359 888 345 678',
    dateOfBirth: '1995-12-03',
    hireDate: '2021-06-01',
    experience: 3,
    specializations: ['haircuts', 'styling', 'coloring'],
    certifications: ['Hair Stylist License', 'Color Technician'],
    emergencyContact: {
      name: 'Elena Kostova',
      phone: '+359 888 876 543',
      relationship: 'Mother'
    },
    notes: 'Specializes in creative styling and coloring',
    rating: 4.8,
    totalAppointments: 650
  }
];

export const mockBarberSchedules: BarberSchedule[] = [
  {
    id: 'sch1',
    barberId: 'b1',
    shopId: 's1',
    date: '2024-12-15',
    slots: [
      { id: 'slot1', startTime: '09:00', endTime: '12:00', type: 'AVAILABLE' },
      { id: 'slot2', startTime: '12:00', endTime: '13:00', type: 'BREAK' },
      { id: 'slot3', startTime: '13:00', endTime: '18:00', type: 'AVAILABLE' }
    ]
  },
  {
    id: 'sch2',
    barberId: 'b2',
    shopId: 's1',
    date: '2024-12-15',
    slots: [
      { id: 'slot4', startTime: '10:00', endTime: '14:00', type: 'AVAILABLE' },
      { id: 'slot5', startTime: '14:00', endTime: '15:00', type: 'BREAK' },
      { id: 'slot6', startTime: '15:00', endTime: '19:00', type: 'AVAILABLE' }
    ]
  },
  {
    id: 'sch3',
    barberId: 'b3',
    shopId: 's2',
    date: '2024-12-15',
    slots: [
      { id: 'slot7', startTime: '09:00', endTime: '13:00', type: 'AVAILABLE' },
      { id: 'slot8', startTime: '13:00', endTime: '14:00', type: 'BREAK' },
      { id: 'slot9', startTime: '14:00', endTime: '18:00', type: 'AVAILABLE' }
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



