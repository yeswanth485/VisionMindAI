import uuid
import json
from typing import List, Dict, Any, Optional

class MemorySystem:
    def __init__(self):
        # In-memory storage instead of ChromaDB to avoid DLL issues
        self.sessions = {}
        # Get or create collection for multimodal sessions
        self.collection_name = "multimodal_sessions"
        
    def store_session(self, session_id: str, context: dict, summary: str) -> bool:
        """Store session data in memory"""
        try:
            # Prepare document for storage
            document = json.dumps({
                "session_id": session_id,
                "context": context,
                "summary": summary,
                "timestamp": str(uuid.uuid1().time)  # Simple timestamp
            })
            
            # Store in memory
            self.sessions[session_id] = {
                "document": document,
                "context": context,
                "summary": summary,
                "timestamp": str(uuid.uuid1().time)
            }
            
            return True
        except Exception as e:
            print(f"Error storing session: {e}")
            return False
        
    def retrieve_similar_sessions(self, query_context: dict, n_results: int = 5) -> List[Dict[str, Any]]:
        """Retrieve similar sessions based on context (simplified)"""
        try:
            # Simple retrieval - just return all sessions for now
            sessions = []
            for session_id, session_data in self.sessions.items():
                sessions.append({
                    "session_id": session_id,
                    "data": json.loads(session_data["document"]),
                    "similarity": 0.8  # Mock similarity score
                })
            
            # Return up to n_results
            return sessions[:n_results]
        except Exception as e:
            print(f"Error retrieving similar sessions: {e}")
            return []
        
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a specific session by ID"""
        try:
            if session_id in self.sessions:
                return json.loads(self.sessions[session_id]["document"])
            return None
        except Exception as e:
            print(f"Error retrieving session: {e}")
            return None
        
    def delete_session(self, session_id: str) -> bool:
        """Delete a session from memory"""
        try:
            if session_id in self.sessions:
                del self.sessions[session_id]
                return True
            return False
        except Exception as e:
            print(f"Error deleting session: {e}")
            return False