'use client';

import Link from 'next/link';
import { Instagram, Facebook, Twitter, Scissors, ShieldCheck, Crown } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-3xl font-bold mb-4">Barber King</h3>
            <p className="text-gray-400 max-w-xs">
              Premium cuts and classic style for the modern man. Experience the difference of a professional barber shop.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6 uppercase tracking-wider text-gray-400">Quick Links</h4>
            <ul className="space-y-4">
              <li><Link href="/" className="hover:text-gray-300 transition-colors">Home</Link></li>
              <li><a href="#services" className="hover:text-gray-300 transition-colors">Services</a></li>
              <li><a href="#location" className="hover:text-gray-300 transition-colors">Location</a></li>
              <li><Link href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6 uppercase tracking-wider text-gray-400">Follow Us</h4>
            <div className="flex items-center gap-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
            <div className="mt-8">
              <p className="text-sm text-gray-500">Subscribe to our newsletter for style tips and exclusive offers.</p>
              <form className="mt-4 flex gap-2">
                <input
                  type="email"
                  placeholder="Email address"
                  className="bg-white/10 border border-white/20 rounded px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white w-full"
                />
                <button
                  type="submit"
                  className="bg-white text-black px-4 py-2 rounded text-sm font-bold hover:bg-gray-200 transition-colors"
                >
                  Join
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 text-center text-sm text-gray-500 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} Barber King. All rights reserved.</p>
          <div className="flex gap-4">
            <Link
              href="/dashboard/barber"
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <Scissors className="w-4 h-4" /> Barber View
            </Link>
            <Link
              href="/admin"
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <Crown className="w-4 h-4" /> Barber Management
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}



