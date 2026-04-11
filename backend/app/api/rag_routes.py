import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.services.rag_service import search_similar, generate_rag_answer

router = APIRouter()

class ChatRequest(BaseModel):
    query: str
    model: Optional[str] = "document"  # general or document
    docId: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]

@router.post("/chat", response_model=ChatResponse)
async def chat_with_documents(request: ChatRequest):
    """
    RAG Chat endpoint - ask questions about processed documents
    Supports both general assistant and document intelligence modes
    """
    try:
        # Determine search scope based on model selection
        similar_docs = []
        if request.model == "document":
            # Search for similar documents when in document mode, scoped to docId if provided
            similar_docs = await search_similar(request.query, top_k=5, doc_id=request.docId)
        
        # Generate answer using retrieved context
        result = await generate_rag_answer(request.query, similar_docs, request.model)
        
        return ChatResponse(**result)
        
    except Exception as e:
        import traceback
        logging.error(f"Chat Error: {str(e)}")
        logging.error(traceback.format_exc())
        
        # Determine if it's an API error or retrieval error
        error_type = "AI Service Timeout" if "timeout" in str(e).lower() else "Retrieval Failure"
        if "api_key" in str(e).lower():
            error_type = "AI Authentication Error"
            
        raise HTTPException(
            status_code=500, 
            detail=f"{error_type}: {str(e)}"
        )