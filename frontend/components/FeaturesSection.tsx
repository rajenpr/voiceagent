'use client';

import { motion } from 'framer-motion';

export default function FeaturesSection() {
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Lightning Fast Responses',
      description: 'WebRTC transport with streaming TTS ensures sub-800ms latency for natural conversations',
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Smart Lead Qualification',
      description: 'AI-powered questions that identify high-value prospects and route them appropriately',
      gradient: 'from-stripe-purple to-purple-600',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Automated Booking',
      description: 'Seamlessly integrate with calendars to schedule appointments without human intervention',
      gradient: 'from-stripe-lightBlue to-blue-600',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      title: 'Custom Knowledge Base',
      description: 'Upload your service docs, pricing, and FAQs for accurate, business-specific responses',
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Industry Agnostic',
      description: 'Works across plumbing, medical, legal, real estate, and any service-based industry',
      gradient: 'from-pink-500 to-rose-600',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Real-Time Analytics',
      description: 'Track call metrics, conversion rates, and customer satisfaction in a unified dashboard',
      gradient: 'from-indigo-500 to-purple-600',
    },
  ];

  const useCases = [
    {
      industry: 'Plumbing',
      example: 'Customer calls about a burst pipe. AI assesses urgency, checks technician availability, and books emergency service within 2 minutes.',
      icon: '🔧',
    },
    {
      industry: 'Medical Clinic',
      example: 'Patient needs an annual checkup. AI verifies insurance, finds available slots with preferred doctor, and sends confirmation SMS.',
      icon: '🏥',
    },
    {
      industry: 'Legal Firm',
      example: 'Potential client inquires about estate planning. AI qualifies lead, explains services, and schedules free consultation with attorney.',
      icon: '⚖️',
    },
    {
      industry: 'HVAC',
      example: 'Homeowner reports AC not cooling. AI troubleshoots common issues, determines need for on-site visit, and dispatches nearest technician.',
      icon: '❄️',
    },
  ];

  return (
    <section id="features" className="relative py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Built for{' '}
            <span className="bg-gradient-to-r from-stripe-purple to-stripe-lightBlue bg-clip-text text-transparent">
              Performance
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Enterprise-grade voice AI infrastructure designed for reliability, speed, and scalability
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all"
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 text-white`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Use Cases Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Real-World{' '}
            <span className="bg-gradient-to-r from-stripe-purple to-stripe-lightBlue bg-clip-text text-transparent">
              Use Cases
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            See how businesses across industries are transforming customer interactions
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-xl"
            >
              <div className="flex items-start space-x-4">
                <div className="text-5xl">{useCase.icon}</div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">{useCase.industry}</h3>
                  <p className="text-gray-300 leading-relaxed">{useCase.example}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
