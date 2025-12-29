'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { VoiceAIAPI } from '@/lib/api';
import Link from 'next/link';

export default function SessionDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const sessionId = params.id;

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  useEffect(() => {
    if (user) {
      loadSession();
    }
  }, [user]);

  const loadSession = async () => {
    if (!user) return;

    try {
      const result = await VoiceAIAPI.getSessionDetails(sessionId, user.user_id);

      if (result.success) {
        setSession(result);
      } else {
        setError('Session not found');
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      setError('Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!user || !selectedFiles || selectedFiles.length === 0) return;

    setError('');
    setSuccess('');
    setUploading(true);

    try {
      const result = await VoiceAIAPI.uploadDocuments(sessionId, user.user_id, selectedFiles);

      if (result.success) {
        setSuccess(`Successfully uploaded ${result.files_uploaded} file(s)`);
        setSelectedFiles(null);
        // Reload session to update document count
        await loadSession();
      } else {
        setError(result.detail || 'Failed to upload files');
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!confirm('Are you sure? This will permanently delete this AI agent and all uploaded documents.')) return;

    setDeleting(true);

    try {
      const result = await VoiceAIAPI.deleteSession(sessionId, user.user_id);

      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.detail || 'Failed to delete session');
      }
    } catch (err: any) {
      setError(err.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const copyWebhookURL = () => {
    const url = VoiceAIAPI.getWebhookURL(sessionId);
    navigator.clipboard.writeText(url);
    setSuccess('Webhook URL copied to clipboard!');
    setTimeout(() => setSuccess(''), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#635BFF] mx-auto"></div>
          <p className="mt-4 text-[#8898AA]">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Session not found'}</p>
          <Link href="/dashboard" className="text-[#635BFF] hover:underline mt-4 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const config = session.configuration;
  const webhookURL = VoiceAIAPI.getWebhookURL(sessionId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#0A2540] mb-2">
            {config.business_name}
          </h1>
          <p className="text-[#8898AA]">{config.industry}</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Webhook URL Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-[#0A2540] mb-4">Twilio Webhook URL</h2>
          <p className="text-sm text-[#8898AA] mb-4">
            Configure this URL in your Twilio phone number settings (Voice & Fax → A Call Comes In)
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={webhookURL}
              readOnly
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg font-mono text-sm"
            />
            <button
              onClick={copyWebhookURL}
              className="px-6 py-3 bg-[#635BFF] hover:bg-[#7A73FF] text-white font-medium rounded-lg transition-all inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>
          </div>
        </div>

        {/* Configuration Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0A2540]">Configuration</h2>
            <button className="text-sm text-[#635BFF] hover:text-[#7A73FF] font-medium">
              Edit Configuration
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-[#8898AA] mb-1">Greeting Message</p>
              <p className="text-[#0A2540]">{config.greeting_message}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#8898AA] mb-1">Tone</p>
                <span className="inline-block px-3 py-1 bg-gray-100 text-sm font-medium text-gray-700 rounded-full capitalize">
                  {config.tone}
                </span>
              </div>

              <div>
                <p className="text-sm text-[#8898AA] mb-1">Response Length</p>
                <span className="inline-block px-3 py-1 bg-gray-100 text-sm font-medium text-gray-700 rounded-full capitalize">
                  {config.response_length}
                </span>
              </div>
            </div>

            {config.business_hours && (
              <div>
                <p className="text-sm text-[#8898AA] mb-1">Business Hours</p>
                <p className="text-[#0A2540]">{config.business_hours}</p>
              </div>
            )}

            {config.special_instructions && (
              <div>
                <p className="text-sm text-[#8898AA] mb-1">Special Instructions</p>
                <p className="text-[#0A2540] whitespace-pre-wrap">{config.special_instructions}</p>
              </div>
            )}
          </div>
        </div>

        {/* Document Upload Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-[#0A2540] mb-4">
            Training Documents ({session.documents_uploaded})
          </h2>

          <p className="text-sm text-[#8898AA] mb-6">
            Upload documents to train your AI with specific knowledge about your business.
            Supported formats: PDF, DOCX, TXT, CSV, MD (max 10MB each)
          </p>

          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
            <input
              type="file"
              id="file-upload"
              multiple
              accept=".pdf,.docx,.txt,.csv,.md"
              onChange={(e) => setSelectedFiles(e.target.files)}
              className="hidden"
            />

            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-[#0A2540] font-medium mb-1">
                Click to select files
              </p>
              <p className="text-sm text-[#8898AA]">
                or drag and drop
              </p>
            </label>
          </div>

          {/* Selected Files */}
          {selectedFiles && selectedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-[#0A2540]">
                Selected files ({selectedFiles.length}):
              </p>
              {Array.from(selectedFiles).map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-[#635BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-[#0A2540]">{file.name}</p>
                      <p className="text-xs text-[#8898AA]">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full mt-4 px-6 py-3 bg-[#635BFF] hover:bg-[#7A73FF] text-white font-medium rounded-lg transition-all disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
              </button>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h2>
          <p className="text-sm text-[#8898AA] mb-4">
            Deleting this session will permanently remove all configuration and uploaded documents. This action cannot be undone.
          </p>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete AI Agent'}
          </button>
        </div>
      </div>
    </div>
  );
}
