// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      barbers: {
        Row: {
          id: string
          name: string
          display_name: string | null
          role: 'Master Barber' | 'Senior Barber' | 'Stylist' | 'Apprentice'
          status: 'Active' | 'Inactive' | 'On Leave'
          email: string
          phone: string | null
          date_of_birth: string | null
          hire_date: string | null
          experience: number | null
          specializations: string[] | null
          certifications: string[] | null
          emergency_contact: {
            name: string
            phone: string
            relationship: string
          } | null
          notes: string | null
          avatar_url: string | null
          rating: number | null
          total_appointments: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name?: string | null
          role: 'Master Barber' | 'Senior Barber' | 'Stylist' | 'Apprentice'
          status?: 'Active' | 'Inactive' | 'On Leave'
          email: string
          phone?: string | null
          date_of_birth?: string | null
          hire_date?: string | null
          experience?: number | null
          specializations?: string[] | null
          certifications?: string[] | null
          emergency_contact?: {
            name: string
            phone: string
            relationship: string
          } | null
          notes?: string | null
          avatar_url?: string | null
          rating?: number | null
          total_appointments?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string | null
          role?: 'Master Barber' | 'Senior Barber' | 'Stylist' | 'Apprentice'
          status?: 'Active' | 'Inactive' | 'On Leave'
          email?: string
          phone?: string | null
          date_of_birth?: string | null
          hire_date?: string | null
          experience?: number | null
          specializations?: string[] | null
          certifications?: string[] | null
          emergency_contact?: {
            name: string
            phone: string
            relationship: string
          } | null
          notes?: string | null
          avatar_url?: string | null
          rating?: number | null
          total_appointments?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      barber_schedules: {
        Row: {
          id: string
          barber_id: string
          shop_id: string
          schedule_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barber_id: string
          shop_id: string
          schedule_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barber_id?: string
          shop_id?: string
          schedule_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      schedule_slots: {
        Row: {
          id: string
          schedule_id: string
          start_time: string
          end_time: string
          type: 'AVAILABLE' | 'BREAK' | 'UNAVAILABLE' | 'APPOINTMENT'
          appointment_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          schedule_id: string
          start_time: string
          end_time: string
          type: 'AVAILABLE' | 'BREAK' | 'UNAVAILABLE' | 'APPOINTMENT'
          appointment_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          schedule_id?: string
          start_time?: string
          end_time?: string
          type?: 'AVAILABLE' | 'BREAK' | 'UNAVAILABLE' | 'APPOINTMENT'
          appointment_id?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      barber_shop_assignments: {
        Row: {
          id: string
          barber_id: string
          shop_id: string
          is_primary: boolean
          assigned_at: string
          assigned_by: string
        }
        Insert: {
          id?: string
          barber_id: string
          shop_id: string
          is_primary?: boolean
          assigned_at?: string
          assigned_by: string
        }
        Update: {
          id?: string
          barber_id?: string
          shop_id?: string
          is_primary?: boolean
          assigned_at?: string
          assigned_by?: string
        }
      }
      shops: {
        Row: {
          id: string
          name: string
          city: string
          address: string | null
          phone: string | null
          owner_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          city: string
          address?: string | null
          phone?: string | null
          owner_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          city?: string
          address?: string | null
          phone?: string | null
          owner_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          customer_name: string
          customer_phone: string
          customer_email: string | null
          barber_id: string
          service_id: string
          shop_id: string
          appointment_date: string
          start_time: string
          end_time: string
          status: 'CONFIRMED' | 'PENDING' | 'DONE' | 'CANCELLED'
          notes: string | null
          cancel_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_name: string
          customer_phone: string
          customer_email?: string | null
          barber_id: string
          service_id: string
          shop_id: string
          appointment_date: string
          start_time: string
          end_time: string
          status?: 'CONFIRMED' | 'PENDING' | 'DONE' | 'CANCELLED'
          notes?: string | null
          cancel_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_name?: string
          customer_phone?: string
          customer_email?: string | null
          barber_id?: string
          service_id?: string
          shop_id?: string
          appointment_date?: string
          start_time?: string
          end_time?: string
          status?: 'CONFIRMED' | 'PENDING' | 'DONE' | 'CANCELLED'
          notes?: string | null
          cancel_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
