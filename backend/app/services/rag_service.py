import uuid
from openai import AsyncOpenAI
import chromadb
from typing import List, Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize ChromaDB client
chroma_client = chromadb.PersistentClient(path="./chroma_data")
collection = chroma_client.get_or_create_collection("documents")


async def create_embedding(text: str) -> List[float]:
    """Create embedding using OpenAI text-embedding-3-small"""
    response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding


async def store_embedding(document_id: uuid.UUID, text: str) -> str:
    """Store embedding in ChromaDB and return ChromaDB ID"""
    embedding = await create_embedding(text)
    chroma_id = str(uuid.uuid4())
    
    collection.add(
        embeddings=[embedding],
        documents=[text],
        metadatas=[{"document_id": str(document_id)}],
        ids=[chroma_id]
    )
    
    return chroma_id


async def search_similar(query: str, top_k: int = 5, doc_id: str = None) -> List[Dict[str, Any]]:
    """Search for similar documents in ChromaDB, optionally filtered by doc_id"""
    query_embedding = await create_embedding(query)
    
    # Configure where filter if doc_id is provided
    where_filter = {"document_id": doc_id} if doc_id else None
    
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where=where_filter,
        include=["documents", "metadatas", "distances"]
    )
    
    # Format results
    formatted_results = []
    if results['ids'] and len(results['ids']) > 0:
        for i in range(len(results['ids'][0])):
            formatted_results.append({
                "id": results['ids'][0][i],
                "document_id": results['metadatas'][0][i]["document_id"],
                "text": results['documents'][0][i],
                "distance": results['distances'][0][i]
            })
    
    return formatted_results


async def generate_rag_answer(query: str, context_docs: List[Dict[str, Any]], model: str = "document") -> Dict[str, Any]:
    """Generate answer using GPT with retrieved context"""
    # Prepare source information
    sources = []
    for doc in context_docs:
        sources.append({
            "doc_id": doc["document_id"],
            "snippet": doc["text"][:200] + "..." if len(doc["text"]) > 200 else doc["text"]
        })
    
    # Determine behavior based on model selection
    if model == "general":
        # General assistant mode - use only general knowledge, ignore document context
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant with general knowledge. Answer the user's question using your general knowledge without referring to any specific documents."
                },
                {
                    "role": "user",
                    "content": query
                }
            ],
            temperature=0.1,
            max_tokens=500
        )
    else:
        # Document intelligence mode - use retrieved context
        # Prepare context from retrieved documents
        context_text = "\n\n".join([doc['text'] for doc in context_docs])
        
        # Generate response using GPT
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that can answer general questions and also questions based on provided document context. If context documents are provided and relevant to the question, answer based on the context. For general conversational questions or when context is not relevant, provide a helpful response using your general knowledge."
                },
                {
                    "role": "user",
                    "content": f"Context documents:\n{context_text}\n\nQuestion: {query}\n\nAnswer helpfully:"
                }
            ],
            temperature=0.1,
            max_tokens=500
        )
    
    answer = response.choices[0].message.content
    
    return {
        "answer": answer,
        "sources": sources
    }