import os
import base64
import json
from typing import Optional
import httpx
from ..core.config import settings

# OpenRouter API configuration
OPENROUTER_API_KEY = settings.OPENROUTER_API_KEY
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL_NAME = "google/gemini-flash-1.5"  # Using Gemini Flash 1.5 as it supports audio input

class AudioEngine:
    def __init__(self):
        # No model loading needed - using OpenRouter API
        pass
     
    def transcribe_audio(self, audio_bytes: bytes) -> str:
        """Transcribe audio bytes to text using OpenRouter API"""
        try:
            # Encode audio to base64
            base64_audio = base64.b64encode(audio_bytes).decode('utf-8')
            
            headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": MODEL_NAME,
                "messages": [
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
                                    "format": "wav"  # Assuming WAV format, adjust if needed
                                }
                            }
                        ]
                    }
                ],
                "max_tokens": 1000
            }
            
            response = httpx.post(OPENROUTER_API_URL, headers=headers, json=payload, timeout=30.0)
            response.raise_for_status()
            
            result = response.json()
            transcript = result["choices"][0]["message"]["content"]
            return transcript.strip()
        except Exception as e:
            print(f"Error transcribing audio: {e}")
            return ""
     
    def transcribe_video_audio(self, video_bytes: bytes) -> str:
        """Extract audio from video and transcribe it"""
        try:
            # Import here to avoid circular imports
            from .video_engine import VideoEngine
            
            video_engine = VideoEngine()
            audio_bytes = video_engine.extract_audio_track(video_bytes)
            
            if not audio_bytes:
                return ""
            
            return self.transcribe_audio(audio_bytes)
        except Exception as e:
            print(f"Error transcribing video audio: {e}")
            return ""