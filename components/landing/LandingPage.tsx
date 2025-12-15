'use client';

import Header from '@/components/shared/Header';
import Hero from './Hero';
import TrustSection from './TrustSection';
import ServicesSection from './ServicesSection';
import LocationSection from './LocationSection';
import Footer from '@/components/shared/Footer';
import BookingModal from '@/components/booking/BookingModal';
import CancellationModal from '@/components/booking/CancellationModal';

export default function LandingPage() {
  return (
    <>
      <Header />
      <Hero />
      <TrustSection />
      <ServicesSection />
      <LocationSection />
      <Footer />
      <BookingModal />
      <CancellationModal />
    </>
  );
}



