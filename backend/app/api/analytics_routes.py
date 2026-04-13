from fastapi import APIRouter
from typing import Dict, Any, List
from ..services.analytics_service import get_analytics_summary, get_processing_timeline, get_top_vendors

router = APIRouter()

@router.get("/analytics/summary")
async def get_analytics_summary_endpoint():
    """
    Get overall analytics summary
    """
    try:
        summary = get_analytics_summary()
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analytics summary: {str(e)}")

@router.get("/analytics/timeline")
async def get_analytics_timeline_endpoint():
    """
    Get document processing timeline
    """
    try:
        timeline = get_processing_timeline()
        return timeline
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analytics timeline: {str(e)}")

@router.get("/analytics/vendors")
async def get_analytics_vendors_endpoint():
    """
    Get top vendors from processed documents
    """
    try:
        vendors = get_top_vendors()
        return vendors
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analytics vendors: {str(e)}")