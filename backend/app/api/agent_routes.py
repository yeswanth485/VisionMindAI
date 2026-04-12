from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, Optional
from sqlmodel import Session, select
import uuid

from app.models.document import Document
from app.core.database import get_engine
from app.services.agent_planner import AgentPlanner

router = APIRouter(prefix="/agent", tags=["agent"])
planner = AgentPlanner()

@router.post("/execute")
async def execute_agent_goal(
    goal: str = Body(..., embed=True),
    document_id: Optional[str] = Body(None, embed=True)
):
    """
    Execute an AI agent goal on a specific document context or general context
    """
    try:
        context = {}
        
        # If document_id provided, fetch it for context
        if document_id:
            try:
                doc_uuid = uuid.UUID(document_id)
                with Session(get_engine()) as session:
                    document = session.get(Document, doc_uuid)
                    if not document:
                        raise HTTPException(status_code=404, detail="Document context not found")
                    
                    # Build context from document
                    context = {
                        "id": str(document.id),
                        "doc_type": document.doc_type,
                        "raw_text": document.raw_text[:5000] if document.raw_text else "",
                        "structured_data": document.structured_json,
                        "insights": document.insights
                    }
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid document ID format")

        # Fallback to general intelligence if no context
        if not context:
            context = {"mode": "general_intelligence", "status": "no_document_context"}

        # 1. Generate Plan
        plan = planner.generate_plan(goal, context)
        
        # 2. Execute Plan (In a real system, some steps might be backgrounded)
        execution_result = planner.execute_plan(plan, context)
        
        # 3. If we have a document, update its agent status in DB
        if document_id and "doc_uuid" in locals():
            with Session(get_engine()) as session:
                document = session.get(Document, doc_uuid)
                if document:
                    document.agent_plan = execution_result.get("plan")
                    document.actions_taken = execution_result.get("actions_executed")
                    session.add(document)
                    session.commit()

        return execution_result

    except Exception as e:
        print(f"Agent execution error: {e}")
        raise HTTPException(status_code=500, detail=f"Agent failed to execute: {str(e)}")

@router.get("/status/{document_id}")
async def get_agent_status(document_id: str):
    """Get the current agent status for a document"""
    try:
        doc_uuid = uuid.UUID(document_id)
        with Session(get_engine()) as session:
            document = session.get(Document, doc_uuid)
            if not document:
                raise HTTPException(status_code=404, detail="Document not found")
            
            return {
                "document_id": str(document.id),
                "agent_plan": document.agent_plan,
                "actions_executed": document.actions_taken,
                "status": document.status
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
