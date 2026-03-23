export type ProfileRole = 'USER' | 'BARBER_WORKER' | 'BARBER_OWNER' | 'SUPER_ADMIN';

export interface AuthContext {
  userId: string;
  email: string | undefined;
  role: ProfileRole;
  fullName: string | null;
}

export const STAFF_ROLES: ProfileRole[] = ['BARBER_WORKER', 'BARBER_OWNER', 'SUPER_ADMIN'];

export const OWNER_OR_ADMIN: ProfileRole[] = ['BARBER_OWNER', 'SUPER_ADMIN'];
