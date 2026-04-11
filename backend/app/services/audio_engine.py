import os
import tempfile
import whisper
from typing import Optional
import torch

class AudioEngine:
    def __init__(self):
        # Load Whisper model (using base model for balance of speed and accuracy)
        self.model = whisper.load_model("base")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model.to(self.device)
    
    def transcribe_audio(self, audio_bytes: bytes) -> str:
        """Transcribe audio bytes to text using Whisper"""
        try:
            # Save audio bytes to temporary file
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
                tmp_file.write(audio_bytes)
                tmp_file_path = tmp_file.name
            
            # Transcribe with Whisper
            result = self.model.transcribe(tmp_file_path)
            
            # Clean up temp file
            os.unlink(tmp_file_path)
            
            return result["text"].strip()
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