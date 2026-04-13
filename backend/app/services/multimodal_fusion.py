import json
from typing import List, Tuple
from ..core.ai_client import ai_client

class MultimodalFusion:
    def fuse_contexts(self, ocr_text: str, frame_descriptions: List[Tuple[float, str]], transcript: str) -> str:
        """Combine OCR text, frame descriptions, and transcript into unified context"""
        try:
            # Format frame descriptions
            frames_text = "\n".join([
                f"[{timestamp:.1f}s] {description}" 
                for timestamp, description in frame_descriptions
            ])
            
            # Combine all contexts
            fused_context = f"""
OCR TEXT FROM DOCUMENTS:
{ocr_text or "No OCR text available"}

VIDEO FRAME DESCRIPTIONS:
{frames_text or "No frame descriptions available"}

AUDIO TRANSCRIPT:
{transcript or "No transcript available"}
""".strip()
            
            return fused_context
        except Exception as e:
            print(f"Error fusing contexts: {e}")
            return "Error combining contexts"

    async def run_multimodal_reasoning(self, fused_context: str) -> dict:
        """Run multimodal reasoning AI on fused context using AsyncOpenAI client"""
        try:
            response = await ai_client.chat.completions.create(
                model="openai/gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a multimodal reasoning AI. Align all inputs. Resolve conflicts between modalities. Build a unified context. Do not favor one modality blindly. Resolve contradictions logically."
                    },
                    {
                        "role": "user",
                        "content": fused_context
                    }
                ],
                response_format={"type": "json_object"},
                max_tokens=1000
            )
            
            content = response.choices[0].message.content
            
            # Parse JSON response
            try:
                parsed = json.loads(content)
                # Ensure required fields exist
                if "unified_summary" not in parsed:
                    parsed["unified_summary"] = "No summary generated"
                if "key_entities" not in parsed:
                    parsed["key_entities"] = []
                if "relationships" not in parsed:
                    parsed["relationships"] = []
                return parsed
            except json.JSONDecodeError:
                # Fallback if response is not valid JSON
                return {
                    "unified_summary": content[:500] if content else "Error generating summary",
                    "key_entities": [],
                    "relationships": []
                }
        except Exception as e:
            print(f"Error running multimodal reasoning: {e}")
            return {
                "unified_summary": "Error in multimodal reasoning",
                "key_entities": [],
                "relationships": []
            }

    def classify_input(self, unified_summary: str) -> str:
        """Classify the input as meeting, tutorial, interview, lecture, presentation, or other"""
        summary_lower = unified_summary.lower()
        
        # Simple keyword-based classification
        if any(word in summary_lower for word in ["meeting", "discuss", "team", "project", "agenda"]):
            return "meeting"
        elif any(word in summary_lower for word in ["tutorial", "how to", "learn", "teach", "demonstrate"]):
            return "tutorial"
        elif any(word in summary_lower for word in ["interview", "question", "answer", "candidate", "recruiter"]):
            return "interview"
        elif any(word in summary_lower for word in ["lecture", "class", "course", "university", "student"]):
            return "lecture"
        elif any(word in summary_lower for word in ["presentation", "slide", "present", "talk", "conference"]):
            return "presentation"
        else:
            return "other"

