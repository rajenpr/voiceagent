'use client';

import { motion } from 'framer-motion';

export default function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto"
      >
        {/* Main Hero Content */}
        <div className="text-center mb-16">
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-block px-4 py-2 bg-stripe-purple/20 border border-stripe-purple/30 rounded-full text-stripe-lightBlue text-sm font-semibold mb-6">
              Powered by Pipecat.ai & WebRTC
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight"
          >
            Never miss a{' '}
            <span className="bg-gradient-to-r from-stripe-purple via-stripe-gradient2 to-stripe-lightBlue bg-clip-text text-transparent">
              service call
            </span>
            {' '}again
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8"
          >
            Industry-agnostic voice AI that handles lead qualification, appointment booking,
            and complex troubleshooting with &lt;800ms latency
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-gradient-to-r from-stripe-purple to-stripe-lightBlue text-white rounded-lg font-semibold shadow-2xl hover:shadow-stripe-purple/50 transition-all transform hover:scale-105">
              Try Live Demo
            </button>
            <button className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg font-semibold hover:bg-white/20 transition-all">
              View Documentation
            </button>
          </motion.div>
        </div>

        {/* Bento Box Layout */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-20"
        >
          {/* Large Feature Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -5 }}
            className="lg:col-span-2 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-xl"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-stripe-purple to-stripe-lightBlue rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white">Ultra-Low Latency</h3>
            </div>
            <p className="text-gray-300 text-lg mb-6">
              WebRTC transport with streaming TTS ensures natural conversations with response times under 800ms
            </p>
            <div className="bg-slate-800/50 rounded-lg p-4 font-mono text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">LLM Response:</span>
                <span className="text-stripe-green">~200ms</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">TTS Processing:</span>
                <span className="text-stripe-green">~300ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Network Latency:</span>
                <span className="text-stripe-green">~150ms</span>
              </div>
            </div>
          </motion.div>

          {/* Smaller Feature Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-xl"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Custom Training</h3>
            <p className="text-gray-300">
              Upload your business docs and pricing to create a personalized knowledge base
            </p>
          </motion.div>

          {/* Industry Examples */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-xl"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Any Industry</h3>
            <div className="space-y-2 text-gray-300">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-stripe-purple rounded-full mr-2"></div>
                Plumbers
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-stripe-lightBlue rounded-full mr-2"></div>
                Medical Clinics
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-stripe-green rounded-full mr-2"></div>
                Electricians
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                Legal Firms
              </div>
            </div>
          </motion.div>

          {/* Stats Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -5 }}
            className="lg:col-span-2 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-xl"
          >
            <h3 className="text-xl font-bold text-white mb-6">Built for Performance</h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-4xl font-bold bg-gradient-to-r from-stripe-purple to-stripe-lightBlue bg-clip-text text-transparent mb-2">
                  99.9%
                </div>
                <div className="text-gray-400 text-sm">Uptime SLA</div>
              </div>
              <div>
                <div className="text-4xl font-bold bg-gradient-to-r from-stripe-purple to-stripe-lightBlue bg-clip-text text-transparent mb-2">
                  &lt;800ms
                </div>
                <div className="text-gray-400 text-sm">Response Time</div>
              </div>
              <div>
                <div className="text-4xl font-bold bg-gradient-to-r from-stripe-purple to-stripe-lightBlue bg-clip-text text-transparent mb-2">
                  24/7
                </div>
                <div className="text-gray-400 text-sm">Availability</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
