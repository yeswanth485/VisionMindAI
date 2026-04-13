import json
from typing import List, Dict, Any
from app.core.ai_client import ai_client
from app.core.config import settings


class MultimodalFusion:
    def __init__(self):
        self.client = ai_client
        self.model = "openai/gpt-4o-mini"

    def fuse_contexts(self, ocr_text: str, frame_descriptions: List[tuple], transcript: str) -> str:
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
        """Run multimodal reasoning AI on fused context (async)"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a multimodal reasoning AI. Analyse all inputs and build a unified context. "
                            "Resolve contradictions logically. "
                            "Return ONLY a valid JSON object with keys: "
                            "unified_summary (string), key_entities (list of strings), relationships (list of strings)."
                        )
                    },
                    {
                        "role": "user",
                        "content": fused_context[:8000]
                    }
                ],
                response_format={"type": "json_object"},
                max_tokens=1000,
                temperature=0.2
            )

            content = response.choices[0].message.content

            try:
                parsed = json.loads(content)
            except json.JSONDecodeError:
                parsed = {}

            # Ensure required fields
            parsed.setdefault("unified_summary", content[:500] if content else "No summary generated")
            parsed.setdefault("key_entities", [])
            parsed.setdefault("relationships", [])
            return parsed

        except Exception as e:
            print(f"Error running multimodal reasoning: {e}")
            return {
                "unified_summary": f"Analysis unavailable: {str(e)[:100]}",
                "key_entities": [],
                "relationships": []
            }

    async def classify_input(self, unified_summary: str) -> str:
        """Classify the input type from its unified summary"""
        summary_lower = unified_summary.lower()

        if any(w in summary_lower for w in ["meeting", "discuss", "team", "project", "agenda"]):
            return "meeting"
        elif any(w in summary_lower for w in ["tutorial", "how to", "learn", "teach", "demonstrate"]):
            return "tutorial"
        elif any(w in summary_lower for w in ["interview", "question", "answer", "candidate", "recruiter"]):
            return "interview"
        elif any(w in summary_lower for w in ["lecture", "class", "course", "university", "student"]):
            return "lecture"
        elif any(w in summary_lower for w in ["presentation", "slide", "present", "talk", "conference"]):
            return "presentation"
        elif any(w in summary_lower for w in ["resume", "cv", "experience", "skills", "education"]):
            return "resume"
        elif any(w in summary_lower for w in ["invoice", "receipt", "payment", "amount", "total"]):
            return "invoice"
        else:
            return "other"
