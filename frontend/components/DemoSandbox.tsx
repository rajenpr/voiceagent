'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FormData {
  businessName: string;
  industry: string;
  primaryGoal: string;
  systemInstructions: string;
}

export default function DemoSandbox() {
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    industry: '',
    primaryGoal: '',
    systemInstructions: 'You are a helpful AI assistant. For appointment booking:\n1. Greet the caller warmly\n2. Ask for their name\n3. Ask for their phone number\n4. Ask for their preferred date and time\n5. Ask for the reason for their appointment\n6. Confirm all details back to them\n7. Let them know the appointment is booked and they\'ll receive a confirmation',
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isCallActive, setIsCallActive] = useState(false);
  const [step, setStep] = useState(1);
  const [dragActive, setDragActive] = useState(false);
  const [agentMessage, setAgentMessage] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
      // Stop any currently playing audio to prevent doubling
      const currentAudio = (window as any).currentAudioElement;
      if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

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
      (window as any).currentAudioElement = audio;

      audio.play().catch((e) => console.error('Error playing audio:', e));

      // Cleanup
      audio.onended = () => {
        URL.revokeObjectURL(url);
        if ((window as any).currentAudioElement === audio) {
          (window as any).currentAudioElement = null;
        }
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
    recognition.maxAlternatives = 1; // Get best result for accuracy

    let interimTimeout: NodeJS.Timeout | null = null;
    let lastInterimTranscript = '';
    let lastSentTranscript = ''; // Track what was already sent

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
        console.log('Final transcript:', finalTranscript);
        setUserTranscript(finalTranscript);

        // Clear any pending interim timeout
        if (interimTimeout) {
          clearTimeout(interimTimeout);
          interimTimeout = null;
        }

        // Only send if different from what was already sent via timeout
        const trimmedFinal = finalTranscript.trim();
        if (trimmedFinal && trimmedFinal !== lastSentTranscript) {
          const ws = (window as any).voiceWebSocket;
          if (ws && ws.readyState === WebSocket.OPEN) {
            console.log('Sending final to backend:', finalTranscript);
            setIsProcessing(true); // Show processing state
            ws.send(JSON.stringify({
              type: 'user_speech',
              text: finalTranscript,
            }));
            lastSentTranscript = trimmedFinal;
          }
        } else {
          console.log('Skipping duplicate final transcript');
        }

        // Clear interim tracking
        lastInterimTranscript = '';
      } else if (interimTranscript) {
        console.log('Interim transcript:', interimTranscript);
        setUserTranscript(interimTranscript);
        lastInterimTranscript = interimTranscript;

        // Clear existing timeout
        if (interimTimeout) {
          clearTimeout(interimTimeout);
        }

        // Set timeout to send interim transcript if no final comes through
        interimTimeout = setTimeout(() => {
          const trimmedInterim = lastInterimTranscript.trim();
          if (trimmedInterim && trimmedInterim !== lastSentTranscript) {
            console.log('Timeout - sending interim transcript:', lastInterimTranscript);
            const ws = (window as any).voiceWebSocket;
            if (ws && ws.readyState === WebSocket.OPEN) {
              setIsProcessing(true); // Show processing state
              ws.send(JSON.stringify({
                type: 'user_speech',
                text: lastInterimTranscript,
              }));
              lastSentTranscript = trimmedInterim;
            }
          }
          lastInterimTranscript = '';
        }, 1000); // Reduced to 1 second for faster response
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);

      // Don't stop listening on "no-speech" error - just restart
      if (event.error === 'no-speech') {
        console.log('No speech detected, continuing to listen...');
        return;
      }

      setIsListening(false);
      if (interimTimeout) {
        clearTimeout(interimTimeout);
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended, restarting...');
      if (interimTimeout) {
        clearTimeout(interimTimeout);
      }
      // Auto-restart if call is still active
      if ((window as any).voiceWebSocket?.readyState === WebSocket.OPEN) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.log('Recognition already started');
          }
        }, 100);
      } else {
        setIsListening(false);
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
          system_instructions: formData.systemInstructions,
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
            setIsProcessing(false); // Clear processing state
            setAgentMessage(data.text || 'AI is thinking...');
            setUserTranscript(''); // Clear user transcript after response
            // Play audio if available
            if (data.audio) {
              playAudio(data.audio);
            }
          } else if (data.error) {
            console.error('Server error:', data.error);
            setIsProcessing(false); // Clear processing state on error
            setAgentMessage(`Error: ${data.error}`);
          } else if (data.type === 'call_ended') {
            setIsProcessing(false); // Clear processing state
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

    // Stop any playing audio
    const currentAudio = (window as any).currentAudioElement;
    if (currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    (window as any).currentAudioElement = null;

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
    setIsProcessing(false);
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
          <h2 className="text-5xl md:text-6xl font-bold text-[#0A2540] mb-6">
            Try It{' '}
            <span className="text-[#635BFF]">
              Live
            </span>
          </h2>
          <p className="text-xl text-[#425466] max-w-2xl mx-auto">
            Experience the power of real-time voice AI. Upload your business information
            and have a conversation in seconds.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg"
        >
          {/* Progress Steps */}
          <div className="flex justify-between mb-12">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                      step >= s
                        ? 'bg-[#635BFF] text-white'
                        : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                    }`}
                  >
                    {s}
                  </div>
                  <div className={`mt-2 text-sm font-medium ${step >= s ? 'text-[#0A2540]' : 'text-gray-400'}`}>
                    {s === 1 && 'Business Info'}
                    {s === 2 && 'Upload Docs'}
                    {s === 3 && 'Test Call'}
                  </div>
                </div>
                {s < 3 && (
                  <div
                    className={`h-1 flex-1 mx-4 rounded ${
                      step > s ? 'bg-[#635BFF]' : 'bg-gray-200'
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
                  <label className="block text-[#0A2540] font-semibold mb-2">Business Name</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="e.g., Quick Fix Plumbing"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-[#0A2540] placeholder-gray-400 focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[#0A2540] font-semibold mb-2">Industry</label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-[#0A2540] focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20 focus:outline-none transition-all"
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
                  <label className="block text-[#0A2540] font-semibold mb-2">Primary Goal</label>
                  <select
                    name="primaryGoal"
                    value={formData.primaryGoal}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-[#0A2540] focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20 focus:outline-none transition-all"
                  >
                    <option value="">What should the AI help with?</option>
                    {goals.map((goal) => (
                      <option key={goal} value={goal}>
                        {goal}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#0A2540] font-semibold mb-2">
                    System Instructions (How should the AI behave?)
                  </label>
                  <textarea
                    name="systemInstructions"
                    value={formData.systemInstructions}
                    onChange={handleInputChange}
                    rows={8}
                    placeholder="Enter detailed instructions for how the AI should handle conversations..."
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-[#0A2540] placeholder-gray-400 focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20 focus:outline-none transition-all resize-none font-mono text-sm"
                  />
                  <p className="text-gray-400 text-xs mt-2">
                    💡 Tip: Be specific about the steps the AI should follow (e.g., &ldquo;First ask for name, then phone number, then preferred appointment time...&rdquo;)
                  </p>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!formData.businessName || !formData.industry || !formData.primaryGoal}
                  className="w-full px-6 py-4 bg-[#635BFF] hover:bg-[#7A73FF] text-white rounded-md font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#635BFF]"
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
                      ? 'border-[#635BFF] bg-[#635BFF]/5'
                      : 'border-gray-300 hover:border-[#635BFF]/50 bg-gray-50'
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
                  <p className="text-[#0A2540] font-semibold mb-2">
                    Drop your files here or click to browse
                  </p>
                  <p className="text-[#425466] text-sm mb-4">
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

            {/* Step 3: Test Call - Phone Based */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Configuration Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
                  <h4 className="text-[#0A2540] font-semibold mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-[#635BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Your Configuration
                  </h4>
                  <div className="space-y-2 text-[#425466]">
                    <p className="flex items-center">
                      <span className="text-[#8898AA] min-w-24">Business:</span>
                      <span className="font-medium">{formData.businessName}</span>
                    </p>
                    <p className="flex items-center">
                      <span className="text-[#8898AA] min-w-24">Industry:</span>
                      <span className="font-medium">{formData.industry}</span>
                    </p>
                    <p className="flex items-center">
                      <span className="text-[#8898AA] min-w-24">Goal:</span>
                      <span className="font-medium">{formData.primaryGoal}</span>
                    </p>
                    <p className="flex items-center">
                      <span className="text-[#8898AA] min-w-24">Files:</span>
                      <span className="font-medium">{uploadedFiles.length} uploaded</span>
                    </p>
                  </div>
                </div>

                {/* Phone Number Display */}
                <div className="bg-gradient-to-br from-[#635BFF]/5 to-[#00D4FF]/5 border-2 border-[#635BFF] rounded-2xl p-8 text-center">
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-[#635BFF] rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-[#0A2540] mb-2">
                      Ready to Test Your Voice AI
                    </h3>
                    <p className="text-[#425466] mb-6">
                      Call the number below to experience your configured AI assistant
                    </p>
                  </div>

                  {/* Phone Number */}
                  <div className="bg-white border-2 border-[#635BFF] rounded-xl p-6 mb-6">
                    <p className="text-sm text-[#8898AA] mb-2 uppercase tracking-wide font-semibold">
                      Test Phone Number
                    </p>
                    <a
                      href="tel:+18001234567"
                      className="text-4xl md:text-5xl font-bold text-[#635BFF] hover:text-[#7A73FF] transition-colors"
                    >
                      +1 (800) 123-4567
                    </a>
                    <p className="text-xs text-[#8898AA] mt-3">
                      📱 Tap to call from mobile
                    </p>
                  </div>

                  {/* Instructions */}
                  <div className="text-left bg-white rounded-xl p-6 mb-6">
                    <h4 className="font-semibold text-[#0A2540] mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-[#635BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      How to Test
                    </h4>
                    <ol className="space-y-3 text-[#425466]">
                      <li className="flex items-start">
                        <span className="bg-[#635BFF] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 mt-0.5">
                          1
                        </span>
                        <span>Call the number above from your phone</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-[#635BFF] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 mt-0.5">
                          2
                        </span>
                        <span>The AI will greet you and ask how it can help</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-[#635BFF] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 mt-0.5">
                          3
                        </span>
                        <span>Test appointment booking, questions, or any scenario</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-[#635BFF] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 mt-0.5">
                          4
                        </span>
                        <span>Say &quot;goodbye&quot; or hang up when finished</span>
                      </li>
                    </ol>
                  </div>

                  {/* Features List */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-[#635BFF] font-semibold mb-1">✨ Natural Speech</div>
                      <div className="text-[#8898AA]">Human-like conversation</div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-[#635BFF] font-semibold mb-1">⚡ Fast Response</div>
                      <div className="text-[#8898AA]">&lt;800ms latency</div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-[#635BFF] font-semibold mb-1">🧠 Smart AI</div>
                      <div className="text-[#8898AA]">Custom trained for you</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full px-6 py-3 border-2 border-gray-300 hover:border-[#635BFF] bg-white text-[#0A2540] rounded-md font-semibold transition-all"
                >
                  ← Back to Upload
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
