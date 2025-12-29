/**
 * API Client for Voice AI Platform
 * Handles all backend communication
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface BusinessConfig {
  business_name: string;
  industry: string;
  primary_goal: string;
  system_instructions?: string;
  greeting_message?: string;
  tone?: 'professional' | 'friendly' | 'casual' | 'formal';
  response_length?: 'concise' | 'detailed' | 'brief';
  transfer_phone?: string;
  business_hours?: string;
  services_offered?: string[];
  pricing_info?: string;
  special_instructions?: string;
  is_demo?: boolean;
  demo_duration_hours?: number;
}

export interface Session {
  session_id: string;
  business_name: string;
  industry: string;
  documents_count: number;
  configuration?: BusinessConfig;
}

export class VoiceAIAPI {
  // Phone Verification
  static async submitPhone(userId: string, phone: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/phone/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, phone })
    });
    return response.json();
  }

  static async verifyPhone(userId: string, code: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/phone/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, code })
    });
    return response.json();
  }

  // Configuration Templates
  static async getTemplates() {
    const response = await fetch(`${API_BASE_URL}/api/portal/templates`);
    return response.json();
  }

  // Session Management
  static async createSession(userId: string, config: BusinessConfig) {
    const response = await fetch(`${API_BASE_URL}/api/portal/session/create/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return response.json();
  }

  static async updateSessionConfig(sessionId: string, userId: string, config: BusinessConfig) {
    const response = await fetch(`${API_BASE_URL}/api/portal/session/${sessionId}/configure/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return response.json();
  }

  static async getSessionDetails(sessionId: string, userId: string) {
    const response = await fetch(`${API_BASE_URL}/api/portal/session/${sessionId}/details/${userId}`);
    return response.json();
  }

  static async deleteSession(sessionId: string, userId: string) {
    const response = await fetch(`${API_BASE_URL}/api/portal/session/${sessionId}/delete/${userId}`, {
      method: 'DELETE'
    });
    return response.json();
  }

  // Document Upload
  static async uploadDocuments(sessionId: string, userId: string, files: FileList) {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_BASE_URL}/api/portal/session/${sessionId}/upload/${userId}`, {
      method: 'POST',
      body: formData
    });
    return response.json();
  }

  // User Profile
  static async getUserProfile(userId: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/me/${userId}`);
    return response.json();
  }

  // Webhook URL helper
  static getWebhookURL(sessionId: string) {
    const baseUrl = API_BASE_URL.replace('http://', '').replace('https://', '');
    return `${API_BASE_URL}/api/twilio/voice/incoming/${sessionId}`;
  }
}
