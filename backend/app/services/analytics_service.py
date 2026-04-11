from sqlmodel import Session, select, func
from typing import Dict, Any, List
from app.core.database import get_engine
from app.models.document import Document
from datetime import datetime, timedelta
import time
from functools import wraps

_CACHE = {}
_CACHE_TTL = 300  # 5 minutes in seconds

def simple_cache(func):
    """A lightweight TTL cache to speed up analytics endpoints"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        cache_key = f"{func.__name__}_{args}_{kwargs}"
        now = time.time()
        
        if cache_key in _CACHE:
            cached_result, timestamp = _CACHE[cache_key]
            if now - timestamp < _CACHE_TTL:
                return cached_result
                
        result = func(*args, **kwargs)
        _CACHE[cache_key] = (result, now)
        return result
    return wrapper

@simple_cache
def get_document_stats() -> Dict[str, Any]:
    """Get overall document statistics"""
    with Session(get_engine()) as session:
        # Total documents
        total_docs = session.exec(select(func.count(Document.id))).one()
        
        # Documents by type
        type_query = select(Document.doc_type, func.count(Document.id)).group_by(Document.doc_type)
        type_results = session.exec(type_query).all()
        by_type = {doc_type: count for doc_type, count in type_results if doc_type}
        
        # Documents by status
        status_query = select(Document.status, func.count(Document.id)).group_by(Document.status)
        status_results = session.exec(status_query).all()
        by_status = {status: count for status, count in status_results}
        
        result = {
            "total_documents": total_docs,
            "by_type": by_type,
            "by_status": by_status
        }
        
        return result


@simple_cache
def get_risk_distribution() -> Dict[str, int]:
    """Get distribution of risk levels"""
    with Session(get_engine()) as session:
        # Extract risk level from decision field
        # Assuming decision is a JSON field with risk_level key
        docs = session.exec(select(Document.decision)).all()
        
        risk_counts = {"low": 0, "medium": 0, "high": 0}
        
        for decision in docs:
            if decision and isinstance(decision, dict):
                risk_level = decision.get("risk_level", "low").lower()
                if risk_level in risk_counts:
                    risk_counts[risk_level] += 1
                else:
                    risk_counts["low"] += 1  # Default to low
            else:
                risk_counts["low"] += 1  # Default for missing/invalid data
        
        result = risk_counts
        return result


@simple_cache
def get_processing_timeline(days: int = 14) -> List[Dict[str, Any]]:
    """Get documents processed per day for the last N days"""
    with Session(get_engine()) as session:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Query documents grouped by date
        query = select(
            func.date(Document.created_at).label('date'),
            func.count(Document.id).label('count')
        ).where(
            Document.created_at >= start_date
        ).group_by(
            func.date(Document.created_at)
        ).order_by(
            func.date(Document.created_at)
        )
        
        results = session.exec(query).all()
        
        # Format as list of dicts
        timeline = []
        for date, count in results:
            timeline.append({
                "date": date.isoformat() if date else None,
                "count": count
            })
        
        return timeline


@simple_cache
def get_top_vendors(limit: int = 10) -> List[Dict[str, Any]]:
    """Get most frequent vendors from structured_json"""
    with Session(get_engine()) as session:
        # Get all documents with structured_json
        docs = session.exec(select(Document.structured_json, Document.doc_type)).all()
        
        # Count vendors
        vendor_counts = {}
        
        for structured_json, doc_type in docs:
            if structured_json and isinstance(structured_json, dict):
                # Extract vendor name based on document type
                vendor_name = None
                
                if doc_type == "invoice":
                    vendor_name = structured_json.get("vendor_name") or structured_json.get("supplier_name")
                elif doc_type == "receipt":
                    vendor_name = structured_json.get("merchant_name") or structured_json.get("store_name")
                elif doc_type == "id":
                    vendor_name = structured_json.get("issuing_authority")
                
                if vendor_name and isinstance(vendor_name, str) and vendor_name.strip():
                    vendor_name = vendor_name.strip()
                    vendor_counts[vendor_name] = vendor_counts.get(vendor_name, 0) + 1
        
        # Sort by count and return top vendors
        sorted_vendors = sorted(vendor_counts.items(), key=lambda x: x[1], reverse=True)
        top_vendors = []
        
        for vendor, count in sorted_vendors[:limit]:
            top_vendors.append({
                "vendor": vendor,
                "count": count
            })
        
        return top_vendors


@simple_cache
def get_analytics_summary() -> Dict[str, Any]:
    """Get complete analytics summary"""
    # Get document stats once to avoid multiple calls
    doc_stats = get_document_stats()
    
    result = {
        "total_documents": doc_stats["total_documents"],
        "total_invoices": doc_stats["by_type"].get("invoice", 0),
        "total_amount_processed": _get_total_amount(),
        "risk_distribution": get_risk_distribution(),
        "document_type_distribution": [
            {"type": doc_type, "count": count} 
            for doc_type, count in doc_stats["by_type"].items()
        ]
    }
    
    return result


@simple_cache
def _get_total_amount() -> float:
    """Helper to calculate total amount processed"""
    with Session(get_engine()) as session:
        docs = session.exec(select(Document.structured_json)).all()
        
        total = 0.0
        
        for structured_json in docs:
            if structured_json and isinstance(structured_json, dict):
                # Try to extract amount from various possible fields
                amount_fields = ["total_amount", "amount", "total", "sum"]
                
                for field in amount_fields:
                    if field in structured_json:
                        try:
                            amount = float(structured_json[field])
                            total += amount
                            break  # Found amount, no need to check other fields
                        except (ValueError, TypeError):
                            continue  # Try next field
        
        return total