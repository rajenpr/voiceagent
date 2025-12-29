'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !user) {
      router.push('/auth');
    }

    // Load user sessions
    if (user) {
      setSessions(user.sessions || []);
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#635BFF] mx-auto"></div>
          <p className="mt-4 text-[#8898AA]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold text-[#0A2540]">
                Voice AI
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link href="/dashboard" className="text-sm font-medium text-[#635BFF]">
                  Dashboard
                </Link>
                <Link href="/dashboard/settings" className="text-sm text-[#8898AA] hover:text-[#0A2540]">
                  Settings
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* User Info */}
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-[#0A2540]">{user.email}</p>
                <p className="text-xs text-[#8898AA]">
                  {user.subscription_plan || 'Free Plan'}
                </p>
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="text-sm text-[#8898AA] hover:text-[#0A2540]"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#0A2540] mb-2">
              Your AI Agents
            </h1>
            <p className="text-[#8898AA]">
              Manage your voice AI sessions and configurations
            </p>
          </div>

          <Link
            href="/dashboard/create"
            className="px-6 py-3 bg-[#635BFF] hover:bg-[#7A73FF] text-white font-medium rounded-lg transition-all inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Agent
          </Link>
        </div>

        {/* Phone Verification Warning */}
        {!user.phone_verified && (
          <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-900 mb-1">
                  Phone Verification Required
                </h3>
                <p className="text-yellow-800 mb-4">
                  You need to verify your phone number before creating AI voice agents.
                </p>
                <Link
                  href="/auth/verify-phone"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-all"
                >
                  Verify Phone Number
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Sessions Grid */}
        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-[#0A2540] mb-2">
              No AI Agents Yet
            </h3>
            <p className="text-[#8898AA] mb-6 max-w-md mx-auto">
              Create your first voice AI agent to get started. Choose from our templates or build a custom configuration.
            </p>
            <Link
              href="/dashboard/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#635BFF] hover:bg-[#7A73FF] text-white font-medium rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Agent
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <Link
                key={session.session_id}
                href={`/dashboard/session/${session.session_id}`}
                className="group"
              >
                <div className="bg-white rounded-xl border border-gray-200 hover:border-[#635BFF] hover:shadow-lg transition-all p-6">
                  {/* Session Icon */}
                  <div className="w-12 h-12 bg-[#635BFF]/10 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-[#635BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>

                  {/* Session Info */}
                  <h3 className="text-lg font-bold text-[#0A2540] mb-2 group-hover:text-[#635BFF] transition-colors">
                    {session.business_name}
                  </h3>
                  <p className="text-sm text-[#8898AA] mb-4">
                    {session.industry}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-[#8898AA]">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {session.documents_count || 0} docs
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Active
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {sessions.length > 0 && (
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-[#8898AA]">Total Agents</p>
                <svg className="w-5 h-5 text-[#635BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-[#0A2540]">{sessions.length}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-[#8898AA]">Documents Uploaded</p>
                <svg className="w-5 h-5 text-[#635BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-[#0A2540]">
                {sessions.reduce((sum, s) => sum + (s.documents_count || 0), 0)}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-[#8898AA]">Status</p>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <p className="text-3xl font-bold text-[#0A2540]">All Active</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
