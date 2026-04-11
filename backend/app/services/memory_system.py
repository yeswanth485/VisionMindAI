import uuid
import json
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings
from app.core.config import settings

class MemorySystem:
    def __init__(self):
        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(path="./chroma_db")
        # Get or create collection for multimodal sessions
        self.collection = self.client.get_or_create_collection(
            name="multimodal_sessions",
            metadata={"hnsw:space": "cosine"}
        )
    
    def store_session(self, session_id: str, context: dict, summary: str) -> bool:
        """Store session data in ChromaDB memory"""
        try:
            # Prepare document for storage
            document = json.dumps({
                "session_id": session_id,
                "context": context,
                "summary": summary,
                "timestamp": str(uuid.uuid1().time)  # Simple timestamp
            })
            
            # Generate embedding (in practice, would use embedding model)
            # For now, we'll use a simple hash-based approach for demo
            # In production, you'd use sentence-transformers or similar
            embedding = [float(hash(str(context + summary + str(i)))) / 1e10 for i in range(10)]
            
            # Store in ChromaDB
            self.collection.add(
                embeddings=[embedding],
                documents=[document],
                metadatas=[{"session_id": session_id, "type": "multimodal_session"}],
                ids=[session_id]
            )
            
            return True
        except Exception as e:
            print(f"Error storing session: {e}")
            return False
    
    def retrieve_similar_sessions(self, query_context: dict, n_results: int = 5) -> List[Dict[str, Any]]:
        """Retrieve similar sessions based on context"""
        try:
            # Generate query embedding (same approach as storage)
            query_embedding = [float(hash(str(query_context + str(i)))) / 1e10 for i in range(10)]
            
            # Query ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results
            )
            
            # Format results
            sessions = []
            if results['documents'] and results['documents'][0]:
                for i, doc in enumerate(results['documents'][0]):
                    try:
                        session_data = json.loads(doc)
                        sessions.append({
                            "session_id": results['ids'][0][i],
                            "data": session_data,
                            "similarity": results['distances'][0][i] if results['distances'] else 0.0
                        })
                    except json.JSONDecodeError:
                        continue
            
            return sessions
        except Exception as e:
            print(f"Error retrieving similar sessions: {e}")
            return []
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a specific session by ID"""
        try:
            results = self.collection.get(ids=[session_id])
            if results['documents'] and results['documents'][0]:
                return json.loads(results['documents'][0])
            return None
        except Exception as e:
            print(f"Error retrieving session: {e}")
            return None
    
    def delete_session(self, session_id: str) -> bool:
        """Delete a session from memory"""
        try:
            self.collection.delete(ids=[session_id])
            return True
        except Exception as e:
            print(f"Error deleting session: {e}")
            return False