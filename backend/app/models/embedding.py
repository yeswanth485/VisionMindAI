import uuid
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional


class DocumentEmbedding(SQLModel, table=True):
    __tablename__ = "embeddings"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    document_id: uuid.UUID = Field(foreign_key="documents.id")
    chroma_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)