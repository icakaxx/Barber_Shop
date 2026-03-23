'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Scissors } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  durationMin: number;
  priceBgn: number;
  sortOrder: number;
  isActive: boolean;
}

interface ServicesManagementTabProps {
  shopId: string;
}

export default function ServicesManagementTab({ shopId }: ServicesManagementTabProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    durationMin: 30,
    priceBgn: 0,
    sortOrder: 0,
    isActive: true
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadServices();
  }, [shopId]);

  const loadServices = async () => {
    try {
      const response = await fetch(`/api/services?shopId=${shopId}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        durationMin: service.durationMin,
        priceBgn: service.priceBgn,
        sortOrder: service.sortOrder,
        isActive: service.isActive
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        durationMin: 30,
        priceBgn: 0,
        sortOrder: services.length,
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
    setFormData({
      name: '',
      durationMin: 30,
      priceBgn: 0,
      sortOrder: 0,
      isActive: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingService 
        ? `/api/services/${editingService.id}`
        : '/api/services';
      
      const method = editingService ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          shopId: shopId
        })
      });

      if (response.ok) {
        await loadServices();
        handleCloseModal();
      } else {
        const error = await response.json();
        alert(`Failed to ${editingService ? 'update' : 'create'} service: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Failed to save service');
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to deactivate this service? It will no longer be available for booking.')) {
      return;
    }

    setDeletingId(serviceId);
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await loadServices();
      } else {
        const error = await response.json();
        alert(`Failed to delete service: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-500">Loading services...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Services Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage services offered at your shop</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-black/90 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {services.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Scissors className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-bold text-lg">No Services</h3>
          <p className="text-gray-500 max-w-sm mt-2">
            Add your first service to start accepting bookings.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{service.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {service.durationMin} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {service.priceBgn} лв
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {service.sortOrder}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        service.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(service)}
                          className="text-gray-600 hover:text-black transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          disabled={deletingId === service.id}
                          className="text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  required
                  placeholder="e.g., Haircut, Beard Trim"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="480"
                    value={formData.durationMin || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, durationMin: value === '' ? 0 : parseInt(value) || 0 });
                    }}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (лв) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.priceBgn || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, priceBgn: value === '' ? 0 : parseFloat(value) || 0 });
                    }}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.sortOrder || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, sortOrder: value === '' ? 0 : parseInt(value) || 0 });
                  }}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  placeholder="Lower numbers appear first"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active (available for booking)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 border border-gray-200 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-black text-white rounded-lg font-bold hover:bg-black/90 transition-colors"
                >
                  {editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

