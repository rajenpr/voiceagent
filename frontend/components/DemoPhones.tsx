'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface DemoPhone {
  industry: string;
  businessName: string;
  phoneNumber: string;
  description: string;
  icon: string;
  accentColor: string;
}

// These will be populated after running setup_demo_sessions.py
// Update these values with your actual demo phone numbers
const DEMO_PHONES: DemoPhone[] = [
  {
    industry: 'Healthcare',
    businessName: 'Smile Dental Demo',
    phoneNumber: '+1-415-XXX-XXXX',  // Replace after setup
    description: 'Experience AI-powered dental appointment booking',
    icon: '🦷',
    accentColor: '#0066FF',
  },
  {
    industry: 'Legal Services',
    businessName: 'Justice Law Firm Demo',
    phoneNumber: '+1-213-XXX-XXXX',  // Replace after setup
    description: 'See AI handle legal intake and consultation booking',
    icon: '⚖️',
    accentColor: '#7C3AED',
  },
  {
    industry: 'Real Estate',
    businessName: 'Premier Realty Demo',
    phoneNumber: '+1-212-XXX-XXXX',  // Replace after setup
    description: 'Experience AI qualifying real estate leads',
    icon: '🏠',
    accentColor: '#059669',
  },
];

export default function DemoPhones() {
  const handleCallClick = (phoneNumber: string, businessName: string) => {
    // Track demo call attempts (you can integrate with analytics)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'demo_call_attempt', {
        business_name: businessName,
        phone_number: phoneNumber,
      });
    }
  };

  return (
    <section className="relative py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-[#0A2540] mb-6">
            Try it yourself
          </h2>
          <p className="text-xl text-[#425466] max-w-2xl mx-auto">
            Call any of our live demo numbers below. Experience real AI conversations
            tailored to different industries. No signup required.
          </p>
        </motion.div>

        {/* Demo Phone Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {DEMO_PHONES.map((demo, index) => (
            <motion.div
              key={demo.industry}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-[#635BFF] hover:shadow-xl transition-all duration-300">
                {/* Icon */}
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl mb-6"
                  style={{ backgroundColor: `${demo.accentColor}15` }}
                >
                  {demo.icon}
                </div>

                {/* Industry */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: `${demo.accentColor}15`,
                      color: demo.accentColor
                    }}
                  >
                    {demo.industry}
                  </span>
                </div>

                {/* Business Name */}
                <h3 className="text-xl font-bold text-[#0A2540] mb-3">
                  {demo.businessName}
                </h3>

                {/* Description */}
                <p className="text-[#8898AA] mb-6 min-h-[48px]">
                  {demo.description}
                </p>

                {/* Phone Number - Large, Clickable */}
                <a
                  href={`tel:${demo.phoneNumber.replace(/[^0-9+]/g, '')}`}
                  onClick={() => handleCallClick(demo.phoneNumber, demo.businessName)}
                  className="block"
                >
                  <div
                    className="relative overflow-hidden rounded-xl p-6 group-hover:scale-[1.02] transition-transform duration-300"
                    style={{ backgroundColor: `${demo.accentColor}` }}
                  >
                    {/* Call Icon */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/80 text-sm font-medium">
                        📞 Call now
                      </span>
                      <svg
                        className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    {/* Phone Number */}
                    <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                      {demo.phoneNumber}
                    </div>

                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </a>

                {/* Mobile-friendly tap indicator */}
                <p className="text-xs text-[#8898AA] text-center mt-3">
                  Tap to call • Free demo • No signup needed
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-4 border border-gray-200 shadow-sm">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[#425466] font-medium">
              All demo lines are live and ready 24/7
            </span>
          </div>
        </motion.div>

        {/* What to Expect */}
        <div className="mt-16 bg-white rounded-2xl border border-gray-200 p-8 md:p-12">
          <h3 className="text-2xl font-bold text-[#0A2540] mb-6 text-center">
            What to expect when you call
          </h3>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#635BFF]/10 rounded-lg flex items-center justify-center text-[#635BFF] font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-[#0A2540] mb-1">Natural greeting</h4>
                  <p className="text-[#8898AA] text-sm">
                    AI answers instantly with a warm, professional welcome tailored to the business
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#635BFF]/10 rounded-lg flex items-center justify-center text-[#635BFF] font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-[#0A2540] mb-1">Ask your questions</h4>
                  <p className="text-[#8898AA] text-sm">
                    Inquire about services, pricing, availability - just like talking to a human receptionist
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#635BFF]/10 rounded-lg flex items-center justify-center text-[#635BFF] font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-[#0A2540] mb-1">Book an appointment</h4>
                  <p className="text-[#8898AA] text-sm">
                    Provide your details and preferred time - AI handles it like a real booking system
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#635BFF]/10 rounded-lg flex items-center justify-center text-[#635BFF] font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-[#0A2540] mb-1">Experience interruption handling</h4>
                  <p className="text-[#8898AA] text-sm">
                    Try interrupting mid-sentence - AI adapts naturally like human conversation
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#635BFF]/10 rounded-lg flex items-center justify-center text-[#635BFF] font-bold">
                  5
                </div>
                <div>
                  <h4 className="font-semibold text-[#0A2540] mb-1">Test edge cases</h4>
                  <p className="text-[#8898AA] text-sm">
                    Ask off-topic questions, stay silent, or speak over - see how AI recovers
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#635BFF]/10 rounded-lg flex items-center justify-center text-[#635BFF] font-bold">
                  6
                </div>
                <div>
                  <h4 className="font-semibold text-[#0A2540] mb-1">Get the reveal</h4>
                  <p className="text-[#8898AA] text-sm">
                    At the end, AI reveals this was a demo and invites you to get started
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Note */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-[#8898AA] text-sm">
              💡 <span className="font-semibold">Pro tip:</span> Have a real use case in mind?
              Call the demo closest to your industry and imagine it&apos;s your business.
              Notice how customizable the conversations are.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
