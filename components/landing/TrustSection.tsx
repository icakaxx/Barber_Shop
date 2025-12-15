'use client';

import { Scissors, Sparkles, Calendar, Package } from 'lucide-react';

export default function TrustSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Why Choose Us</h2>
          <div className="mt-2 w-20 h-1 bg-black mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="w-12 h-12 mx-auto bg-black text-white flex items-center justify-center rounded-lg mb-6">
              <Scissors className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Professional Barbers</h3>
            <p className="text-gray-500 leading-relaxed">Years of experience, attention to detail in every cut.</p>
          </div>

          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="w-12 h-12 mx-auto bg-black text-white flex items-center justify-center rounded-lg mb-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Clean & Modern</h3>
            <p className="text-gray-500 leading-relaxed">Relaxing atmosphere with the highest hygiene standards.</p>
          </div>

          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="w-12 h-12 mx-auto bg-black text-white flex items-center justify-center rounded-lg mb-6">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Online Booking</h3>
            <p className="text-gray-500 leading-relaxed">Schedule in seconds from your phone, no waiting in line.</p>
          </div>

          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="w-12 h-12 mx-auto bg-black text-white flex items-center justify-center rounded-lg mb-6">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Premium Products</h3>
            <p className="text-gray-500 leading-relaxed">We use only the best products for your hair and beard.</p>
          </div>
        </div>
      </div>
    </section>
  );
}



