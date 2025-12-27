'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FormData {
  businessName: string;
  industry: string;
  primaryGoal: string;
}

export default function DemoSandbox() {
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    industry: '',
    primaryGoal: '',
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isCallActive, setIsCallActive] = useState(false);
  const [step, setStep] = useState(1);
  const [dragActive, setDragActive] = useState(false);
  const [agentMessage, setAgentMessage] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [userTranscript, setUserTranscript] = useState<string>('');

  const industries = [
    'Plumber',
    'Medical Clinic',
    'Electrician',
    'HVAC',
    'Legal Firm',
    'Real Estate',
    'Dental Office',
    'Auto Repair',
    'Other',
  ];

  const goals = [
    'Book Appointments',
    'Lead Qualification',
    'Customer Support',
    'Emergency Dispatch',
    'Information Queries',
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const playAudio = (base64Audio: string) => {
    try {
      // Convert base64 to blob
      const audioData = atob(base64Audio);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);

      // Play audio
      const audio = new Audio(url);
      audio.play().catch((e) => console.error('Error playing audio:', e));

      // Cleanup
      audio.onended = () => {
        URL.revokeObjectURL(url);
      };
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      console.log('Speech recognition started');
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setUserTranscript(finalTranscript);
        // Send to backend
        const ws = (window as any).voiceWebSocket;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'user_speech',
            text: finalTranscript,
          }));
        }
      } else {
        setUserTranscript(interimTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if call is still active
      if ((window as any).voiceWebSocket?.readyState === WebSocket.OPEN) {
        recognition.start();
      }
    };

    (window as any).speechRecognition = recognition;
    recognition.start();
  };

  const startCall = async () => {
    try {
      setIsCallActive(true);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Step 1: Create session with business config
      const sessionResponse = await fetch(`${apiUrl}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: formData.businessName,
          industry: formData.industry,
          primary_goal: formData.primaryGoal,
        }),
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to create session');
      }

      const { session_id } = await sessionResponse.json();
      console.log('Session created:', session_id);

      // Step 2: Upload files if any
      if (uploadedFiles.length > 0) {
        const formDataUpload = new FormData();
        uploadedFiles.forEach((file) => {
          formDataUpload.append('files', file);
        });

        const uploadResponse = await fetch(`${apiUrl}/api/upload/${session_id}`, {
          method: 'POST',
          body: formDataUpload,
        });

        if (!uploadResponse.ok) {
          console.warn('File upload failed, continuing without files');
        } else {
          console.log('Files uploaded successfully');
        }
      }

      // Step 3: Connect to WebSocket for voice
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
      const ws = new WebSocket(`${wsUrl}/ws/voice/${session_id}`);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setAgentMessage('Connecting to AI agent...');
        // Start speech recognition
        startSpeechRecognition();
      };

      ws.onmessage = (event) => {
        console.log('Message from server:', event.data);
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'agent_response') {
            setAgentMessage(data.text || 'AI is thinking...');
            // Play audio if available
            if (data.audio) {
              playAudio(data.audio);
            }
          } else if (data.error) {
            console.error('Server error:', data.error);
            setAgentMessage(`Error: ${data.error}`);
          } else if (data.type === 'call_ended') {
            setAgentMessage(data.message || 'Call ended');
            // Play goodbye audio
            if (data.audio) {
              playAudio(data.audio);
            }
            setTimeout(() => setIsCallActive(false), 2000);
          }
        } catch (e) {
          console.log('Non-JSON message:', event.data);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        alert('Connection error. Check console for details.');
        setIsCallActive(false);
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        setIsCallActive(false);
      };

      // Store WebSocket reference for cleanup
      (window as any).voiceWebSocket = ws;

    } catch (error) {
      console.error('Error starting call:', error);
      alert(`Failed to start call: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsCallActive(false);
    }
  };

  const endCall = () => {
    // Stop speech recognition
    const recognition = (window as any).speechRecognition;
    if (recognition) {
      recognition.stop();
      (window as any).speechRecognition = null;
    }

    // Send end call message to backend
    const ws = (window as any).voiceWebSocket;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'end_call' }));
      setTimeout(() => {
        ws.close();
        console.log('WebSocket connection closed');
      }, 500);
    }
    (window as any).voiceWebSocket = null;
    setIsCallActive(false);
    setAgentMessage('');
    setIsListening(false);
    setUserTranscript('');
  };

  return (
    <section id="demo" className="relative py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Try It{' '}
            <span className="bg-gradient-to-r from-stripe-purple to-stripe-lightBlue bg-clip-text text-transparent">
              Live
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Experience the power of real-time voice AI. Upload your business information
            and have a conversation in seconds.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl"
        >
          {/* Progress Steps */}
          <div className="flex justify-between mb-12">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                      step >= s
                        ? 'bg-gradient-to-r from-stripe-purple to-stripe-lightBlue text-white'
                        : 'bg-slate-700 text-gray-400'
                    }`}
                  >
                    {s}
                  </div>
                  <div className={`mt-2 text-sm ${step >= s ? 'text-white' : 'text-gray-400'}`}>
                    {s === 1 && 'Business Info'}
                    {s === 2 && 'Upload Docs'}
                    {s === 3 && 'Test Call'}
                  </div>
                </div>
                {s < 3 && (
                  <div
                    className={`h-1 flex-1 mx-4 rounded ${
                      step > s ? 'bg-gradient-to-r from-stripe-purple to-stripe-lightBlue' : 'bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Business Information */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-white font-semibold mb-2">Business Name</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="e.g., Quick Fix Plumbing"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-stripe-purple focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Industry</label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white focus:border-stripe-purple focus:outline-none transition-colors"
                  >
                    <option value="">Select your industry</option>
                    {industries.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Primary Goal</label>
                  <select
                    name="primaryGoal"
                    value={formData.primaryGoal}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white focus:border-stripe-purple focus:outline-none transition-colors"
                  >
                    <option value="">What should the AI help with?</option>
                    {goals.map((goal) => (
                      <option key={goal} value={goal}>
                        {goal}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!formData.businessName || !formData.industry || !formData.primaryGoal}
                  className="w-full px-6 py-4 bg-gradient-to-r from-stripe-purple to-stripe-lightBlue text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                >
                  Continue to Upload
                </button>
              </motion.div>
            )}

            {/* Step 2: File Upload */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                    dragActive
                      ? 'border-stripe-purple bg-stripe-purple/10'
                      : 'border-white/20 hover:border-stripe-purple/50'
                  }`}
                >
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-white font-semibold mb-2">
                    Drop your files here or click to browse
                  </p>
                  <p className="text-gray-400 text-sm mb-4">
                    PDF, TXT, or DOCX files (Service menus, pricing, FAQs)
                  </p>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    multiple
                    accept=".pdf,.txt,.docx"
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg cursor-pointer transition-colors"
                  >
                    Choose Files
                  </label>
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-white font-semibold">Uploaded Files:</h4>
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-slate-800/50 rounded-lg p-4"
                      >
                        <div className="flex items-center space-x-3">
                          <svg
                            className="w-6 h-6 text-stripe-purple"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span className="text-white">{file.name}</span>
                          <span className="text-gray-400 text-sm">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-stripe-purple to-stripe-lightBlue text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
                  >
                    Continue to Test Call
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Test Call */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-slate-800/30 rounded-xl p-6 mb-6">
                  <h4 className="text-white font-semibold mb-4">Your Configuration:</h4>
                  <div className="space-y-2 text-gray-300">
                    <p>
                      <span className="text-gray-400">Business:</span> {formData.businessName}
                    </p>
                    <p>
                      <span className="text-gray-400">Industry:</span> {formData.industry}
                    </p>
                    <p>
                      <span className="text-gray-400">Goal:</span> {formData.primaryGoal}
                    </p>
                    <p>
                      <span className="text-gray-400">Files:</span> {uploadedFiles.length} uploaded
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  {!isCallActive ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={startCall}
                        className="w-full md:w-auto px-12 py-6 bg-gradient-to-r from-stripe-purple to-stripe-lightBlue text-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-stripe-purple/50 transition-all mb-4"
                      >
                        <div className="flex items-center justify-center space-x-3">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          <span>Start Test Call</span>
                        </div>
                      </motion.button>
                      <p className="text-gray-400 text-sm">
                        Click to initiate a WebRTC voice session in your browser
                      </p>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex flex-col items-center">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="w-32 h-32 bg-gradient-to-r from-stripe-purple to-stripe-lightBlue rounded-full flex items-center justify-center mb-6"
                        >
                          <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                            />
                          </svg>
                        </motion.div>
                        <p className="text-white font-semibold text-xl mb-2">Call in Progress</p>
                        <div className="flex items-center justify-center space-x-2 mb-4">
                          <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                          <p className="text-gray-400">{isListening ? 'Listening...' : 'Waiting for speech'}</p>
                        </div>

                        {/* User Transcript */}
                        {userTranscript && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-4 bg-blue-900/30 border border-blue-500/30 rounded-xl max-w-md"
                          >
                            <div className="flex items-start space-x-3">
                              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <p className="text-blue-100 text-sm leading-relaxed">You: {userTranscript}</p>
                            </div>
                          </motion.div>
                        )}

                        {/* Agent Message Display */}
                        {agentMessage && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-6 bg-slate-800/50 border border-white/10 rounded-xl max-w-md"
                          >
                            <div className="flex items-start space-x-3">
                              <svg className="w-6 h-6 text-stripe-purple flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                              </svg>
                              <p className="text-white text-lg leading-relaxed">{agentMessage}</p>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      <button
                        onClick={endCall}
                        className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
                      >
                        End Call
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Back to Upload
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
