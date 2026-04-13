import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

# Centralized OpenAI Client Factory for OpenRouter
# This ensures every part of the application uses the same base URL and API key
def get_ai_client():
    # Prefer OPENROUTER_API_KEY, fallback to OPENAI_API_KEY
    api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        print("CRITICAL: Neither OPENROUTER_API_KEY nor OPENAI_API_KEY is set!")
        
    return AsyncOpenAI(
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
        default_headers={
            "HTTP-Referer": "https://visionmind-ai.vercel.app",
            "X-Title": "VisionMind AI",
        }
    )

# Singleton instance to be used across the application
ai_client = get_ai_client()
