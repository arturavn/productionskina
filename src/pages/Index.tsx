
import React from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import InstitutionalSection from '@/components/InstitutionalSection';
import FeaturedProducts from '@/components/FeaturedProducts';
import CategoriesSection from '@/components/CategoriesSection';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';


const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <FeaturedProducts />
        <CategoriesSection />
        <InstitutionalSection />

      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
