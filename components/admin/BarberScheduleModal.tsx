'use client';

import { useState } from 'react';
import { X, Plus, Edit, Trash2, Clock, CheckCircle, Coffee } from 'lucide-react';
import type { Barber, BarberSchedule, ScheduleSlot } from '@/lib/types';

interface BarberScheduleModalProps {
  barber: Barber;
  schedule: BarberSchedule | undefined;
  onClose: () => void;
}

export default function BarberScheduleModal({ barber, schedule, onClose }: BarberScheduleModalProps) {
  const [slots, setSlots] = useState<ScheduleSlot[]>(schedule?.slots || []);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);
  const [newSlot, setNewSlot] = useState({
    startTime: '',
    endTime: '',
    type: 'AVAILABLE' as ScheduleSlot['type'],
    notes: ''
  });

  const handleAddSlot = () => {
    if (newSlot.startTime && newSlot.endTime) {
      const slot: ScheduleSlot = {
        id: `slot${Date.now()}`,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        type: newSlot.type,
        notes: newSlot.notes || undefined
      };
      setSlots([...slots, slot]);
      setNewSlot({ startTime: '', endTime: '', type: 'AVAILABLE', notes: '' });
      setShowAddSlot(false);
    }
  };

  const handleEditSlot = (slot: ScheduleSlot) => {
    setEditingSlot(slot);
    setNewSlot({
      startTime: slot.startTime,
      endTime: slot.endTime,
      type: slot.type,
      notes: slot.notes || ''
    });
  };

  const handleUpdateSlot = () => {
    if (editingSlot && newSlot.startTime && newSlot.endTime) {
      setSlots(slots.map(slot =>
        slot.id === editingSlot.id
          ? { ...slot, ...newSlot, notes: newSlot.notes || undefined }
          : slot
      ));
      setEditingSlot(null);
      setNewSlot({ startTime: '', endTime: '', type: 'AVAILABLE', notes: '' });
    }
  };

  const handleDeleteSlot = (slotId: string) => {
    setSlots(slots.filter(slot => slot.id !== slotId));
  };

  const getSlotIcon = (type: ScheduleSlot['type']) => {
    switch (type) {
      case 'AVAILABLE':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'BREAK':
        return <Coffee className="w-5 h-5 text-orange-600" />;
      case 'APPOINTMENT':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSlotColor = (type: ScheduleSlot['type']) => {
    switch (type) {
      case 'AVAILABLE':
        return 'bg-green-50 border-green-200';
      case 'BREAK':
        return 'bg-orange-50 border-orange-200';
      case 'APPOINTMENT':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const sortedSlots = [...slots].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Schedule: {barber.displayName || barber.name}</h2>
            <p className="text-sm text-gray-500">Today - {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Barber Info */}
          <div className="bg-gray-50 p-4 rounded-xl mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg">
                {(barber.displayName || barber.name).charAt(0)}
              </div>
              <div>
                <p className="font-bold">{barber.displayName || barber.name}</p>
                <p className="text-sm text-gray-600">{barber.role} • {barber.status}</p>
              </div>
            </div>
          </div>

          {/* Add/Edit Slot Form */}
          {(showAddSlot || editingSlot) && (
            <div className="bg-gray-50 p-4 rounded-xl mb-6">
              <h3 className="font-bold mb-4">
                {editingSlot ? 'Edit Slot' : 'Add New Slot'}
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
                <select
                  value={newSlot.type}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, type: e.target.value as ScheduleSlot['type'] }))}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="BREAK">Break</option>
                  <option value="UNAVAILABLE">Unavailable</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={newSlot.notes}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  placeholder="e.g. Lunch break, meeting"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowAddSlot(false);
                    setEditingSlot(null);
                    setNewSlot({ startTime: '', endTime: '', type: 'AVAILABLE', notes: '' });
                  }}
                  className="px-4 py-2 text-sm font-bold border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={editingSlot ? handleUpdateSlot : handleAddSlot}
                  className="px-4 py-2 text-sm font-bold bg-black text-white rounded-lg hover:bg-black/90"
                >
                  {editingSlot ? 'Update' : 'Add'} Slot
                </button>
              </div>
            </div>
          )}

          {/* Schedule Slots */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Today&apos;s Schedule</h3>
              <button
                onClick={() => setShowAddSlot(true)}
                className="flex items-center gap-2 px-3 py-1 bg-black text-white text-sm rounded-lg hover:bg-black/90"
              >
                <Plus className="w-4 h-4" /> Add Slot
              </button>
            </div>

            {sortedSlots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No schedule set for today
              </div>
            ) : (
              sortedSlots.map((slot) => (
                <div
                  key={slot.id}
                  className={`p-4 border rounded-xl ${getSlotColor(slot.type)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getSlotIcon(slot.type)}
                      <div>
                        <p className="font-bold">
                          {slot.startTime} - {slot.endTime}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">
                          {slot.type.toLowerCase()}
                          {slot.notes && ` • ${slot.notes}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditSlot(slot)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit Slot"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete Slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-bold border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <button
              className="px-6 py-2 text-sm font-bold bg-black text-white rounded-lg hover:bg-black/90"
            >
              Save Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
