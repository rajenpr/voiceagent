import MeshGradient from '@/components/MeshGradient';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import DemoSandbox from '@/components/DemoSandbox';
import FeaturesSection from '@/components/FeaturesSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <MeshGradient />
      <Navigation />
      <HeroSection />
      <DemoSandbox />
      <FeaturesSection />
      <Footer />
    </main>
  );
}
