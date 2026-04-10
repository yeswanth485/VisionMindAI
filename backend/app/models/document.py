from sqlmodel import SQLModel, Field, Column, JSON
from typing import Optional, Dict, Any
from datetime import datetime
import uuid


class Document(SQLModel, table=True):
    __tablename__ = "documents"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    file_url: Optional[str] = None
    raw_text: Optional[str] = None
    doc_type: Optional[str] = None
    structured_json: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    validation: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    insights: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    decision: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    status: str = Field(default="pending")
    created_at: datetime = Field(default_factory=datetime.utcnow)