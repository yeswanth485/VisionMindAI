from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.rag_service import search_similar, generate_rag_answer

router = APIRouter()

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]

@router.post("/chat", response_model=ChatResponse)
async def chat_with_documents(request: ChatRequest):
    """
    RAG Chat endpoint - ask questions about processed documents
    """
    try:
        # Search for similar documents
        similar_docs = await search_similar(request.query, top_k=5)
        
        if not similar_docs:
            return ChatResponse(
                answer="I couldn't find any relevant documents to answer your question. Please upload some documents first.",
                sources=[]
            )
        
        # Generate answer using retrieved context
        result = await generate_rag_answer(request.query, similar_docs)
        
        return ChatResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")