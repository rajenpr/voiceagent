'use client';

import { motion } from 'framer-motion';

export default function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden">
      {/* Hero Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto"
      >
        <div className="max-w-4xl">
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-8">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-[#425466]">
              <span className="w-2 h-2 bg-[#635BFF] rounded-full mr-2 animate-pulse"></span>
              Powered by Pipecat.ai & WebRTC
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            variants={itemVariants}
            className="text-7xl md:text-8xl lg:text-[112px] font-bold text-[#0A2540] mb-8 leading-[1.05] tracking-tight"
          >
            Voice AI for modern{' '}
            <span className="text-[#635BFF]">businesses</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-[#425466] max-w-2xl mb-10 leading-relaxed"
          >
            Handle customer calls with intelligent AI agents. Book appointments, qualify leads, and provide support with sub-800ms latency.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-wrap gap-4 mb-16">
            <a
              href="#demo"
              className="inline-flex items-center px-6 py-3 bg-[#635BFF] hover:bg-[#7A73FF] text-white rounded-md font-medium text-base transition-all shadow-sm hover:shadow-md"
            >
              Start now
              <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
            <a
              href="#"
              className="inline-flex items-center px-6 py-3 border border-gray-300 hover:border-gray-400 bg-white text-[#0A2540] rounded-md font-medium text-base transition-all"
            >
              Contact sales
              <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div variants={itemVariants} className="pt-8 border-t border-gray-200">
            <p className="text-sm text-[#8898AA] mb-4 uppercase tracking-wider font-medium">
              Trusted by leading businesses
            </p>
            <div className="flex flex-wrap items-center gap-8">
              {['Medical Clinics', 'Legal Firms', 'Home Services', 'Real Estate'].map((industry, index) => (
                <div
                  key={index}
                  className="text-[#425466] font-medium text-sm px-4 py-2 bg-gray-50 rounded-md"
                >
                  {industry}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Section - Stripe style */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-7xl mx-auto mt-32"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <motion.div variants={itemVariants} className="text-center md:text-left">
            <div className="text-5xl font-bold text-[#0A2540] mb-3">&lt;800ms</div>
            <p className="text-lg text-[#425466]">Average response time for natural conversations</p>
          </motion.div>
          <motion.div variants={itemVariants} className="text-center md:text-left">
            <div className="text-5xl font-bold text-[#0A2540] mb-3">24/7</div>
            <p className="text-lg text-[#425466]">Always-on availability for your customers</p>
          </motion.div>
          <motion.div variants={itemVariants} className="text-center md:text-left">
            <div className="text-5xl font-bold text-[#0A2540] mb-3">99.9%</div>
            <p className="text-lg text-[#425466]">Uptime SLA with enterprise reliability</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Feature Cards - Clean Stripe Style */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-7xl mx-auto mt-32"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              ),
              title: 'Ultra-low latency',
              description: 'Sub-800ms response times with WebRTC and streaming TTS for natural phone conversations.',
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              ),
              title: 'Custom knowledge base',
              description: 'Upload your business documents and train AI on your specific services and pricing.',
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              ),
              title: 'Industry-agnostic',
              description: 'Works for any business—from plumbers to medical clinics to legal firms.',
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group p-8 rounded-xl border border-gray-200 hover:border-[#635BFF] transition-all bg-white hover:shadow-lg"
            >
              <div className="w-12 h-12 rounded-lg bg-[#F6F9FC] group-hover:bg-[#635BFF]/10 flex items-center justify-center mb-6 transition-colors">
                <svg className="w-6 h-6 text-[#635BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {feature.icon}
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#0A2540] mb-3">{feature.title}</h3>
              <p className="text-[#425466] leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
