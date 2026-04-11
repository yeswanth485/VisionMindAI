from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from typing import Optional
import shutil
from app.services.multimodal_pipeline import MultimodalPipeline

router = APIRouter(prefix="/multimodal", tags=["multimodal"])

# Initialize pipeline
pipeline = MultimodalPipeline()

@router.post("/process")
async def process_multimodal_input(
    file: UploadFile = File(...),
    user_goal: Optional[str] = Form(None)
):
    """Process multimodal input (video, audio, document)"""
    try:
        # Read file content
        content = await file.read()
        
        # Process through pipeline
        result = await pipeline.process_input(
            file_content=content,
            filename=file.filename or "",
            user_goal=user_goal or ""
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@router.get("/health")
async def multimodal_health():
    """Health check for multimodal service"""
    return {"status": "healthy", "service": "multimodal_pipeline"}