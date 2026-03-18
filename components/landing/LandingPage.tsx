'use client';

import { ShopBrandingProvider, useShopBranding } from '@/contexts/ShopBrandingContext';
import Header from '@/components/shared/Header';
import Hero from './Hero';
import BarberCards from './BarberCards';
import TrustSection from './TrustSection';
import ServicesSection from './ServicesSection';
import LocationSection from './LocationSection';
import Footer from '@/components/shared/Footer';
import BookingModal from '@/components/booking/BookingModal';
import CancellationModal from '@/components/booking/CancellationModal';
import LoadingScreen from '@/components/shared/LoadingScreen';

function LandingPageContent() {
  const { isLoading } = useShopBranding();

  if (isLoading) {
    return <LoadingScreen />;
  }

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

export default function LandingPage() {
  return (
    <ShopBrandingProvider>
      <LandingPageContent />
    </ShopBrandingProvider>
  );
}



