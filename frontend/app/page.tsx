import MeshGradient from '@/components/MeshGradient';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import DemoPhones from '@/components/DemoPhones';
import FeaturesSection from '@/components/FeaturesSection';
import PricingSection from '@/components/PricingSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <MeshGradient />
      <Navigation />
      <HeroSection />
      <DemoPhones />
      <FeaturesSection />
      <PricingSection />
      <Footer />
    </main>
  );
}
