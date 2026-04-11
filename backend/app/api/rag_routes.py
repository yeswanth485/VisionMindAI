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
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")