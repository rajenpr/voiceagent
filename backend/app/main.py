"""
Main FastAPI application for Voice AI Agent SaaS Platform
Powered by Pipecat.ai for low-latency voice interactions
"""

from fastapi import FastAPI, WebSocket, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv

from app.services.voice_pipeline import VoicePipeline
from app.services.rag_service import RAGService
from app.services.twilio_voice_service import get_or_create_session, cleanup_session
from app.services.user_manager import UserManager, AuthToken
from app.services.phone_verification import PhoneVerificationService

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
user_manager = UserManager()
phone_verifier = PhoneVerificationService()


class BusinessConfig(BaseModel):
    """Configuration for business-specific voice agent"""
    business_name: str
    industry: str
    primary_goal: str
    system_instructions: Optional[str] = None
    session_id: Optional[str] = None

    # Customer-configurable behavior
    greeting_message: Optional[str] = None
    tone: Optional[str] = "professional"  # professional, friendly, casual, formal
    response_length: Optional[str] = "concise"  # concise, detailed, brief
    transfer_phone: Optional[str] = None  # Phone to transfer complex calls to
    business_hours: Optional[str] = None  # e.g., "Mon-Fri 9AM-5PM"
    services_offered: Optional[List[str]] = None
    pricing_info: Optional[str] = None
    special_instructions: Optional[str] = None

    # Demo session settings
    is_demo: Optional[bool] = False
    demo_duration_hours: Optional[int] = 24  # Auto-cleanup after X hours


class ConfigTemplate(BaseModel):
    """Pre-built configuration templates for different industries"""
    template_id: str
    name: str
    industry: str
    description: str
    default_config: dict


class UserSignup(BaseModel):
    """User signup request"""
    email: str
    password: str
    phone: Optional[str] = None


class UserLogin(BaseModel):
    """User login request"""
    email: str
    password: str


class GoogleAuthRequest(BaseModel):
    """Google OAuth token"""
    google_token: str
    phone: Optional[str] = None


class PhoneSubmit(BaseModel):
    """Phone number submission"""
    user_id: str
    phone: str


class PhoneVerify(BaseModel):
    """Phone verification code"""
    user_id: str
    code: str


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
# AUTHENTICATION ENDPOINTS (User Management & Phone Verification)
# ============================================================================

@app.post("/api/auth/signup")
async def signup(request: UserSignup):
    """
    User signup with email and password
    Requires phone verification to activate account
    """
    try:
        # Validate email format
        if "@" not in request.email:
            raise HTTPException(status_code=400, detail="Invalid email format")

        # Create user
        user = user_manager.create_user(
            email=request.email,
            password=request.password,
            phone=request.phone,
            auth_method="password"
        )

        # Generate auth token
        auth_token = AuthToken.create_session_token(user.user_id)

        return JSONResponse(
            content={
                "success": True,
                "message": "Account created successfully",
                "user": {
                    "user_id": user.user_id,
                    "email": user.email,
                    "phone": user.phone,
                    "phone_verified": user.phone_verified
                },
                "token": auth_token["token"],
                "expires_at": auth_token["expires_at"],
                "requires_phone_verification": not user.phone_verified
            }
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail="Signup failed")


