import MeshGradient from '@/components/MeshGradient';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import DemoSandbox from '@/components/DemoSandbox';
import FeaturesSection from '@/components/FeaturesSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <MeshGradient />
      <Navigation />
      <HeroSection />
      <DemoSandbox />
      <FeaturesSection />
      <Footer />
    </main>
  );
}
