'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled ? 'bg-white/80 backdrop-blur-md border-b border-gray-200/50' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            whileHover={{ opacity: 0.8 }}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <div className="flex items-center">
              <svg className="w-8 h-8 text-stripe-purple" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
              </svg>
              <span className="ml-2 text-xl font-semibold text-[#0A2540]">VoiceAI</span>
            </div>
          </motion.div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {[
              { name: 'Products', href: '#features' },
              { name: 'Solutions', href: '#demo' },
              { name: 'Developers', href: '#' },
              { name: 'Resources', href: '#' },
              { name: 'Pricing', href: '#pricing' }
            ].map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="px-4 py-2 text-[#425466] hover:text-[#0A2540] transition-colors text-[15px] font-medium rounded-md hover:bg-gray-50"
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-4">
            <button className="hidden sm:block px-4 py-2 text-[#425466] hover:text-[#0A2540] transition-colors text-[15px] font-medium">
              Sign in
            </button>
            <button className="px-5 py-2.5 bg-[#635BFF] hover:bg-[#7A73FF] text-white rounded-md font-medium text-[15px] transition-all shadow-sm hover:shadow-md">
              Get started →
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
