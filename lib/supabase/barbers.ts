import { supabase, supabaseServer } from './client'
import type { Barber, TimeSlot, BarberSchedule } from '../types'

// Get all barbers with profile and shop information
// Uses API route to avoid RLS issues
export async function getBarbers(): Promise<Barber[]> {
  try {
    const response = await fetch('/api/barbers')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching barbers:', error)
    return getMockBarbers()
  }
}

// Get barber by ID
export async function getBarberById(id: string): Promise<Barber | null> {
  const all = await getBarbers()
  return all.find(b => b.id === id) ?? null
}

// Create new barber - uses API route to bypass RLS
export async function createBarber(barberData: {
  displayName: string
  bio?: string
  photoUrl?: string
  isActive?: boolean
}): Promise<Barber | null> {
  try {
    const response = await fetch('/api/barbers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(barberData),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Error creating barber:', error)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error in createBarber:', error)
    return null
  }
}

// Update barber - uses API route to bypass RLS
export async function updateBarber(
  id: string,
  barberData: {
    displayName?: string
    bio?: string
    photoUrl?: string
    isActive?: boolean
  },
): Promise<Barber | null> {
  try {
    const response = await fetch(`/api/barbers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(barberData),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Error updating barber:', error)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error in updateBarber:', error)
    return null
  }
}

// Delete barber (soft delete by setting inactive) - uses API route
export async function deleteBarber(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/barbers/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Error deleting barber:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteBarber:', error)
    return false
  }
}

// Get barber schedule for a specific date
export async function getBarberSchedule(barberId: string, date: string): Promise<BarberSchedule | null> {
  const client = typeof window !== 'undefined' ? supabase : supabaseServer
  
  if (!client) {
    return getMockSchedule(barberId, date)
  }
  
  try {
    const startOfDay = new Date(`${date}T00:00:00Z`);
    const endOfDay = new Date(`${date}T23:59:59Z`);

    const { data, error } = await client
      .from('time_slots')
      .select('*')
      .eq('barber_id', barberId)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .order('start_time')

    if (error) {
      console.error('Error fetching barber schedule:', error)
      return getMockSchedule(barberId, date);
    }

    return {
      barberId,
      date,
      slots: data.map(slot => ({
        id: slot.id,
        barberId: slot.barber_id,
        startTime: slot.start_time,
        endTime: slot.end_time,
        type: slot.type,
        isAvailable: slot.is_available,
        createdAt: slot.created_at,
        updatedAt: slot.updated_at
      }))
    }
  } catch (error) {
    console.error('Error in getBarberSchedule:', error)
    return getMockSchedule(barberId, date);
  }
}

// Helper function for mock schedule
function getMockSchedule(barberId: string, date: string): BarberSchedule {
  const today = new Date().toISOString().split('T')[0];
  if (date === today) {
    return {
      barberId,
      date,
      slots: [
        {
          id: 'slot1',
          barberId,
          startTime: `${date}T09:00:00Z`,
          endTime: `${date}T12:00:00Z`,
          type: 'AVAILABLE',
          isAvailable: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'slot2',
          barberId,
          startTime: `${date}T12:00:00Z`,
          endTime: `${date}T13:00:00Z`,
          type: 'BREAK',
          isAvailable: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'slot3',
          barberId,
          startTime: `${date}T13:00:00Z`,
          endTime: `${date}T18:00:00Z`,
          type: 'AVAILABLE',
          isAvailable: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    };
  }
  return { barberId, date, slots: [] };
}

// Fallback mock data for testing
function getMockBarbers(): Barber[] {
  return [
    {
      id: 'b1',
      profileId: 'p1',
      shopId: 's1',
      displayName: 'Alex Master',
      bio: 'Specializes in modern cuts and beard designs',
      photoUrl: undefined,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      profile: {
        fullName: 'Alexander Petrov',
        phone: '+359 888 123 456',
        role: 'BARBER_WORKER'
      },
      shop: {
        name: 'Sofia Center',
        city: 'Sofia',
        address: 'ul. Example 12'
      }
    },
    {
      id: 'b2',
      profileId: 'p2',
      shopId: 's1',
      displayName: 'Martin Senior',
      bio: 'Excellent with traditional cuts',
      photoUrl: undefined,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      profile: {
        fullName: 'Martin Dimitrov',
        phone: '+359 888 234 567',
        role: 'BARBER_WORKER'
      },
      shop: {
        name: 'Sofia Center',
        city: 'Sofia',
        address: 'ul. Example 12'
      }
    },
    {
      id: 'b3',
      profileId: 'p3',
      shopId: 's2',
      displayName: 'George Style',
      bio: 'Specializes in creative styling and coloring',
      photoUrl: undefined,
      isActive: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      profile: {
        fullName: 'Georgi Kostov',
        phone: '+359 888 345 678',
        role: 'BARBER_WORKER'
      },
      shop: {
        name: 'Plovdiv Old Town',
        city: 'Plovdiv',
        address: 'ul. Old Town 45'
      }
    }
  ]
}
