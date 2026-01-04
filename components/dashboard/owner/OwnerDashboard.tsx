'use client';

import { useState, useEffect } from 'react';
import { Building2, Calendar, Users, Plus, Edit2, Trash2, X, Scissors } from 'lucide-react';
import { getStatusBadge } from '@/lib/utils';
import EditAppointmentModal from '@/components/dashboard/barber/EditAppointmentModal';
import CreateAppointmentModal from '@/components/dashboard/barber/CreateAppointmentModal';
import ServicesManagementTab from './ServicesManagementTab';
import BarbersTab from './BarbersTab';
import type { Barber } from '@/lib/types';

interface Shop {
  id: string;
  name: string;
  city: string;
  address?: string;
}

interface Appointment {
  id: string;
  barberId: string;
  barberName: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  shopId: string;
  shopName: string;
}

export default function OwnerDashboard() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>('all');
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'appointments' | 'services' | 'barbers'>('appointments');
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [barberAppointments, setBarberAppointments] = useState<Appointment[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'appointments'>('name');
  const [barberViewDate, setBarberViewDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const loadShops = async () => {
      try {
        // Get shops owned by the current user
        // In production, this would use the authenticated user's ID
        const response = await fetch('/api/shops?owner=true');
        if (response.ok) {
          const data = await response.json();
          setShops(data);
          if (data.length > 0) {
            setSelectedShopId(data[0].id);
          }
        } else if (response.status === 404) {
          // API endpoint might not exist yet, try alternative
          const allShopsResponse = await fetch('/api/shops');
          if (allShopsResponse.ok) {
            const allShops = await allShopsResponse.json();
            setShops(allShops);
            if (allShops.length > 0) {
              setSelectedShopId(allShops[0].id);
            }
          }
        }
      } catch (error) {
        console.error('Error loading shops:', error);
      }
    };

    loadShops();
  }, []);

  useEffect(() => {
    const loadBarbers = async () => {
      if (selectedShopId === 'all') {
        // Load all barbers from all shops
        try {
          const response = await fetch('/api/barbers');
          if (response.ok) {
            const data = await response.json();
            // Filter barbers that belong to owner's shops
            const shopIds = shops.map(s => s.id);
            const filteredBarbers = data.filter((b: Barber) => shopIds.includes(b.shopId));
            setBarbers(filteredBarbers);
          }
        } catch (error) {
          console.error('Error loading barbers:', error);
        }
      } else {
        // Load barbers for selected shop
        try {
          const response = await fetch('/api/barbers');
          if (response.ok) {
            const data = await response.json();
            const shopBarbers = data.filter((b: Barber) => b.shopId === selectedShopId);
            setBarbers(shopBarbers);
          }
        } catch (error) {
          console.error('Error loading barbers:', error);
        }
      }
    };

    if (shops.length > 0) {
      loadBarbers();
    }
  }, [selectedShopId, shops]);

  useEffect(() => {
    const loadAppointments = async () => {
      if (shops.length === 0) {
        setLoading(false);
        return;
      }

      try {
        let allAppointments: Appointment[] = [];

        if (selectedShopId === 'all') {
          // Load appointments from all shops
          for (const shop of shops) {
            const response = await fetch(`/api/appointments?shopId=${shop.id}&date=${selectedDate}`);
            if (response.ok) {
              const data = await response.json();
              allAppointments = [...allAppointments, ...data];
            }
          }
        } else {
          // Load appointments for selected shop
          const response = await fetch(`/api/appointments?shopId=${selectedShopId}&date=${selectedDate}`);
          if (response.ok) {
            const data = await response.json();
            allAppointments = data;
          }
        }

        // Sort by start time
        allAppointments.sort((a, b) => 
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
        setAppointments(allAppointments);
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [selectedShopId, selectedDate, shops]);

  // Load appointments for barber view when barber is selected
  useEffect(() => {
    const loadBarberAppointments = async () => {
      if (!selectedBarberId || currentTab !== 'barbers') {
        setBarberAppointments([]);
        return;
      }

      try {
        const response = await fetch(`/api/barbers/${selectedBarberId}/appointments?date=${barberViewDate}`);
        if (response.ok) {
          const data = await response.json();
          // Map the response to match Appointment interface
          const mappedAppointments: Appointment[] = data.map((apt: any) => ({
            id: apt.id,
            barberId: apt.barberId,
            barberName: barbers.find(b => b.id === apt.barberId)?.displayName || 'Unknown',
            serviceName: apt.serviceName,
            customerName: apt.customerName,
            customerPhone: apt.customerPhone,
            customerEmail: apt.customerEmail,
            startTime: apt.startTime,
            endTime: apt.endTime,
            status: apt.status,
            notes: apt.notes,
            shopId: apt.shopId,
            shopName: apt.shopName
          }));
          setBarberAppointments(mappedAppointments);
        }
      } catch (error) {
        console.error('Error loading barber appointments:', error);
      }
    };

    loadBarberAppointments();
  }, [selectedBarberId, barberViewDate, currentTab, barbers]);

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const parseServicesFromNotes = (notes: string | undefined): string[] => {
    if (!notes) return [];
    const match = notes.match(/Additional services:\s*(.+?)(?:\n|$)/i);
    if (match && match[1]) {
      return match[1].split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
    return [];
  };

  const getAllServices = (app: Appointment): string[] => {
    const services = [app.serviceName];
    const additionalServices = parseServicesFromNotes(app.notes);
    return [...services, ...additionalServices];
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsEditModalOpen(true);
  };

  const handleSave = async (updatedAppointment: Appointment) => {
    try {
      const response = await fetch(`/api/appointments/${updatedAppointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: updatedAppointment.customerName,
          customerPhone: updatedAppointment.customerPhone,
          customerEmail: updatedAppointment.customerEmail,
          startTime: new Date(updatedAppointment.startTime).toISOString(),
          endTime: new Date(updatedAppointment.endTime).toISOString(),
          status: updatedAppointment.status,
          notes: updatedAppointment.notes
        })
      });

      if (response.ok) {
        // Reload appointments
        let allAppointments: Appointment[] = [];
        if (selectedShopId === 'all') {
          for (const shop of shops) {
            const reloadResponse = await fetch(`/api/appointments?shopId=${shop.id}&date=${selectedDate}`);
            if (reloadResponse.ok) {
              const data = await reloadResponse.json();
              allAppointments = [...allAppointments, ...data];
            }
          }
          allAppointments.sort((a, b) => 
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );
          setAppointments(allAppointments);
        } else {
          const reloadResponse = await fetch(`/api/appointments?shopId=${selectedShopId}&date=${selectedDate}`);
          if (reloadResponse.ok) {
            const data = await reloadResponse.json();
            setAppointments(data);
          }
        }
        setIsEditModalOpen(false);
        setEditingAppointment(null);
      } else {
        const error = await response.json();
        alert(`Failed to update appointment: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment');
    }
  };

  const handleCreate = async (appointmentData: any) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      });

      if (response.ok) {
        // Reload appointments
        let allAppointments: Appointment[] = [];
        if (selectedShopId === 'all') {
          for (const shop of shops) {
            const reloadResponse = await fetch(`/api/appointments?shopId=${shop.id}&date=${selectedDate}`);
            if (reloadResponse.ok) {
              const data = await reloadResponse.json();
              allAppointments = [...allAppointments, ...data];
            }
          }
          allAppointments.sort((a, b) => 
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );
          setAppointments(allAppointments);
        } else {
          const reloadResponse = await fetch(`/api/appointments?shopId=${selectedShopId}&date=${selectedDate}`);
          if (reloadResponse.ok) {
            const data = await reloadResponse.json();
            setAppointments(data);
          }
        }
        setIsCreateModalOpen(false);
      } else {
        const error = await response.json();
        alert(`Failed to create appointment: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Failed to create appointment');
    }
  };

  const handleDelete = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel/delete this appointment?')) return;

    setDeletingId(appointmentId);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        // Reload appointments
        let allAppointments: Appointment[] = [];
        if (selectedShopId === 'all') {
          for (const shop of shops) {
            const reloadResponse = await fetch(`/api/appointments?shopId=${shop.id}&date=${selectedDate}`);
            if (reloadResponse.ok) {
              const data = await reloadResponse.json();
              allAppointments = [...allAppointments, ...data];
            }
          }
          allAppointments.sort((a, b) => 
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );
          setAppointments(allAppointments);
        } else {
          const reloadResponse = await fetch(`/api/appointments?shopId=${selectedShopId}&date=${selectedDate}`);
          if (reloadResponse.ok) {
            const data = await reloadResponse.json();
            setAppointments(data);
          }
        }
        
        // Reload barber appointments if viewing barber tab
        if (selectedBarberId && currentTab === 'barbers') {
          const barberResponse = await fetch(`/api/barbers/${selectedBarberId}/appointments?date=${barberViewDate}`);
          if (barberResponse.ok) {
            const barberData = await barberResponse.json();
            const barber = barbers.find(b => b.id === selectedBarberId);
            const mappedAppointments: Appointment[] = barberData.map((apt: any) => ({
              id: apt.id,
              barberId: apt.barberId,
              barberName: barber?.displayName || 'Unknown',
              serviceName: apt.serviceName,
              customerName: apt.customerName,
              customerPhone: apt.customerPhone,
              customerEmail: apt.customerEmail,
              startTime: apt.startTime,
              endTime: apt.endTime,
              status: apt.status,
              notes: apt.notes,
              shopId: apt.shopId,
              shopName: apt.shopName
            }));
            setBarberAppointments(mappedAppointments);
          }
        }
      } else {
        const error = await response.json();
        alert(`Failed to delete appointment: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Failed to delete appointment');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-500">Loading owner dashboard...</p>
        </div>
      </div>
    );
  }

  const activeBarbers = barbers.filter(b => b.isActive);
  const selectedShop = shops.find(s => s.id === selectedShopId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-black p-3 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Owner Dashboard</h1>
              <p className="text-gray-500">Manage all appointments across your shops</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop
              </label>
              <select
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              >
                <option value="all">All Shops</option>
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name} {shop.city ? `- ${shop.city}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              />
            </div>
            <div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-black text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-black/90 transition-all"
                disabled={activeBarbers.length === 0}
              >
                <Plus className="w-4 h-4" /> New Appointment
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Shops</span>
            </div>
            <p className="text-2xl font-bold">{shops.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Active Workers</span>
            </div>
            <p className="text-2xl font-bold">{activeBarbers.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Appointments Today</span>
            </div>
            <p className="text-2xl font-bold">{appointments.length}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setCurrentTab('appointments')}
              className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
                currentTab === 'appointments'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Appointments
            </button>
            <button
              onClick={() => {
                setCurrentTab('barbers');
                setSelectedBarberId(null);
              }}
              className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
                currentTab === 'barbers'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Barbers
            </button>
            <button
              onClick={() => setCurrentTab('services')}
              className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
                currentTab === 'services'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Scissors className="w-4 h-4" />
              Services
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {currentTab === 'appointments' && (
          <>
            {/* Appointments List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold">
                  Appointments {selectedShopId !== 'all' && `- ${selectedShop?.name}`}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(selectedDate).toLocaleDateString('en-GB', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>

          <div className="p-6">
            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-bold text-lg mb-2">No Appointments</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  No appointments found for the selected date and shop.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {appointments.map((app) => (
                  <div
                    key={app.id}
                    className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="bg-white p-3 rounded-lg text-center min-w-[100px]">
                        <p className="text-xs font-bold text-gray-500 uppercase">Time</p>
                        <p className="font-bold">{formatTime(app.startTime)}</p>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-lg">{app.customerName}</h3>
                          {getStatusBadge(app.status)}
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">
                            {app.barberName}
                          </span>
                          {selectedShopId === 'all' && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-bold">
                              {app.shopName}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 flex items-start gap-1 mb-1">
                          <Scissors className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <div>
                            {getAllServices(app).map((service, index) => (
                              <span key={index}>
                                {service}
                                {index < getAllServices(app).length - 1 && ', '}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-400">{app.customerPhone}</p>
                        {app.notes && !app.notes.match(/Additional services:/i) && (
                          <p className="text-sm text-gray-500 mt-2 italic">Note: {app.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(app)}
                        className="px-4 py-2 border border-gray-200 text-sm font-bold rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(app.id)}
                        disabled={deletingId === app.id}
                        className="px-4 py-2 border border-red-200 text-red-600 text-sm font-bold rounded-lg hover:bg-red-50 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" /> {deletingId === app.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
          </>
        )}

        {currentTab === 'barbers' && (
          <BarbersTab
            barbers={activeBarbers}
            appointments={appointments}
            barberAppointments={barberAppointments}
            selectedBarberId={selectedBarberId}
            onBarberSelect={setSelectedBarberId}
            barberViewDate={barberViewDate}
            onDateChange={setBarberViewDate}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onEditAppointment={handleEdit}
            onDeleteAppointment={handleDelete}
            deletingId={deletingId}
          />
        )}

        {currentTab === 'services' && selectedShopId !== 'all' && selectedShopId && (
          <ServicesManagementTab shopId={selectedShopId} />
        )}

        {currentTab === 'services' && selectedShopId === 'all' && (
          <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Scissors className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-bold text-lg mb-2">Select a Shop</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Please select a specific shop from the dropdown above to manage its services.
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <EditAppointmentModal
        appointment={editingAppointment}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingAppointment(null);
        }}
        onSave={handleSave}
      />

      <CreateAppointmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreate}
        shopId={selectedShopId === 'all' ? shops[0]?.id : selectedShopId}
        barbers={activeBarbers}
      />
    </div>
  );
}

