from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import uuid


class Document(SQLModel, table=True):
    __tablename__ = "documents"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    file_url: Optional[str] = None
    raw_text: Optional[str] = None
    doc_type: Optional[str] = None
    structured_json: Optional[dict] = Field(default=None, sa_column_kwargs={"type": "JSON"})
    validation: Optional[dict] = Field(default=None, sa_column_kwargs={"type": "JSON"})
    insights: Optional[dict] = Field(default=None, sa_column_kwargs={"type": "JSON"})
    decision: Optional[dict] = Field(default=None, sa_column_kwargs={"type": "JSON"})
    status: str = Field(default="pending")
    created_at: datetime = Field(default_factory=datetime.utcnow)