"""
Main FastAPI application for Voice AI Agent SaaS Platform
Powered by Pipecat.ai for low-latency voice interactions
"""

from fastapi import FastAPI, WebSocket, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

from app.services.voice_pipeline import VoicePipeline
from app.services.rag_service import RAGService
from app.services.twilio_voice_service import get_or_create_session, cleanup_session

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Voice AI Agent API",
    description="Enterprise-grade voice AI with <800ms latency",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
rag_service = RAGService()


class BusinessConfig(BaseModel):
    """Configuration for business-specific voice agent"""
    business_name: str
    industry: str
    primary_goal: str
    system_instructions: Optional[str] = None
    session_id: Optional[str] = None


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Voice AI Agent API",
        "version": "1.0.0",
    }


@app.post("/api/session/create")
async def create_session(config: BusinessConfig):
    """
    Create a new session and configure the voice agent
    """
    try:
        import uuid

        # Generate unique session ID
        session_id = str(uuid.uuid4())

        # Initialize knowledge base for this session
        await rag_service.initialize_session(session_id, config.dict())

        return JSONResponse(
            content={
                "success": True,
                "session_id": session_id,
                "message": f"Session created for {config.business_name}",
            }
        )

    except Exception as e:
        print(f"Error creating session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload/{session_id}")
