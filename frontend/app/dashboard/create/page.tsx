'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { VoiceAIAPI, BusinessConfig } from '@/lib/api';
import Link from 'next/link';

export default function CreateSessionPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<'template' | 'configure'>('template');
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [config, setConfig] = useState<BusinessConfig>({
    business_name: '',
    industry: '',
    primary_goal: '',
    greeting_message: '',
    tone: 'professional',
    response_length: 'concise',
    business_hours: '',
    services_offered: [],
    pricing_info: '',
    special_instructions: ''
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const result = await VoiceAIAPI.getTemplates();
      if (result.success) {
        setTemplates(result.templates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template);
    // Pre-fill config with template defaults
    setConfig({
      ...config,
      industry: template.default_config.primary_goal || template.industry,
      primary_goal: template.default_config.primary_goal,
      greeting_message: template.default_config.greeting_message,
      tone: template.default_config.tone,
      business_hours: template.default_config.business_hours,
      services_offered: template.default_config.services_offered || [],
      special_instructions: template.default_config.special_instructions
    });
    setStep('configure');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      const result = await VoiceAIAPI.createSession(user.user_id, config);

      if (result.success) {
        router.push(`/dashboard/session/${result.session_id}`);
      } else {
        setError(result.detail || 'Failed to create session');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Nav */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/dashboard" className="text-sm text-[#635BFF] hover:text-[#7A73FF] inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#0A2540] mb-3">
            Create Your AI Agent
          </h1>
          <p className="text-lg text-[#8898AA]">
            {step === 'template'
              ? 'Choose a template to get started quickly'
              : 'Configure your AI agent behavior'
            }
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className={`flex items-center gap-2 ${step === 'template' ? 'text-[#635BFF]' : 'text-green-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'template' ? 'bg-[#635BFF] text-white' : 'bg-green-600 text-white'
            }`}>
              {step === 'configure' ? '✓' : '1'}
            </div>
            <span className="font-medium">Choose Template</span>
          </div>

          <div className="w-12 h-0.5 bg-gray-300"></div>

          <div className={`flex items-center gap-2 ${step === 'configure' ? 'text-[#635BFF]' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'configure' ? 'bg-[#635BFF] text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
            <span className="font-medium">Configure</span>
          </div>
        </div>

        {/* Template Selection */}
        {step === 'template' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <button
                key={template.template_id}
                onClick={() => handleSelectTemplate(template)}
                className="bg-white rounded-xl border-2 border-gray-200 hover:border-[#635BFF] p-6 text-left transition-all group"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-[#0A2540] group-hover:text-[#635BFF] mb-2">
                    {template.name}
                  </h3>
                  <p className="text-sm text-[#8898AA] mb-3">
                    {template.description}
                  </p>
                  <span className="inline-block px-3 py-1 bg-gray-100 text-xs font-medium text-gray-700 rounded-full">
                    {template.industry}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-[#635BFF] font-medium">
                  Select template
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Configuration Form */}
        {step === 'configure' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            {/* Template Badge */}
            {selectedTemplate && (
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-[#635BFF]/10 text-[#635BFF] text-sm font-medium rounded-full">
                    {selectedTemplate.name} Template
                  </span>
                  <button
                    onClick={() => setStep('template')}
                    className="text-sm text-[#8898AA] hover:text-[#635BFF]"
                  >
                    Change template
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-[#0A2540] mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={config.business_name}
                  onChange={(e) => setConfig({...config, business_name: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#635BFF] focus:border-[#635BFF]"
                  placeholder="Smith Dental Office"
                />
              </div>

              {/* Greeting Message */}
              <div>
                <label className="block text-sm font-medium text-[#0A2540] mb-2">
                  Greeting Message *
                </label>
                <textarea
                  value={config.greeting_message}
                  onChange={(e) => setConfig({...config, greeting_message: e.target.value})}
                  required
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#635BFF] focus:border-[#635BFF]"
                  placeholder="Thank you for calling! How can I help you today?"
                />
              </div>

              {/* Tone & Response Length */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#0A2540] mb-2">
                    Tone
                  </label>
                  <select
                    value={config.tone}
                    onChange={(e) => setConfig({...config, tone: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#635BFF] focus:border-[#635BFF]"
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="casual">Casual</option>
                    <option value="formal">Formal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A2540] mb-2">
                    Response Length
                  </label>
                  <select
                    value={config.response_length}
                    onChange={(e) => setConfig({...config, response_length: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#635BFF] focus:border-[#635BFF]"
                  >
                    <option value="brief">Brief</option>
                    <option value="concise">Concise</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </div>
              </div>

              {/* Business Hours */}
              <div>
                <label className="block text-sm font-medium text-[#0A2540] mb-2">
                  Business Hours
                </label>
                <input
                  type="text"
                  value={config.business_hours}
                  onChange={(e) => setConfig({...config, business_hours: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#635BFF] focus:border-[#635BFF]"
                  placeholder="Monday-Friday 9AM-5PM"
                />
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-medium text-[#0A2540] mb-2">
                  Special Instructions
                </label>
                <textarea
                  value={config.special_instructions}
                  onChange={(e) => setConfig({...config, special_instructions: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#635BFF] focus:border-[#635BFF]"
                  placeholder="Any specific instructions for how your AI should behave..."
                />
                <p className="mt-2 text-sm text-[#8898AA]">
                  Tell your AI what information to collect, how to handle specific scenarios, etc.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('template')}
                  className="px-6 py-3 border border-gray-300 text-[#0A2540] font-medium rounded-lg hover:bg-gray-50 transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-[#635BFF] hover:bg-[#7A73FF] text-white font-medium rounded-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create AI Agent'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
