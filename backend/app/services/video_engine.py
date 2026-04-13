import os
import base64
import json
from typing import List, Tuple
from PIL import Image
import io
import moviepy as mp
import httpx
from ..core.config import settings

# OpenRouter API configuration
OPENROUTER_API_KEY = settings.OPENROUTER_API_KEY
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL_NAME = "google/gemini-pro-vision"  # Using Gemini Pro Vision as it's available on OpenRouter

class VideoEngine:
    def extract_keyframes(self, video_bytes: bytes, interval_sec: int = 5) -> Tuple[List[Image.Image], List[float]]:
        """Extract keyframes from video at specified interval"""
        try:
            # Save video bytes to temporary file
            temp_video_path = "temp_video.mp4"
            with open(temp_video_path, "wb") as f:
                f.write(video_bytes)
            
            # Load video clip
            clip = mp.VideoFileClip(temp_video_path)
            
            # Extract frames at interval
            frames = []
            timestamps = []
            duration = clip.duration
            
            for t in range(0, int(duration), interval_sec):
                frame = clip.get_frame(t)
                # Convert numpy array to PIL Image
                img = Image.fromarray(frame)
                frames.append(img)
                timestamps.append(float(t))
            
            clip.close()
            
            # Clean up temp file
            os.remove(temp_video_path)
            
            return frames, timestamps
        except Exception as e:
            print(f"Error extracting keyframes: {e}")
            return [], []
    
    def extract_audio_track(self, video_bytes: bytes) -> bytes:
        """Extract audio track from video as WAV bytes"""
        try:
            # Save video bytes to temporary file
            temp_video_path = "temp_video_audio.mp4"
            with open(temp_video_path, "wb") as f:
                f.write(video_bytes)
            
            # Load video clip and extract audio
            clip = mp.VideoFileClip(temp_video_path)
            audio = clip.audio
            
            # Save audio as WAV
            temp_audio_path = "temp_audio.wav"
            audio.write_audiofile(temp_audio_path, verbose=False, logger=None)
            
            # Read WAV bytes
            with open(temp_audio_path, "rb") as f:
                wav_bytes = f.read()
            
            clip.close()
            audio.close()
            
            # Clean up temp files
            os.remove(temp_video_path)
            os.remove(temp_audio_path)
            
            return wav_bytes
        except Exception as e:
            print(f"Error extracting audio track: {e}")
            return b""
    
    def _encode_image_to_base64(self, image: Image.Image) -> str:
        """Encode PIL Image to base64 string"""
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG")
        return base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    def describe_frame(self, image: Image.Image, timestamp: float) -> str:
        """Describe single frame using GPT-4o Vision via OpenRouter"""
        try:
            base64_image = self._encode_image_to_base64(image)
            
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
                                "text": "Describe what you see in this image. Focus on objects, people, text on screen, and any notable events or activities."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                "max_tokens": 300
            }
            
            response = httpx.post(OPENROUTER_API_URL, headers=headers, json=payload, timeout=30.0)
            response.raise_for_status()
            
            result = response.json()
            description = result["choices"][0]["message"]["content"]
            return description.strip()
        except Exception as e:
            print(f"Error describing frame: {e}")
            return "Error describing frame"
    
    def analyze_video(self, frames_with_ts: List[Tuple[Image.Image, float]], transcript: str) -> dict:
        """Analyze video using Video Understanding AI prompt"""
        try:
            # Analyze each frame
            frame_descriptions = []
            key_events = []
            
            for frame, timestamp in frames_with_ts:
                description = self.describe_frame(frame, timestamp)
                frame_descriptions.append((timestamp, description))
                
                # Extract key events from description (simplified)
                if any(keyword in description.lower() for keyword in ["person", "people", "talking", "speaking", "presenting", "showing"]):
                    # Format timestamp as HH:MM:SS
                    hours = int(timestamp // 3600)
                    minutes = int((timestamp % 3600) // 60)
                    seconds = int(timestamp % 60)
                    time_str = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
                    key_events.append({
                        "timestamp": time_str,
                        "event": description
                    })
            
            # Analyze transcript for topics (simplified)
            topics = []
            if transcript:
                # Simple topic extraction - in practice would use NLP
                words = transcript.lower().split()
                common_words = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"}
                meaningful_words = [w for w in words if w not in common_words and len(w) > 3]
                # Get most frequent words as topics
                from collections import Counter
                word_counts = Counter(meaningful_words)
                topics = [word for word, count in word_counts.most_common(5)]
            
            # Generate summary
            summary = f"Video analysis complete. Found {len(key_events)} key events and {len(topics)} topics."
            
            return {
                "summary": summary,
                "key_events": key_events,
                "topics": topics
            }
        except Exception as e:
            print(f"Error analyzing video: {e}")
            return {
                "summary": "Error analyzing video",
                "key_events": [],
                "topics": []
            }