'use client';

import { MapPin, Clock, Phone, Navigation } from 'lucide-react';

export default function LocationSection() {
  return (
    <section id="location" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">Find Us</h2>
          <div className="mt-2 w-20 h-1 bg-black mx-auto" />
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 overflow-hidden rounded-2xl shadow-lg h-[450px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2932.453392477!2d23.31976!3d42.697708!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40aa856e7e13d961%3A0x67396657962130e5!2sSofia%20Center%2C%20Sofia!5e0!3m2!1sen!2sbg!4v1700000000000"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="flex flex-col space-y-8 order-1 md:order-2">
            <div>
              <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <MapPin className="w-6 h-6" /> Visit Us
              </h3>
              <p className="text-xl text-gray-600">Sofia, ul. Example 12, 1000 Center</p>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <Clock className="w-6 h-6" /> Working Hours
              </h3>
              <p className="text-xl text-gray-600">Mon–Sat: 09:00 – 19:00</p>
              <p className="text-lg text-gray-400">Sunday: Closed</p>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <Phone className="w-6 h-6" /> Contact
              </h3>
              <a
                href="tel:+359888123456"
                className="text-xl text-gray-600 hover:text-black transition-colors font-medium"
              >
                +359 888 123 456
              </a>
            </div>

            <div className="pt-4">
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md bg-white border border-gray-200 px-8 py-3 text-lg font-semibold text-black shadow-sm hover:bg-gray-50 transition-all gap-2"
              >
                <Navigation className="w-5 h-5" />
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



