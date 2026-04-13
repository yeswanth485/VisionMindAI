import os
import base64
import json
from typing import Optional
from app.core.ai_client import ai_client as client
from app.core.config import settings

# OpenRouter API configuration - now using centralized client
MODEL_NAME = "google/gemini-flash-1.5"

class AudioEngine:
    def __init__(self):
        # No model loading needed - using OpenRouter API
        pass
     
    async def transcribe_audio(self, audio_bytes: bytes) -> str:
        """Transcribe audio bytes to text using centralized AI client (async)"""
        try:
            # Encode audio to base64
            base64_audio = base64.b64encode(audio_bytes).decode('utf-8')
            
            response = await client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Transcribe this audio file. Return only the transcribed text without any additional commentary."
                            },
                            {
                                "type": "input_audio",
                                "input_audio": {
                                    "data": base64_audio,
                                    "format": "wav" 
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1000
            )
            
            transcript = response.choices[0].message.content
            return transcript.strip()
        except Exception as e:
            print(f"Error transcribing audio: {e}")
            return ""
     
    async def transcribe_video_audio(self, video_bytes: bytes) -> str:
        """Extract audio from video and transcribe it (async)"""
        try:
            # Import here to avoid circular imports
            from .video_engine import VideoEngine
            
            video_engine = VideoEngine()
            # Note: extract_audio_track is currently synchronous in video_engine
            audio_bytes = video_engine.extract_audio_track(video_bytes)
            
            if not audio_bytes:
                return ""
            
            return await self.transcribe_audio(audio_bytes)
        except Exception as e:
            print(f"Error transcribing video audio: {e}")
            return ""