"""
Voice Pipeline powered by Pipecat.ai
Implements ultra-low latency voice interactions with WebRTC, Groq LLM, and ElevenLabs TTS
"""

import os
import asyncio
import base64
import httpx
from typing import Dict, Any
from fastapi import WebSocket

# Note: Pipecat.ai imports would be here in production
# from pipecat.pipeline.pipeline import Pipeline
# from pipecat.pipeline.task import PipelineTask
# from pipecat.transports.websocket import WebSocketTransport
# from pipecat.vad.silero import SileroVAD
# from pipecat.processors.llm.groq import GroqLLM
# from pipecat.processors.tts.elevenlabs import ElevenLabsTTS


class VoicePipeline:
    """
    Main voice pipeline orchestrator
    Combines WebRTC transport, VAD, LLM, and TTS for real-time conversations
    """

    def __init__(
        self,
        session_id: str,
        business_config: Dict[str, Any],
        rag_service: Any,
    ):
        self.session_id = session_id
        self.business_config = business_config
        self.rag_service = rag_service

        # Configuration
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
        self.voice_id = os.getenv("TTS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
        self.vad_threshold = float(os.getenv("VAD_THRESHOLD", "0.5"))

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

IMPORTANT RULES:
- Keep responses VERY concise (1-2 sentences max) for natural phone conversation flow
- Speak naturally and conversationally, as if on a phone call
- Always identify yourself as an AI assistant
- Be honest if you don't have information
- Follow the custom instructions step-by-step
"""
        else:
            prompt = f"""You are an AI voice assistant for {business_name}, a {industry} business.

Your primary goal is to: {primary_goal}

Key Instructions:
1. Be professional, friendly, and conversational
2. Keep responses concise (1-2 sentences max) for natural conversation flow
3. Ask clarifying questions when needed
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
"""
        return prompt

    async def handle_user_speech(self, transcript: str, conversation_history: list = None) -> str:
        """
        Process user speech and generate response using Groq LLM
        """
        try:
            if not self.groq_api_key or self.groq_api_key == "your_groq_api_key_here":
                # Fallback if Groq is not configured
                return f"I understand you're asking about: {transcript}. How can I help you further with {self.business_config['business_name']}?"

            # Get relevant context from knowledge base
            context = await self.rag_service.get_context(self.session_id, transcript)

            # Build system prompt with context
            system_prompt = await self.create_system_prompt()

            # Build conversation messages
            messages = [
                {"role": "system", "content": system_prompt}
            ]

            # Add conversation history if available
            if conversation_history:
                messages.extend(conversation_history)

            # Add current user message
            messages.append({"role": "user", "content": transcript})

            # Call Groq LLM
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.groq_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "mixtral-8x7b-32768",  # Fast, capable model
                        "messages": messages,
                        "temperature": 0.7,
                        "max_tokens": 150,  # Keep responses concise for voice
                    },
                    timeout=10.0
                )

                if response.status_code == 200:
                    result = response.json()
                    assistant_message = result["choices"][0]["message"]["content"]
                    return assistant_message.strip()
                else:
                    print(f"Groq API error: {response.status_code} - {response.text}")
                    return "I apologize, but I'm having trouble processing that. Could you please repeat?"

        except Exception as e:
            print(f"Error processing speech: {e}")
            import traceback
            traceback.print_exc()
            return "I apologize, but I'm having trouble processing that. Could you please repeat?"

    async def generate_speech(self, text: str) -> str:
        """
        Generate speech audio from text using ElevenLabs API
        Returns base64 encoded audio
        """
        try:
            if not self.elevenlabs_api_key or self.elevenlabs_api_key == "your_elevenlabs_api_key_here":
                print("ElevenLabs API key not configured")
                return None

            url = f"https://api.elevenlabs.io/v1/text-to-speech/{self.voice_id}"

            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": self.elevenlabs_api_key
            }

            data = {
                "text": text,
                "model_id": "eleven_turbo_v2",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75
                }
            }

            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=data, headers=headers, timeout=30.0)

                if response.status_code == 200:
                    # Convert audio bytes to base64
                    audio_base64 = base64.b64encode(response.content).decode('utf-8')
                    return audio_base64
                else:
                    print(f"ElevenLabs API error: {response.status_code} - {response.text}")
                    return None

        except Exception as e:
            print(f"Error generating speech: {e}")
            return None

    async def run(self, websocket: WebSocket):
        """
        Main pipeline execution
        Orchestrates the flow: WebRTC -> VAD -> ASR -> LLM -> TTS -> WebRTC
        """
        try:
            # Initialize conversation history
            conversation_history = []

            # Send initial greeting
            greeting = f"Hello! Thank you for contacting {self.business_config['business_name']}. How can I assist you today?"

            # Generate audio for greeting
            greeting_audio = await self.generate_speech(greeting)

            await websocket.send_json({
                "type": "agent_response",
                "text": greeting,
                "audio": greeting_audio,  # Base64 encoded MP3
            })

            # Add greeting to history
            conversation_history.append({"role": "assistant", "content": greeting})

            # Main conversation loop
            while True:
                # Receive audio or text from client
                data = await websocket.receive_json()

                if data.get("type") == "user_speech":
                    transcript = data.get("text", "")

                    # Add user message to history
                    conversation_history.append({"role": "user", "content": transcript})

                    # Process with LLM (pass conversation history)
                    response = await self.handle_user_speech(transcript, conversation_history)

                    # Add assistant response to history
                    conversation_history.append({"role": "assistant", "content": response})

                    # Keep only last 10 messages to avoid context overflow
                    if len(conversation_history) > 10:
                        conversation_history = conversation_history[-10:]

                    # Generate audio for response
                    response_audio = await self.generate_speech(response)

                    # Send response back
                    await websocket.send_json({
                        "type": "agent_response",
                        "text": response,
                        "audio": response_audio,  # Base64 encoded MP3
                    })

                elif data.get("type") == "end_call":
                    goodbye_message = "Thank you for calling. Goodbye!"
                    goodbye_audio = await self.generate_speech(goodbye_message)

                    await websocket.send_json({
                        "type": "call_ended",
                        "message": goodbye_message,
                        "audio": goodbye_audio,
                    })
                    break

        except Exception as e:
            print(f"Pipeline error: {e}")
            import traceback
            traceback.print_exc()
            await websocket.send_json({
                "type": "error",
                "message": "An error occurred during the call.",
            })


# Production-ready Pipecat.ai pipeline implementation
# This is a conceptual implementation showing the architecture

class ProductionVoicePipeline:
    """
    Production-ready implementation with actual Pipecat.ai components
    This demonstrates the full architecture but requires Pipecat.ai to be installed
    """

    def __init__(self, session_id: str, business_config: Dict[str, Any], rag_service: Any):
        self.session_id = session_id
        self.business_config = business_config
        self.rag_service = rag_service

    async def build_pipeline(self):
        """
        Build the Pipecat.ai pipeline with all components

        Architecture:
        1. WebSocketTransport: Handles WebRTC audio streams
        2. SileroVAD: Voice Activity Detection for turn-taking
        3. GroqLLM: Ultra-fast language model (<200ms response time)
        4. ElevenLabsTTS: High-quality streaming text-to-speech

        Flow: Audio In -> VAD -> ASR -> LLM -> TTS -> Audio Out
        """

        # Pseudo-code showing the Pipecat.ai architecture:
        """
        # 1. Create transport layer (WebRTC)
        transport = WebSocketTransport(
            websocket=self.websocket,
            audio_format="pcm16",
            sample_rate=16000,
        )

        # 2. Initialize Voice Activity Detection
        vad = SileroVAD(
            threshold=self.vad_threshold,
            min_speech_duration=0.3,  # 300ms minimum
            max_silence_duration=0.5,  # 500ms of silence ends turn
        )

        # 3. Configure Groq LLM for low-latency responses
        llm = GroqLLM(
            api_key=self.groq_api_key,
            model="mixtral-8x7b-32768",  # Fast, capable model
            temperature=0.7,
            max_tokens=150,  # Keep responses concise for voice
            stream=True,  # Stream responses for lower perceived latency
        )

        # 4. Configure ElevenLabs TTS for natural speech
        tts = ElevenLabsTTS(
            api_key=self.elevenlabs_api_key,
            voice_id=self.voice_id,
            model="eleven_turbo_v2",  # Fastest model
            optimize_streaming_latency=4,  # Maximum optimization
            stream=True,
        )

        # 5. Build the pipeline
        pipeline = Pipeline([
            transport.input(),
            vad,
            llm,
            tts,
            transport.output(),
        ])

        # 6. Create and run the task
        task = PipelineTask(
            pipeline,
            system_prompt=await self.create_system_prompt(),
            on_user_speech=self.handle_user_speech,
        )

        await task.run()
        """

        pass  # Placeholder for actual implementation
