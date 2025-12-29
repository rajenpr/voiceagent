'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for small businesses testing voice AI',
      monthlyPrice: 99,
      annualPrice: 950, // ~20% discount
      calls: 200,
      features: [
        '200 AI voice calls per month',
        'Basic appointment booking',
        'Lead qualification',
        'Email support',
        'Standard voice (1 accent)',
        'Basic analytics dashboard',
        '99.5% uptime SLA',
      ],
      cta: 'Start Free Trial',
      popular: false,
    },
    {
      name: 'Professional',
      description: 'For growing businesses scaling operations',
      monthlyPrice: 299,
      annualPrice: 2870, // ~20% discount
      calls: 750,
      features: [
        '750 AI voice calls per month',
        'Advanced appointment booking',
        'Lead qualification & scoring',
        'Priority email & chat support',
        'Premium voices (multiple accents)',
        'Advanced analytics & insights',
        'CRM integrations (Zapier)',
        'Custom knowledge base (5 documents)',
        'Call recording & transcripts',
        '99.9% uptime SLA',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      description: 'Custom solutions for large organizations',
      monthlyPrice: null,
      annualPrice: null,
      calls: 'Unlimited',
      features: [
        'Unlimited AI voice calls',
        'Custom AI training & workflows',
        'Dedicated account manager',
        '24/7 phone & email support',
        'Custom voice cloning',
        'White-label solution',
        'Advanced security (SOC 2, HIPAA)',
        'Custom integrations & API access',
        'Multi-language support',
        'On-premise deployment option',
        '99.99% uptime SLA',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  const addOns = [
    { name: 'Additional 100 calls', price: 45 },
    { name: 'Custom voice training', price: 199 },
    { name: 'Priority support upgrade', price: 99 },
    { name: 'Advanced CRM integration', price: 149 },
  ];

  return (
    <section id="pricing" className="relative py-32 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-[#0A2540] mb-6">
            Simple, transparent{' '}
            <span className="text-[#635BFF]">pricing</span>
          </h2>
          <p className="text-xl text-[#425466] max-w-2xl mx-auto mb-8">
            Choose the plan that fits your business. All plans include a 14-day free trial.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-[#635BFF] text-white'
                  : 'text-[#425466] hover:text-[#0A2540]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-md font-medium transition-all relative ${
                billingCycle === 'annual'
                  ? 'bg-[#635BFF] text-white'
                  : 'text-[#425466] hover:text-[#0A2540]'
              }`}
            >
              Annual
              <span className="absolute -top-3 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white rounded-2xl p-8 transition-all ${
                plan.popular
                  ? 'border-2 border-[#635BFF] shadow-xl scale-105'
                  : 'border border-gray-200 shadow-md hover:shadow-lg'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#635BFF] text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-[#0A2540] mb-2">{plan.name}</h3>
                <p className="text-[#425466] text-sm">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                {plan.monthlyPrice !== null ? (
                  <>
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold text-[#0A2540]">
                        ${billingCycle === 'monthly' ? plan.monthlyPrice : Math.floor(plan.annualPrice / 12)}
                      </span>
                      <span className="text-[#425466] ml-2">/month</span>
                    </div>
                    {billingCycle === 'annual' && (
                      <p className="text-sm text-[#8898AA] mt-2">
                        Billed ${plan.annualPrice} annually
                      </p>
                    )}
                    <p className="text-sm text-[#635BFF] mt-2 font-medium">
                      ~${((billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice / 12) / plan.calls).toFixed(2)} per call
                    </p>
                  </>
                ) : (
                  <div className="text-4xl font-bold text-[#0A2540]">Custom</div>
                )}
              </div>

              {/* CTA Button */}
              <button
                className={`w-full py-3 rounded-md font-semibold mb-8 transition-all ${
                  plan.popular
                    ? 'bg-[#635BFF] hover:bg-[#7A73FF] text-white shadow-md hover:shadow-lg'
                    : 'bg-white border-2 border-gray-300 hover:border-[#635BFF] text-[#0A2540]'
                }`}
              >
                {plan.cta}
              </button>

              {/* Features */}
              <div className="space-y-4">
                <p className="text-sm font-semibold text-[#0A2540] mb-4">What&apos;s included:</p>
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-[#635BFF] mr-3 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-[#425466] text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl border border-gray-200 p-8 mb-16"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-[#0A2540] mb-2">14 days</div>
              <p className="text-[#425466]">Free trial</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#0A2540] mb-2">No credit card</div>
              <p className="text-[#425466]">Required to start</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#0A2540] mb-2">Cancel anytime</div>
              <p className="text-[#425466]">No long-term contracts</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#0A2540] mb-2">24/7 Support</div>
              <p className="text-[#425466]">For all paid plans</p>
            </div>
          </div>
        </motion.div>

        {/* Add-ons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h3 className="text-3xl font-bold text-[#0A2540] text-center mb-8">
            Add-ons & Extras
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {addOns.map((addon, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#635BFF] transition-all"
              >
                <p className="text-[#0A2540] font-semibold mb-2">{addon.name}</p>
                <p className="text-2xl font-bold text-[#635BFF]">${addon.price}</p>
                <p className="text-sm text-[#8898AA] mt-1">/month</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl border border-gray-200 p-8"
        >
          <h3 className="text-3xl font-bold text-[#0A2540] text-center mb-8">
            Frequently asked questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                q: 'What counts as a call?',
                a: 'One call = one complete conversation with a customer, regardless of duration. Average calls last 3-5 minutes.',
              },
              {
                q: 'Can I upgrade or downgrade anytime?',
                a: 'Yes! Change plans anytime. Upgrades are immediate, downgrades take effect at the next billing cycle.',
              },
              {
                q: 'What happens if I exceed my call limit?',
                a: 'Additional calls are billed at $0.50 each, or you can purchase add-on packages at discounted rates.',
              },
              {
                q: 'Do you offer refunds?',
                a: '30-day money-back guarantee for annual plans. Monthly plans can be cancelled anytime with no penalty.',
              },
            ].map((faq, index) => (
              <div key={index}>
                <h4 className="font-semibold text-[#0A2540] mb-2">{faq.q}</h4>
                <p className="text-[#425466] text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Enterprise CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center bg-gradient-to-br from-[#635BFF]/10 to-[#00D4FF]/10 rounded-2xl p-12"
        >
          <h3 className="text-3xl font-bold text-[#0A2540] mb-4">
            Need a custom solution?
          </h3>
          <p className="text-xl text-[#425466] mb-8 max-w-2xl mx-auto">
            Talk to our team about enterprise pricing, custom integrations, and volume discounts.
          </p>
          <button className="px-8 py-4 bg-[#635BFF] hover:bg-[#7A73FF] text-white rounded-md font-semibold shadow-md hover:shadow-lg transition-all">
            Contact Sales Team
          </button>
        </motion.div>
      </div>
    </section>
  );
}
