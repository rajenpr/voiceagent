"""
Main FastAPI application for Voice AI Agent SaaS Platform
Powered by Pipecat.ai for low-latency voice interactions
"""

from fastapi import FastAPI, WebSocket, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

from app.services.voice_pipeline import VoicePipeline
from app.services.rag_service import RAGService

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
