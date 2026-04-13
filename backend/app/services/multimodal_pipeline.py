import os
import json
import uuid
from typing import Dict, Any, Optional, Tuple
from enum import Enum
from .video_engine import VideoEngine
from .audio_engine import AudioEngine
from .multimodal_fusion import MultimodalFusion
from .action_decision import ActionDecision
from .agent_planner import AgentPlanner
from .memory_system import MemorySystem


class InputType(str, Enum):
    VIDEO = "video"
    AUDIO = "audio"
    DOCUMENT = "document"
    MULTIMODAL = "multimodal"


class MultimodalPipeline:
    def __init__(self):
        self.video_engine = VideoEngine()
        self.audio_engine = AudioEngine()
        self.multimodal_fusion = MultimodalFusion()
        self.action_decision = ActionDecision()
        self.agent_planner = AgentPlanner()
        self.memory_system = MemorySystem()

    def detect_input_type(self, file_content: bytes, filename: str) -> InputType:
        """Detect input type based on file extension and content"""
        if not filename:
            return InputType.DOCUMENT

        filename_lower = filename.lower()

        video_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm'}
        audio_extensions = {'.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'}
        document_extensions = {'.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.txt', '.doc', '.docx'}

        for ext in video_extensions:
            if filename_lower.endswith(ext):
                return InputType.VIDEO

        for ext in audio_extensions:
            if filename_lower.endswith(ext):
                return InputType.AUDIO

        for ext in document_extensions:
            if filename_lower.endswith(ext):
                return InputType.DOCUMENT

        return InputType.DOCUMENT

    async def process_input(self, file_content: bytes, filename: str, user_goal: str = "") -> Dict[str, Any]:
        """Main processing pipeline for multimodal input (async)"""
        try:
            # Detect input type
            input_type = self.detect_input_type(file_content, filename)

            # Initialize result structure with safe defaults
            result: Dict[str, Any] = {
                "input_type": input_type.value,
                "summary": "",
                "structured_data": {},
                "insights": [],
                "video_timeline": [],
                "unified_reasoning": {
                    "unified_summary": "",
                    "key_entities": [],
                    "relationships": []
                },
                "agent_result": {
                    "plan": [],
                    "actions_executed": [],
                    "status": "success",
                    "errors": []
                },
                "confidence_score": 0.0
            }

            # Track for fusion
            transcript = ""
            frame_descriptions = []

            # ── Engine 1: Input Processing ────────────────────────────────────
            if input_type == InputType.VIDEO:
                try:
                    frames, timestamps = self.video_engine.extract_keyframes(file_content)
                    transcript = await self.audio_engine.transcribe_video_audio(file_content)
                    video_analysis = await self.video_engine.analyze_video(list(zip(frames, timestamps)), transcript)

                    result["summary"] = video_analysis.get("summary", "Video processed")
                    result["video_timeline"] = [
                        {
                            "timestamp": event.get("timestamp", ""),
                            "event": event.get("event", ""),
                            "description": event.get("event", "")
                        }
                        for event in video_analysis.get("key_events", [])
                    ]
                    result["structured_data"] = {
                        "frames_analyzed": len(frames),
                        "transcript_length": len(transcript)
                    }
                    result["insights"] = video_analysis.get("topics", [])
                    frame_descriptions = list(zip(timestamps, ["Frame description"] * len(timestamps)))
                except Exception as e:
                    print(f"Video processing error: {e}")
                    result["summary"] = f"Video partially processed: {filename}"

            elif input_type == InputType.AUDIO:
                try:
                    transcript = await self.audio_engine.transcribe_audio(file_content)
                    result["summary"] = f"Audio transcript extracted ({len(transcript)} characters)"
                    result["structured_data"] = {
                        "transcript": transcript,
                        "transcript_length": len(transcript)
                    }
                    result["insights"] = []
                except Exception as e:
                    print(f"Audio processing error: {e}")
                    result["summary"] = f"Audio partially processed: {filename}"

            else:  # DOCUMENT or MULTIMODAL
                try:
                    text_content = file_content.decode('utf-8', errors='ignore')
                except Exception:
                    text_content = f"Binary document: {filename}"

                # ── Engine 2: Multimodal Fusion + Reasoning ───────────────
                fused_context = self.multimodal_fusion.fuse_contexts(
                    ocr_text=text_content,
                    frame_descriptions=[],
                    transcript=""
                )

                reasoning = await self.multimodal_fusion.run_multimodal_reasoning(fused_context)

                result["summary"] = reasoning.get("unified_summary", f"Document processed: {filename}")
                result["unified_reasoning"] = reasoning

                word_count = len(text_content.split())
                result["structured_data"] = {
                    "document_text": text_content[:2000],
                    "document_length": len(text_content),
                    "word_count": word_count,
                    "filename": filename,
                    "key_entities": reasoning.get("key_entities", []),
                    "sentiment": "neutral",
                }

                result["insights"] = [
                    f"Word density: {(word_count / max(1, len(text_content))) * 100:.2f}%",
                    f"Entity count: {len(reasoning.get('key_entities', []))}"
                ]

            if not result["unified_reasoning"].get("unified_summary"):
                fused_context = self.multimodal_fusion.fuse_contexts(
                    ocr_text=result["structured_data"].get("document_text", "")
                        or result["structured_data"].get("transcript", ""),
                    frame_descriptions=frame_descriptions,
                    transcript=transcript
                )
                unified_reasoning = await self.multimodal_fusion.run_multimodal_reasoning(fused_context)
                result["unified_reasoning"] = unified_reasoning
            else:
                unified_reasoning = result["unified_reasoning"]

            input_classification = await self.multimodal_fusion.classify_input(
                unified_reasoning.get("unified_summary", "")
            )
            result["structured_data"]["input_classification"] = input_classification

            # AWAIT the async action decision engine
            action_analysis = await self.action_decision.analyze_for_actions(
                structured_data=result["structured_data"],
                insights={"topics": result["insights"]},
                validation={"status": "processed"}
            )

            if user_goal:
                goal_intent = self.agent_planner.parse_goal(user_goal)

                agent_context = {
                    **result["structured_data"],
                    "unified_reasoning": result["unified_reasoning"],
                    "action_analysis": action_analysis,
                    "goal_intent": goal_intent
                }

                plan = await self.agent_planner.generate_plan(user_goal, agent_context)
                agent_result = await self.agent_planner.execute_plan(plan, agent_context)
                result["agent_result"] = agent_result

                session_id = str(uuid.uuid4())
                self.memory_system.store_session(
                    session_id=session_id,
                    context=agent_context,
                    summary=unified_reasoning.get("unified_summary", "")
                )
                result["agent_result"]["session_id"] = session_id
            else:
                try:
                    auto_actions, confirm_actions = self.action_decision.filter_executable(
                        action_analysis.get("recommended_actions", [])
                    )
                    result["agent_result"]["recommended_actions"] = auto_actions
                    result["agent_result"]["actions_requiring_confirmation"] = confirm_actions
                except Exception as e:
                    print(f"Action filter error: {e}")

            confidence_factors = [
                0.3 if result["summary"] and len(result["summary"]) > 10 else 0.0,
                0.3 if result["unified_reasoning"].get("unified_summary") and
                       len(result["unified_reasoning"]["unified_summary"]) > 10 else 0.0,
                0.2 if len(result["insights"]) > 0 else 0.0,
                0.2 if result["agent_result"].get("status") in ["success", "pending_confirmation", "partial"] else 0.0
            ]
            result["confidence_score"] = round(sum(confidence_factors), 2)

            return result

        except Exception as e:
            print(f"CRITICAL — Multimodal pipeline error: {e}")
            return {
                "input_type": "error",
                "summary": f"Processing failed: {str(e)}",
                "structured_data": {},
                "insights": [],
                "video_timeline": [],
                "unified_reasoning": {
                    "unified_summary": "Pipeline encountered an error. Please try again.",
                    "key_entities": [],
                    "relationships": []
                },
                "agent_result": {
                    "plan": [],
                    "actions_executed": [],
                    "status": "failed",
                    "errors": [str(e)]
                },
                "confidence_score": 0.0
            }