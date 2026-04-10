import uuid
import openai
import chromadb
from typing import List, Dict, Any
from app.core.config import settings

# Initialize OpenAI client
openai.api_key = settings.OPENAI_API_KEY

# Initialize ChromaDB client
chroma_client = chromadb.PersistentClient(path="./chroma_data")
collection = chroma_client.get_or_create_collection("documents")


async def create_embedding(text: str) -> List[float]:
    """Create embedding using OpenAI text-embedding-3-small"""
    response = await openai.Embedding.acreate(
        model="text-embedding-3-small",
        input=text
    )
    return response['data'][0]['embedding']


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


async def search_similar(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Search for similar documents in ChromaDB"""
    query_embedding = await create_embedding(query)
    
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
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


async def generate_rag_answer(query: str, context_docs: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate answer using GPT with retrieved context"""
    # Prepare context from retrieved documents
    context_text = "\n\n".join([doc['text'] for doc in context_docs])
    
    # Prepare source information
    sources = []
    for doc in context_docs:
        sources.append({
            "doc_id": doc["document_id"],
            "snippet": doc["text"][:200] + "..." if len(doc["text"]) > 200 else doc["text"]
        })
    
    # Generate response using GPT
    response = await openai.ChatCompletion.acreate(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant that answers questions based on provided document context. Always cite your sources."
            },
            {
                "role": "user",
                "content": f"Context documents:\n{context_text}\n\nQuestion: {query}\n\nAnswer based only on the provided context:"
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