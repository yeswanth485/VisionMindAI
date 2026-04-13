import os
import base64
import json
from typing import List, Tuple
from PIL import Image
import io
import moviepy as mp
from app.core.ai_client import ai_client as client
from app.core.config import settings

# OpenRouter API configuration
MODEL_NAME = "google/gemini-pro-vision" 

class VideoEngine:
    def extract_keyframes(self, video_bytes: bytes, interval_sec: int = 5) -> Tuple[List[Image.Image], List[float]]:
        """Extract keyframes from video at specified interval (synchronous due to moviepy)"""
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
            if os.path.exists(temp_video_path):
                os.remove(temp_video_path)
            
            return frames, timestamps
        except Exception as e:
            print(f"Error extracting keyframes: {e}")
            return [], []
    
    def extract_audio_track(self, video_bytes: bytes) -> bytes:
        """Extract audio track from video as WAV bytes (synchronous)"""
        try:
            temp_video_path = "temp_video_audio.mp4"
            with open(temp_video_path, "wb") as f:
                f.write(video_bytes)
            
            clip = mp.VideoFileClip(temp_video_path)
            audio = clip.audio
            
            if not audio:
                clip.close()
                if os.path.exists(temp_video_path):
                    os.remove(temp_video_path)
                return b""

            temp_audio_path = "temp_audio.wav"
            audio.write_audiofile(temp_audio_path, verbose=False, logger=None)
            
            with open(temp_audio_path, "rb") as f:
                wav_bytes = f.read()
            
            clip.close()
            audio.close()
            
            if os.path.exists(temp_video_path):
                os.remove(temp_video_path)
            if os.path.exists(temp_audio_path):
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
    
    async def describe_frame(self, image: Image.Image, timestamp: float) -> str:
        """Describe single frame using centralized AI client (async)"""
        try:
            base64_image = self._encode_image_to_base64(image)
            
            response = await client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
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
                max_tokens=300
            )
            
            description = response.choices[0].message.content
            return description.strip()
        except Exception as e:
            print(f"Error describing frame: {e}")
            return "Error describing frame"
    
    async def analyze_video(self, frames_with_ts: List[Tuple[Image.Image, float]], transcript: str) -> dict:
        """Analyze video using keyframes and transcript (async)"""
        try:
            key_events = []
            
            # Process frames concurrently for speed
            import asyncio
            tasks = [self.describe_frame(frame, ts) for frame, ts in frames_with_ts]
            descriptions = await asyncio.gather(*tasks)
            
            for (frame, timestamp), description in zip(frames_with_ts, descriptions):
                # Extract key events (simplified)
                if any(keyword in description.lower() for keyword in ["person", "people", "talking", "speaking", "presenting", "showing"]):
                    hours = int(timestamp // 3600)
                    minutes = int((timestamp % 3600) // 60)
                    seconds = int(timestamp % 60)
                    time_str = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
                    key_events.append({
                        "timestamp": time_str,
                        "event": description
                    })
            
            # Simple topic extraction
            topics = []
            if transcript:
                words = transcript.lower().split()
                common_words = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"}
                meaningful_words = [w for w in words if w not in common_words and len(w) > 3]
                from collections import Counter
                word_counts = Counter(meaningful_words)
                topics = [word for word, count in word_counts.most_common(5)]
            
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