'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { VoiceAIAPI } from '@/lib/api';

export default function VerifyPhonePage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { user, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user already has phone, skip to code entry
    if (user?.phone && !user.phone_verified) {
      setPhone(user.phone);
      setStep('code');
    }

    // If phone already verified, redirect to dashboard
    if (user?.phone_verified) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    // Countdown timer for resend code
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmitPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      const result = await VoiceAIAPI.submitPhone(user.user_id, phone);

      if (result.success) {
        setStep('code');
        setCountdown(60); // 60 second cooldown for resend
      } else {
        setError(result.detail || 'Failed to send verification code');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      const result = await VoiceAIAPI.verifyPhone(user.user_id, code);

      if (result.success) {
        // Refresh user data
        await refreshUser();
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(result.detail || 'Invalid or expired verification code');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!user || countdown > 0) return;

    setError('');
    setLoading(true);

    try {
      const result = await VoiceAIAPI.submitPhone(user.user_id, phone);

      if (result.success) {
        setCountdown(60);
      } else {
        setError(result.detail || 'Failed to resend code');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#635BFF] mx-auto"></div>
          <p className="mt-4 text-[#8898AA]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#635BFF]/10 rounded-full mb-4">
            <svg className="w-8 h-8 text-[#635BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#0A2540] mb-2">
            Verify Your Phone
          </h1>
          <p className="text-[#8898AA]">
            {step === 'phone'
              ? 'Enter your phone number to receive a verification code'
              : 'Enter the 6-digit code we sent to your phone'
            }
          </p>
        </div>

        {/* Verification Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Phone Number Step */}
          {step === 'phone' && (
            <form onSubmit={handleSubmitPhone} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#0A2540] mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#635BFF] focus:border-[#635BFF] transition-all text-lg"
                  placeholder="+1 (555) 123-4567"
                />
                <p className="mt-2 text-xs text-[#8898AA]">
                  Format: +1 (area code) number (e.g., +1 415 555 1234)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#635BFF] hover:bg-[#7A73FF] text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </form>
          )}

          {/* Verification Code Step */}
          {step === 'code' && (
            <div className="space-y-4">
              {/* Phone Number Display */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                <p className="text-sm text-[#8898AA] mb-1">Code sent to:</p>
                <p className="text-lg font-medium text-[#0A2540]">{phone}</p>
                <button
                  onClick={() => setStep('phone')}
                  className="text-sm text-[#635BFF] hover:text-[#7A73FF] mt-2"
                >
                  Change phone number
                </button>
              </div>

              <form onSubmit={handleSubmitCode} className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-[#0A2540] mb-2">
                    Verification Code
                  </label>
                  <input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#635BFF] focus:border-[#635BFF] transition-all text-center text-2xl tracking-widest font-mono"
                    placeholder="000000"
                  />
                  <p className="mt-2 text-xs text-[#8898AA] text-center">
                    Code expires in 10 minutes
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full py-3 px-4 bg-[#635BFF] hover:bg-[#7A73FF] text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify Phone Number'}
                </button>
              </form>

              {/* Resend Code */}
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-[#8898AA]">
                    Resend code in {countdown} seconds
                  </p>
                ) : (
                  <button
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-sm text-[#635BFF] hover:text-[#7A73FF] font-medium disabled:opacity-50"
                  >
                    Didn&apos;t receive a code? Resend
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-900">
              <strong>Why verify your phone?</strong>
              <br />
              Phone verification is required to create AI voice agents. This ensures security and prevents abuse.
            </p>
          </div>
        </div>

        {/* Skip Link (shouldn't be used in production) */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs text-[#8898AA] hover:text-[#635BFF]"
          >
            Skip for now (limited access)
          </button>
        </div>
      </div>
    </div>
  );
}
