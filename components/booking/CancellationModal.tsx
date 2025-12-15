'use client';

import { useState } from 'react';

export default function CancellationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');

  const closeModal = () => {
    setIsOpen(false);
    setReason('');
  };

  const submitCancellation = () => {
    if (reason.length < 5) {
      alert('Please provide a valid reason (min 5 characters).');
      return;
    }
    // Handle cancellation logic here
    closeModal();
  };

  return (
    <div id="cancelModal" className={`fixed inset-0 z-[110] ${isOpen ? '' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        <h3 className="text-xl font-bold mb-4">Cancel Appointment</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for cancellation</label>
            <textarea
              id="cancelReason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              placeholder="e.g. Barber is unwell, Shop emergency..."
            />
            <p className="text-xs text-gray-400 mt-1">Minimum 5 characters required.</p>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={closeModal}
              className="flex-1 py-2 text-sm font-bold border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Keep Appointment
            </button>
            <button
              onClick={submitCancellation}
              className="flex-1 py-2 text-sm font-bold bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Cancel Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