async def upload_files(
    session_id: str,
    files: List[UploadFile] = File(...),
):
    """
    Upload business documents for RAG knowledge base
    Supports PDF, TXT, and DOCX files
    """
    try:
        uploaded_files = []
        upload_dir = os.getenv("UPLOAD_DIRECTORY", "./data/uploads")
        session_dir = os.path.join(upload_dir, session_id)
        os.makedirs(session_dir, exist_ok=True)

        for file in files:
            # Validate file type
            if not file.filename.endswith(('.pdf', '.txt', '.docx')):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid file type: {file.filename}. Only PDF, TXT, and DOCX are supported."
                )

            # Save file
            file_path = os.path.join(session_dir, file.filename)
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)

            # Process file for RAG
            await rag_service.process_document(file_path, session_id)
            uploaded_files.append({
                "filename": file.filename,
                "size": len(content),
                "path": file_path,
            })

        return JSONResponse(
            content={
                "success": True,
                "files": uploaded_files,
                "session_id": session_id,
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/configure")
async def configure_agent(config: BusinessConfig):
    """
    Configure the voice agent with business-specific settings
    """
    try:
        # Store configuration in session
        session_id = config.session_id or os.urandom(16).hex()

        # Initialize knowledge base for this session
        await rag_service.initialize_session(session_id, config.dict())

        return JSONResponse(
            content={
                "success": True,
                "session_id": session_id,
                "message": f"Agent configured for {config.business_name}",
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/voice/{session_id}")
async def websocket_voice(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time voice interaction
    Uses WebRTC transport for ultra-low latency
    """
    await websocket.accept()

    try:
        # Get session configuration
        config = await rag_service.get_session_config(session_id)

        if not config:
            await websocket.send_json({
                "error": "Session not found. Please configure agent first."
            })
            await websocket.close()
            return

        # Initialize voice pipeline
        pipeline = VoicePipeline(
            session_id=session_id,
            business_config=config,
            rag_service=rag_service,
        )

        # Start the voice interaction
        await pipeline.run(websocket)

    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.send_json({"error": str(e)})
    finally:
        await websocket.close()


@app.get("/api/session/{session_id}/status")
async def get_session_status(session_id: str):
    """
    Get the status and configuration of a session
    """
    try:
        config = await rag_service.get_session_config(session_id)

        if not config:
            raise HTTPException(status_code=404, detail="Session not found")

        return JSONResponse(
            content={
                "success": True,
                "session_id": session_id,
                "config": config,
                "documents_processed": await rag_service.get_document_count(session_id),
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/session/{session_id}")
async def delete_session(session_id: str):
    """
    Delete a session and its associated data
    """
    try:
        await rag_service.delete_session(session_id)

        return JSONResponse(
            content={
                "success": True,
                "message": f"Session {session_id} deleted",
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ADMIN ENDPOINTS (Multi-Tenant Client Management)
# ============================================================================

@app.get("/api/admin/clients")
async def list_all_clients():
    """
    List all provisioned clients/sessions
    Returns summary of all active sessions with business info
    """
    try:
        sessions = await rag_service.get_all_sessions()

        return JSONResponse(
            content={
                "success": True,
                "total_clients": len(sessions),
                "clients": sessions,
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/client/{session_id}/stats")
async def get_client_stats(session_id: str):
    """
    Get detailed statistics for a specific client
    Including call volume, document count, configuration
    """
    try:
        config = await rag_service.get_session_config(session_id)

        if not config:
            raise HTTPException(status_code=404, detail="Client not found")

        # Get document count
        doc_count = await rag_service.get_document_count(session_id)

        # Get call stats from Twilio voice service
        from app.services.twilio_voice_service import active_sessions
        call_sessions = [k for k, v in active_sessions.items() if v.session_id == session_id]

        return JSONResponse(
            content={
                "success": True,
                "session_id": session_id,
                "business_name": config.get("business_name"),
                "industry": config.get("industry"),
                "primary_goal": config.get("primary_goal"),
                "documents_uploaded": doc_count,
                "active_calls": len(call_sessions),
                "configuration": config,
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/admin/client/{session_id}/config")
async def update_client_config(session_id: str, config: BusinessConfig):
    """
    Update configuration for an existing client
    Allows changing business name, industry, goals, etc.
    """
    try:
        # Verify session exists
        existing_config = await rag_service.get_session_config(session_id)

        if not existing_config:
            raise HTTPException(status_code=404, detail="Client not found")

        # Update configuration
        updated_config = config.dict()
        updated_config['session_id'] = session_id
        await rag_service.update_session_config(session_id, updated_config)

        return JSONResponse(
            content={
                "success": True,
                "session_id": session_id,
                "message": f"Configuration updated for {config.business_name}",
                "config": updated_config,
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/stats/overview")
async def get_platform_overview():
    """
    Get platform-wide statistics for SaaS dashboard
    Total clients, total calls, revenue metrics, etc.
    """
    try:
        sessions = await rag_service.get_all_sessions()
        from app.services.twilio_voice_service import active_sessions

        # Calculate metrics
        total_clients = len(sessions)
        active_calls = len(active_sessions)

        # Revenue calculations (based on your pricing)
        # Assume clients are on $99 or $299 plans
        estimated_monthly_revenue = total_clients * 199  # Average of $99 and $299

        # Cost calculations
        monthly_phone_cost = total_clients * 1.15  # $1.15 per Twilio number
        # Call costs calculated per-call, not monthly fixed

        return JSONResponse(
            content={
                "success": True,
                "platform_stats": {
                    "total_clients": total_clients,
                    "active_calls": active_calls,
                    "estimated_monthly_revenue": f"${estimated_monthly_revenue:,.2f}",
                    "monthly_fixed_costs": f"${monthly_phone_cost:.2f}",
                    "estimated_profit_margin": "~90%",
                },
                "recent_clients": sessions[:10]  # Last 10 clients
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# TWILIO VOICE ENDPOINTS (Phone-based Voice AI)
# ============================================================================

@app.post("/api/twilio/voice/incoming/{session_id}")
async def twilio_incoming_call(request: Request, session_id: str):
    """
    Twilio webhook for incoming calls
    Returns TwiML to handle the call
    """
    try:
        # Get form data from Twilio
        form_data = await request.form()
        call_sid = form_data.get("CallSid")

        # Get session configuration
        config = await rag_service.get_session_config(session_id)
        if not config:
            # Return error TwiML
            from twilio.twiml.voice_response import VoiceResponse
            response = VoiceResponse()
            response.say("Sorry, this number is not configured. Please contact support.")
            response.hangup()
            return Response(content=str(response), media_type="application/xml")

        # Create or get voice service for this call
        voice_service = get_or_create_session(call_sid, session_id, config, rag_service)

        # Generate callback URL for gathering speech
        base_url = os.getenv("BASE_URL", "https://your-domain.com")
        callback_url = f"{base_url}/api/twilio/voice/gather/{session_id}/{call_sid}"

        # Create greeting TwiML
        twiml = voice_service.create_greeting_twiml(callback_url)

        return Response(content=twiml, media_type="application/xml")

    except Exception as e:
        print(f"Error handling incoming call: {e}")
        import traceback
        traceback.print_exc()

        from twilio.twiml.voice_response import VoiceResponse
        response = VoiceResponse()
        response.say("Sorry, we're experiencing technical difficulties. Please try again later.")
        response.hangup()
        return Response(content=str(response), media_type="application/xml")


@app.post("/api/twilio/voice/gather/{session_id}/{call_sid}")
async def twilio_gather_speech(request: Request, session_id: str, call_sid: str):
    """
    Twilio webhook for gathering user speech
    Processes speech and returns AI response
    """
    try:
        # Get form data from Twilio
        form_data = await request.form()
        speech_result = form_data.get("SpeechResult", "")

        # Check if user wants to end call
        if any(phrase in speech_result.lower() for phrase in ["goodbye", "bye", "hang up", "end call"]):
            voice_service = get_or_create_session(call_sid, session_id, {}, rag_service)
            twiml = voice_service.create_goodbye_twiml()
            cleanup_session(call_sid)
            return Response(content=twiml, media_type="application/xml")

        # Get session configuration
        config = await rag_service.get_session_config(session_id)
        if not config:
            from twilio.twiml.voice_response import VoiceResponse
            response = VoiceResponse()
            response.say("Session expired. Please call back.")
            response.hangup()
            cleanup_session(call_sid)
            return Response(content=str(response), media_type="application/xml")

        # Get voice service for this call
        voice_service = get_or_create_session(call_sid, session_id, config, rag_service)

        # Generate callback URL
        base_url = os.getenv("BASE_URL", "https://your-domain.com")
        callback_url = f"{base_url}/api/twilio/voice/gather/{session_id}/{call_sid}"

        # Create response TwiML
        twiml = await voice_service.create_response_twiml(speech_result, callback_url)

        return Response(content=twiml, media_type="application/xml")

    except Exception as e:
        print(f"Error processing speech: {e}")
        import traceback
        traceback.print_exc()

        from twilio.twiml.voice_response import VoiceResponse
        response = VoiceResponse()
        response.say("Sorry, I had trouble understanding that. Let me try again.")
        response.redirect(f"/api/twilio/voice/gather/{session_id}/{call_sid}")
        return Response(content=str(response), media_type="application/xml")


@app.post("/api/twilio/voice/status")
async def twilio_call_status(request: Request):
    """
    Twilio webhook for call status updates
    Cleanup sessions when calls end
    """
    try:
        form_data = await request.form()
        call_sid = form_data.get("CallSid")
        call_status = form_data.get("CallStatus")

        print(f"Call {call_sid} status: {call_status}")

        # Cleanup session when call ends
        if call_status in ["completed", "failed", "busy", "no-answer"]:
            cleanup_session(call_sid)

        return JSONResponse(content={"success": True})

    except Exception as e:
        print(f"Error handling call status: {e}")
        return JSONResponse(content={"success": False, "error": str(e)})


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=os.getenv("DEBUG", "True") == "True",
    )
