"""
Twilio Voice Service with Deepgram STT/TTS
Handles phone-based voice AI conversations with enterprise reliability
"""

import os
import asyncio
import httpx
from typing import Dict, Any, Optional
from twilio.twiml.voice_response import VoiceResponse, Gather, Say
from deepgram import (
    DeepgramClient,
    PrerecordedOptions,
    SpeakOptions,
)


class TwilioVoiceService:
    """
    Handles Twilio phone calls with Deepgram for speech recognition and synthesis
    """

    def __init__(self, session_id: str, business_config: Dict[str, Any], rag_service: Any):
        self.session_id = session_id
        self.business_config = business_config
        self.rag_service = rag_service

        # API Keys
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.deepgram_api_key = os.getenv("DEEPGRAM_API_KEY")

        # Initialize Deepgram client
        self.deepgram = DeepgramClient(self.deepgram_api_key) if self.deepgram_api_key else None

        # Conversation history
        self.conversation_history = []

    async def create_system_prompt(self) -> str:
        """
        Generate dynamic system prompt based on business configuration
        """
        business_name = self.business_config.get("business_name", "our business")
        industry = self.business_config.get("industry", "service")
        primary_goal = self.business_config.get("primary_goal", "assist customers")
        system_instructions = self.business_config.get("system_instructions", "")

        # Get relevant context from RAG
        context = await self.rag_service.get_context(self.session_id, "")

        # Use custom instructions if provided, otherwise use default
        if system_instructions:
            prompt = f"""You are an AI voice assistant for {business_name}, a {industry} business.

Your primary goal is to: {primary_goal}

CUSTOM INSTRUCTIONS:
{system_instructions}

Business Context:
{context if context else "No additional context provided. Use general knowledge about the industry."}

IMPORTANT RULES FOR PHONE CONVERSATIONS:
- Keep responses VERY concise (1-2 sentences max) for natural phone conversation flow
- Speak naturally and conversationally, as if on a phone call
- Always identify yourself as an AI assistant
- Be honest if you don't have information
- Follow the custom instructions step-by-step
- Ask ONE question at a time
- Wait for the customer's response before proceeding
- Speak clearly and at a moderate pace
"""
        else:
            prompt = f"""You are an AI voice assistant for {business_name}, a {industry} business.

Your primary goal is to: {primary_goal}

Key Instructions:
1. Be professional, friendly, and conversational
2. Keep responses concise (1-2 sentences max) for natural conversation flow
3. Ask ONE question at a time and wait for response
4. If booking appointments, collect: name, phone, preferred date/time, and reason for service
5. For lead qualification, assess: urgency, budget, timeline, and decision-making authority
6. Use the business context below to provide accurate information

Business Context:
{context if context else "No additional context provided. Use general knowledge about the industry."}

Important:
- Always identify yourself as an AI assistant
- Be honest if you don't have information
- Maintain a helpful and empathetic tone
- Speak naturally, as if in a phone conversation
- Ask ONE question at a time
"""
        return prompt

    async def transcribe_audio(self, audio_url: str) -> Optional[str]:
        """
        Transcribe audio using Deepgram
        """
        try:
            if not self.deepgram:
                print("Deepgram not configured")
                return None

            # Download audio from Twilio
            async with httpx.AsyncClient() as client:
                response = await client.get(audio_url)
                audio_data = response.content

            # Deepgram transcription options
            options = PrerecordedOptions(
                model="nova-2",
                smart_format=True,
                language="en-US",
                punctuate=True,
                diarize=False,
            )

            # Transcribe
            response = self.deepgram.listen.rest.v("1").transcribe_file(
                {"buffer": audio_data, "mimetype": "audio/wav"},
                options
            )

            # Extract transcript
            if response.results and response.results.channels:
                transcript = response.results.channels[0].alternatives[0].transcript
                return transcript.strip()

            return None

        except Exception as e:
            print(f"Error transcribing audio: {e}")
            import traceback
            traceback.print_exc()
            return None

    async def generate_llm_response(self, user_input: str) -> str:
        """
        Generate response using Groq LLM
        """
        try:
            if not self.groq_api_key or self.groq_api_key == "your_groq_api_key_here":
                return f"I understand you're asking about: {user_input}. How can I help you further with {self.business_config['business_name']}?"

            # Get relevant context from knowledge base
            context = await self.rag_service.get_context(self.session_id, user_input)

            # Build system prompt with context
            system_prompt = await self.create_system_prompt()

            # Build conversation messages
            messages = [
                {"role": "system", "content": system_prompt}
            ]

            # Add conversation history
            if self.conversation_history:
                messages.extend(self.conversation_history)

            # Add current user message
            messages.append({"role": "user", "content": user_input})

            # Call Groq LLM
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.groq_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": messages,
                        "temperature": 0.7,
                        "max_tokens": 150,  # Keep responses concise for phone
                    },
                    timeout=10.0
                )

                if response.status_code == 200:
                    result = response.json()
                    assistant_message = result["choices"][0]["message"]["content"]

                    # Update conversation history
                    self.conversation_history.append({"role": "user", "content": user_input})
                    self.conversation_history.append({"role": "assistant", "content": assistant_message})

                    # Keep only last 10 messages
                    if len(self.conversation_history) > 10:
                        self.conversation_history = self.conversation_history[-10:]

                    return assistant_message.strip()
                else:
                    print(f"Groq API error: {response.status_code} - {response.text}")
                    return "I apologize, but I'm having trouble processing that. Could you please repeat?"

        except Exception as e:
            print(f"Error generating LLM response: {e}")
            import traceback
            traceback.print_exc()
            return "I apologize, but I'm having trouble processing that. Could you please repeat?"

    def create_greeting_twiml(self, callback_url: str) -> str:
        """
        Create initial TwiML response with greeting
        """
        response = VoiceResponse()

        greeting = f"Hello! Thank you for calling {self.business_config['business_name']}. I'm an A I assistant. How can I help you today?"

        # Add greeting
        gather = Gather(
            input='speech',
            action=callback_url,
            method='POST',
            speech_timeout='auto',
            language='en-US',
            hints='appointment, booking, service, question, inquiry'
        )
        gather.say(greeting, voice='Polly.Joanna')
        response.append(gather)

        # Fallback if no input
        response.say("I didn't hear anything. Please call back when you're ready.", voice='Polly.Joanna')

        # Store greeting in history
        self.conversation_history.append({"role": "assistant", "content": greeting})

        return str(response)

    async def create_response_twiml(self, user_input: str, callback_url: str) -> str:
        """
        Create TwiML response after processing user input
        """
        response = VoiceResponse()

        # Generate AI response
        ai_response = await self.generate_llm_response(user_input)

        # Create gather for next input
        gather = Gather(
            input='speech',
            action=callback_url,
            method='POST',
            speech_timeout='auto',
            language='en-US',
            hints='yes, no, appointment, date, time, name, phone'
        )
        gather.say(ai_response, voice='Polly.Joanna')
        response.append(gather)

        # Fallback if no input
        response.say("I didn't hear a response. Let me ask again.", voice='Polly.Joanna')
        response.redirect(callback_url)

        return str(response)

    def create_goodbye_twiml(self) -> str:
        """
        Create TwiML for ending the call
        """
        response = VoiceResponse()
        response.say(
            f"Thank you for calling {self.business_config['business_name']}. Have a great day!",
            voice='Polly.Joanna'
        )
        response.hangup()
        return str(response)


# Store active sessions
active_sessions: Dict[str, TwilioVoiceService] = {}


def get_or_create_session(call_sid: str, session_id: str, business_config: Dict[str, Any], rag_service: Any) -> TwilioVoiceService:
    """
    Get existing session or create new one
    """
    if call_sid not in active_sessions:
        active_sessions[call_sid] = TwilioVoiceService(session_id, business_config, rag_service)
    return active_sessions[call_sid]


def cleanup_session(call_sid: str):
    """
    Remove session after call ends
    """
    if call_sid in active_sessions:
        del active_sessions[call_sid]
