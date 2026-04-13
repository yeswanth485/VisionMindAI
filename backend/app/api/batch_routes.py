from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlmodel import Session
from typing import List
import uuid
import aiofiles
import os

from ..models.document import Document
from ..services.pipeline import DocumentPipeline
from ..core.database import get_engine

router = APIRouter()
pipeline = DocumentPipeline()

# Ensure upload directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/batch/upload")
async def batch_upload_documents(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...)
):
    """
    Handle batch document upload and trigger processing pipeline for each file
    """
    # Validate file type
    allowed_extensions = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".json"}
    uploaded_docs = []
    
    try:
        # Process each file
        for file in files:
            # Validate file type
            file_extension = os.path.splitext(file.filename)[1].lower()
            
            if file_extension not in allowed_extensions:
                continue  # Skip invalid files instead of failing entire batch
            
            # Generate unique document ID
            doc_id = uuid.uuid4()
            
            # Save file to disk
            file_path = os.path.join(UPLOAD_DIR, f"{doc_id}_{file.filename}")
            
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
            
            uploaded_docs.append({
                "document_id": str(doc_id),
                "filename": file.filename
            })
        
        return JSONResponse(
            status_code=202,
            content={
                "message": f"Successfully uploaded {len(uploaded_docs)} documents. Processing started.",
                "uploaded": len(uploaded_docs),
                "document_ids": [doc["document_id"] for doc in uploaded_docs]
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch upload failed: {str(e)}")

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