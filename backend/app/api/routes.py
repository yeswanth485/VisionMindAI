from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlmodel import Session, select
from typing import Dict, Any, List
import uuid
import aiofiles
import os

from app.models.document import Document
from app.services.pipeline import DocumentPipeline
from app.core.database import get_engine

router = APIRouter()
pipeline = DocumentPipeline()

# Ensure upload directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Handle document upload and trigger processing pipeline
    """
    # Validate file type
    allowed_extensions = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".json"}
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    # Generate unique document ID
    doc_id = uuid.uuid4()
    
    # Save file to disk
    file_path = os.path.join(UPLOAD_DIR, f"{doc_id}_{file.filename}")
    
    try:
        # Read file content
        content = await file.read()
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Create document record in database
        with Session(get_engine()) as session:
            document = Document(
                id=doc_id,
                file_url=f"/{file_path}",
                status="processing"
            )
            session.add(document)
            session.commit()
            session.refresh(document)
        
        # Process document in background
        background_tasks.add_task(process_document_background, content, file.filename, doc_id)
        
        return JSONResponse(
            status_code=202,
            content={
                "message": "Document uploaded successfully. Processing started.",
                "document_id": str(doc_id),
                "status": "processing"
            }
        )
        
    except Exception as e:
        # Clean up file if database operation fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

async def process_document_background(file_content: bytes, filename: str, doc_id: uuid.UUID):
    """
    Background task to process document through the AI pipeline
    """
    try:
        # Process document through pipeline
        result = await pipeline.process_document(file_content, filename, doc_id)
        
        # Update database with results
        with Session(get_engine()) as session:
            document = session.get(Document, doc_id)
            if document:
                document.file_url = result.get("file_url")
                document.raw_text = result.get("raw_text")
                document.doc_type = result.get("doc_type")
                document.structured_json = result.get("structured_json")
                document.validation = result.get("validation")
                document.insights = result.get("insights")
                document.decision = result.get("decision")
                document.status = result.get("status", "completed")
                session.add(document)
                session.commit()
                
    except Exception as e:
        # Update document status to failed
        with Session(get_engine()) as session:
            document = session.get(Document, doc_id)
            if document:
                document.status = "failed"
                document.structured_json = {"error": str(e)}
                session.add(document)
                session.commit()

@router.get("/document/{document_id}")
async def get_document(document_id: uuid.UUID):
    """
    Retrieve document status and results by ID
    """
    with Session(get_engine()) as session:
        document = session.get(Document, document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {
            "id": str(document.id),
            "file_url": document.file_url,
            "raw_text": document.raw_text,
            "doc_type": document.doc_type,
            "structured_json": document.structured_json,
            "validation": document.validation,
            "insights": document.insights,
            "decision": document.decision,
            "status": document.status,
            "created_at": document.created_at.isoformat() if document.created_at else None
        }

@router.get("/documents")
async def list_documents() -> List[Dict[str, Any]]:
    """
    Retrieve all processed documents ordered by creation date
    """
    try:
        with Session(get_engine()) as session:
            # Lean query: only select columns used in the list view
            statement = (
                select(Document.id, Document.doc_type, Document.status, Document.created_at)
                .order_by(Document.created_at.desc())
            )
            documents = session.exec(statement).all()
            
            result = []
            for doc_id, doc_type, status, created_at in documents:
                try:
                    created_at_str = None
                    if created_at:
                        if hasattr(created_at, 'isoformat'):
                            created_at_str = created_at.isoformat()
                        else:
                            created_at_str = str(created_at)
                    
                    result.append({
                        "id": str(doc_id),
                        "doc_type": doc_type,
                        "status": status,
                        "created_at": created_at_str
                    })
                except Exception as e:
                    print(f"Error serializing document {doc_id}: {e}")
                    continue
            
            return result
    except Exception as e:
        print(f"Global error in list_documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/debug-ping")
async def debug_ping():
    return {"status": "ok", "version": "1.0.1_bugfix"}