@app.post("/api/auth/login")
async def login(request: UserLogin):
    """
    User login with email and password
    """
    try:
        # Find user
        user = user_manager.get_user_by_email(request.email)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Verify password
        if not user_manager.verify_password(user, request.password):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Generate auth token
        auth_token = AuthToken.create_session_token(user.user_id)

        return JSONResponse(
            content={
                "success": True,
                "message": "Login successful",
                "user": {
                    "user_id": user.user_id,
                    "email": user.email,
                    "phone": user.phone,
                    "phone_verified": user.phone_verified,
                    "sessions": user.sessions,
                    "subscription_plan": user.subscription_plan
                },
                "token": auth_token["token"],
                "expires_at": auth_token["expires_at"],
                "requires_phone_verification": not user.phone_verified
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")


@app.post("/api/auth/google")
async def google_auth(request: GoogleAuthRequest):
    """
    Authenticate with Google OAuth
    Creates account if doesn't exist
    Still requires phone verification
    """
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests

        # Verify Google token
        try:
            idinfo = id_token.verify_oauth2_token(
                request.google_token,
                requests.Request(),
                os.getenv("GOOGLE_CLIENT_ID")
            )

            google_id = idinfo['sub']
            email = idinfo['email']

        except Exception as e:
            print(f"Google token verification failed: {e}")
            raise HTTPException(status_code=401, detail="Invalid Google token")

        # Check if user exists
        user = user_manager.get_user_by_google_id(google_id)

        if not user:
            # Create new user
            user = user_manager.create_user(
                email=email,
                phone=request.phone,
                auth_method="google",
                google_id=google_id
            )

        # Generate auth token
        auth_token = AuthToken.create_session_token(user.user_id)

        return JSONResponse(
            content={
                "success": True,
                "message": "Google authentication successful",
                "user": {
                    "user_id": user.user_id,
                    "email": user.email,
                    "phone": user.phone,
                    "phone_verified": user.phone_verified,
                    "sessions": user.sessions
                },
                "token": auth_token["token"],
                "expires_at": auth_token["expires_at"],
                "requires_phone_verification": not user.phone_verified
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Google auth error: {e}")
        raise HTTPException(status_code=500, detail="Google authentication failed")


@app.post("/api/auth/phone/submit")
async def submit_phone(request: PhoneSubmit):
    """
    Submit phone number for verification
    Sends 6-digit SMS code
    """
    try:
        # Get user
        user = user_manager.get_user(request.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Update phone number
        user.phone = phone_verifier.format_phone_number(request.phone)

        # Validate phone number
        if not phone_verifier.validate_phone_number(user.phone):
            raise HTTPException(status_code=400, detail="Invalid phone number")

        # Generate verification code
        code = user_manager.generate_verification_code(user)

        # Send SMS
        sent = phone_verifier.send_verification_code(user.phone, code)

        if not sent:
            raise HTTPException(status_code=500, detail="Failed to send verification SMS")

        user_manager.update_user(user)

        return JSONResponse(
            content={
                "success": True,
                "message": f"Verification code sent to {user.phone}",
                "phone": user.phone
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Phone submit error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send verification code")


@app.post("/api/auth/phone/verify")
async def verify_phone(request: PhoneVerify):
    """
    Verify phone number with 6-digit code
    """
    try:
        # Get user
        user = user_manager.get_user(request.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Verify code
        verified = user_manager.verify_phone_code(user, request.code)

        if not verified:
            raise HTTPException(status_code=400, detail="Invalid or expired verification code")

        # Send welcome SMS
        phone_verifier.send_welcome_sms(user.phone)

        return JSONResponse(
            content={
                "success": True,
                "message": "Phone number verified successfully",
                "user": {
                    "user_id": user.user_id,
                    "email": user.email,
                    "phone": user.phone,
                    "phone_verified": user.phone_verified
                }
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Phone verify error: {e}")
        raise HTTPException(status_code=500, detail="Phone verification failed")


@app.get("/api/auth/me/{user_id}")
async def get_current_user(user_id: str):
    """
    Get current user profile and sessions
    """
    try:
        user = user_manager.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get session details
        sessions_details = []
        for session_id in user.sessions:
            config = await rag_service.get_session_config(session_id)
            if config:
                sessions_details.append({
                    "session_id": session_id,
                    "business_name": config.get("business_name"),
                    "industry": config.get("industry"),
                    "documents_count": await rag_service.get_document_count(session_id)
                })

        return JSONResponse(
            content={
                "success": True,
                "user": {
                    "user_id": user.user_id,
                    "email": user.email,
                    "phone": user.phone,
                    "phone_verified": user.phone_verified,
                    "auth_method": user.auth_method,
                    "subscription_plan": user.subscription_plan,
                    "created_at": user.created_at,
                    "sessions": sessions_details
                }
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Get user error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user")


# ============================================================================
# CUSTOMER PORTAL ENDPOINTS (Self-Service Configuration)
# ============================================================================

@app.post("/api/portal/session/create/{user_id}")
async def portal_create_session(user_id: str, config: BusinessConfig):
    """
    Customer creates their own voice AI session
    Links session to their user account
    """
    try:
        # Verify user exists and phone is verified
        user = user_manager.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if not user.phone_verified:
            raise HTTPException(status_code=403, detail="Phone verification required")

        import uuid
        session_id = str(uuid.uuid4())

        # Initialize session with customer's configuration
        config_dict = config.dict()
        config_dict['created_by'] = user_id
        await rag_service.initialize_session(session_id, config_dict)

        # Link session to user
        user_manager.add_session_to_user(user_id, session_id)

        return JSONResponse(
            content={
                "success": True,
                "session_id": session_id,
                "message": f"Voice AI session created for {config.business_name}",
                "config": config_dict,
                "next_steps": [
                    "Upload documents to train your AI (optional)",
                    "Configure your Twilio phone number",
                    "Test your AI agent"
                ]
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Portal create session error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/portal/session/{session_id}/configure/{user_id}")
async def portal_update_configuration(session_id: str, user_id: str, config: BusinessConfig):
    """
    Customer updates their AI agent configuration
    Allows real-time customization of behavior, tone, instructions
    """
    try:
        # Verify user owns this session
        user = user_manager.get_user(user_id)
        if not user or session_id not in user.sessions:
            raise HTTPException(status_code=403, detail="Unauthorized: You don't own this session")

        # Update configuration
        config_dict = config.dict()
        config_dict['updated_by'] = user_id
        await rag_service.update_session_config(session_id, config_dict)

        return JSONResponse(
            content={
                "success": True,
                "session_id": session_id,
                "message": "Configuration updated successfully",
                "config": config_dict
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Portal update config error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/portal/session/{session_id}/upload/{user_id}")
async def portal_upload_documents(
    session_id: str,
    user_id: str,
    files: List[UploadFile] = File(...)
):
    """
    Customer uploads documents to train their AI agent
    Creates isolated RAG knowledge base for this session
    """
    try:
        # Verify user owns this session
        user = user_manager.get_user(user_id)
        if not user or session_id not in user.sessions:
            raise HTTPException(status_code=403, detail="Unauthorized: You don't own this session")

        uploaded_files = []
        upload_dir = os.getenv("UPLOAD_DIRECTORY", "./data/uploads")
        session_dir = os.path.join(upload_dir, session_id)
        os.makedirs(session_dir, exist_ok=True)

        for file in files:
            # Validate file type
            allowed_types = ('.pdf', '.txt', '.docx', '.csv', '.md')
            if not file.filename.endswith(allowed_types):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid file type: {file.filename}. Allowed: PDF, TXT, DOCX, CSV, MD"
                )

            # Check file size (max 10MB per file)
            content = await file.read()
            if len(content) > 10 * 1024 * 1024:
                raise HTTPException(
                    status_code=400,
                    detail=f"File too large: {file.filename}. Max size: 10MB"
                )

            # Save file
            file_path = os.path.join(session_dir, file.filename)
            with open(file_path, "wb") as f:
                f.write(content)

            # Process file for RAG
            await rag_service.process_document(file_path, session_id)

            uploaded_files.append({
                "filename": file.filename,
                "size_kb": round(len(content) / 1024, 2),
                "path": file_path,
            })

        return JSONResponse(
            content={
                "success": True,
                "session_id": session_id,
                "files_uploaded": len(uploaded_files),
                "files": uploaded_files,
                "message": "Documents uploaded and processed successfully",
                "total_documents": await rag_service.get_document_count(session_id)
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Portal upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/portal/session/{session_id}/details/{user_id}")
async def portal_get_session(session_id: str, user_id: str):
    """
    Get detailed information about a specific session
    """
    try:
        # Verify user owns this session
        user = user_manager.get_user(user_id)
        if not user or session_id not in user.sessions:
            raise HTTPException(status_code=403, detail="Unauthorized")

        config = await rag_service.get_session_config(session_id)
        if not config:
            raise HTTPException(status_code=404, detail="Session not found")

        doc_count = await rag_service.get_document_count(session_id)

        return JSONResponse(
            content={
                "success": True,
                "session_id": session_id,
                "configuration": config,
                "documents_uploaded": doc_count,
                "status": "active"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/portal/session/{session_id}/delete/{user_id}")
async def portal_delete_session(session_id: str, user_id: str):
    """
    Customer deletes their session and all associated data
    Completely wipes RAG knowledge base
    """
    try:
        # Verify user owns this session
        user = user_manager.get_user(user_id)
        if not user or session_id not in user.sessions:
            raise HTTPException(status_code=403, detail="Unauthorized")

        # Delete session and all documents
        await rag_service.delete_session(session_id)

        # Remove from user's session list
        user_manager.remove_session_from_user(user_id, session_id)

        return JSONResponse(
            content={
                "success": True,
                "message": "Session and all data deleted successfully",
                "session_id": session_id
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/portal/templates")
async def get_configuration_templates():
    """
    Get pre-built configuration templates for different industries
    Helps customers quick-start their setup
    """
    templates = [
        {
            "template_id": "dental",
            "name": "Dental Office",
            "industry": "Healthcare - Dental",
            "description": "Perfect for dental offices handling appointment booking",
            "default_config": {
                "primary_goal": "Book Appointments",
                "tone": "friendly",
                "greeting_message": "Thank you for calling! How can I help you today?",
                "business_hours": "Monday-Friday 9AM-6PM, Saturday 9AM-2PM",
                "services_offered": [
                    "General Dentistry",
                    "Cosmetic Dentistry",
                    "Emergency Care",
                    "Teeth Whitening"
                ],
                "special_instructions": "Always collect: name, phone, preferred date/time, reason for visit. Mention we accept most insurance plans."
            }
        },
        {
            "template_id": "legal",
            "name": "Law Firm",
            "industry": "Legal Services",
            "description": "Ideal for law firms doing client intake and consultations",
            "default_config": {
                "primary_goal": "Qualify Leads & Schedule Consultations",
                "tone": "professional",
                "greeting_message": "Thank you for calling. How may I assist with your legal matter?",
                "business_hours": "Monday-Friday 8:30AM-5:30PM",
                "services_offered": [
                    "Personal Injury",
                    "Family Law",
                    "Estate Planning",
                    "Business Law"
                ],
                "special_instructions": "Handle sensitive information confidentially. Determine practice area, urgency, and collect basic case details. Mention free initial consultation."
            }
        },
        {
            "template_id": "realestate",
            "name": "Real Estate Agency",
            "industry": "Real Estate",
            "description": "Great for realtors qualifying buyers and scheduling showings",
            "default_config": {
                "primary_goal": "Qualify Buyers/Sellers & Schedule Showings",
                "tone": "enthusiastic",
                "greeting_message": "Hi! Thanks for calling. Are you looking to buy, sell, or rent?",
                "business_hours": "Monday-Sunday 9AM-8PM",
                "services_offered": [
                    "Residential Sales",
                    "Commercial Properties",
                    "Property Management",
                    "Investment Properties"
                ],
                "special_instructions": "Collect: budget range, preferred neighborhoods, bedrooms/bathrooms needed, timeline. Be enthusiastic but not pushy."
            }
        },
        {
            "template_id": "restaurant",
            "name": "Restaurant",
            "industry": "Food & Beverage",
            "description": "Perfect for restaurants taking reservations",
            "default_config": {
                "primary_goal": "Take Reservations",
                "tone": "friendly",
                "greeting_message": "Thank you for calling! Would you like to make a reservation?",
                "business_hours": "Lunch 11AM-3PM, Dinner 5PM-10PM",
                "services_offered": [
                    "Dine-in",
                    "Takeout",
                    "Catering",
                    "Private Events"
                ],
                "special_instructions": "Collect: name, party size, date, time, special requests. Mention dress code if applicable."
            }
        },
        {
            "template_id": "medical",
            "name": "Medical Office",
            "industry": "Healthcare - General",
            "description": "For medical practices scheduling appointments",
            "default_config": {
                "primary_goal": "Schedule Appointments",
                "tone": "professional",
                "greeting_message": "Thank you for calling. How can I help you today?",
                "business_hours": "Monday-Friday 8AM-5PM",
                "services_offered": [
                    "Primary Care",
                    "Urgent Care",
                    "Preventive Care",
                    "Chronic Disease Management"
                ],
                "special_instructions": "Be empathetic. Collect: name, date of birth, insurance, reason for visit. Handle HIPAA-compliant information appropriately."
            }
        },
        {
            "template_id": "custom",
            "name": "Custom Setup",
            "industry": "Other",
            "description": "Start from scratch with complete customization",
            "default_config": {
                "primary_goal": "Assist Customers",
                "tone": "professional",
                "greeting_message": "Hello! How can I help you today?",
                "business_hours": "Monday-Friday 9AM-5PM",
                "services_offered": [],
                "special_instructions": "Customize this section with your specific business rules and instructions."
            }
        }
    ]

    return JSONResponse(
        content={
            "success": True,
            "templates": templates,
            "message": "Select a template to quick-start your configuration"
        }
    )


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
