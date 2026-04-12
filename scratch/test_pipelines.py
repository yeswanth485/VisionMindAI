import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.abspath('backend'))

from app.services.multimodal_pipeline import MultimodalPipeline
from app.services.pipeline import DocumentPipeline
import uuid

async def test_multimodal():
    print("Testing MultimodalPipeline...")
    pipeline = MultimodalPipeline()
    try:
        # Mock file content
        content = b"This is a test document content"
        filename = "test.txt"
        
        # Test without goal
        print("Running without goal...")
        result = await pipeline.process_input(content, filename)
        print(f"Success: {result['summary']}")
        
        # Test with goal
        print("Running with goal...")
        result = await pipeline.process_input(content, filename, user_goal="Summarize this")
        print(f"Success: {result['summary']}")
        print(f"Agent Status: {result['agent_result']['status']}")
        
    except Exception as e:
        print(f"FAILED: {e}")

async def test_document():
    print("\nTesting DocumentPipeline...")
    pipeline = DocumentPipeline()
    try:
        # Mock file content
        content = b"This is a test document content"
        filename = "test.pdf"  # This will trigger preprocess (pdf2image) which might fail if not installed
        
        # Use a TXT file instead to be safe for local test
        filename = "test.txt"
        
        print("Running document process...")
        doc_id = uuid.uuid4()
        result = await pipeline.process_document(content, filename, doc_id)
        print(f"Success: {result['status']}")
        
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test_multimodal())
    asyncio.run(test_document())
