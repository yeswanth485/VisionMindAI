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
        
        # Video extensions
        video_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm'}
        # Audio extensions
        audio_extensions = {'.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'}
        # Document extensions
        document_extensions = {'.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.txt', '.doc', '.docx'}
        
        # Check by extension
        for ext in video_extensions:
            if filename_lower.endswith(ext):
                return InputType.VIDEO
        
        for ext in audio_extensions:
            if filename_lower.endswith(ext):
                return InputType.AUDIO
                
        for ext in document_extensions:
            if filename_lower.endswith(ext):
                return InputType.DOCUMENT
        
        # If no extension match, try to detect from content
        # Simple check for video magic numbers
        if file_content.startswith(b'\x00\x00\x00\x18ftypmp4') or file_content.startswith(b'\x00\x00\x00\x20ftypmp4'):
            return InputType.VIDEO
            
        # Default to document
        return InputType.DOCUMENT
    
    async def process_input(self, file_content: bytes, filename: str, user_goal: str = "") -> Dict[str, Any]:
        """Main processing pipeline for multimodal input"""
        try:
            # Detect input type
            input_type = self.detect_input_type(file_content, filename)
            
            # Initialize results
            result = {
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
            
            # Initialize variables to prevent UnboundLocalError
            unified_reasoning = result["unified_reasoning"]
            action_analysis = {}
            input_classification = ""
            agent_context = {}
            plan = []
            agent_result = result["agent_result"]
            
            # Process based on input type
            transcript = ""
            frame_descriptions = []
            
            if input_type == InputType.VIDEO:
                # Process video
                frames, timestamps = self.video_engine.extract_keyframes(file_content)
                transcript = self.audio_engine.transcribe_video_audio(file_content)
                
                # Analyze video
                video_analysis = self.video_engine.analyze_video(list(zip(frames, timestamps)), transcript)
                
                # Update result
                result["summary"] = video_analysis["summary"]
                result["video_timeline"] = [
                    {
                        "timestamp": event["timestamp"],
                        "event": event["event"],
                        "description": event["event"]  # Simplified
                    }
                    for event in video_analysis["key_events"]
                ]
                result["structured_data"] = {
                    "frames_analyzed": len(frames),
                    "transcript_length": len(transcript)
                }
                result["insights"] = video_analysis["topics"]
                
                # Prepare context for fusion
                frame_descriptions = list(zip(timestamps, ["Frame description"] * len(timestamps)))  # Simplified
                
            elif input_type == InputType.AUDIO:
                # Process audio
                transcript = self.audio_engine.transcribe_audio(file_content)
                
                result["summary"] = f"Audio transcript extracted ({len(transcript)} characters)"
                result["structured_data"] = {
                    "transcript": transcript,
                    "transcript_length": len(transcript)
                }
                result["insights"] = []  # Would extract topics from transcript
                
                # Prepare context for fusion
                frame_descriptions = []  # No video frames
                
            else:  # DOCUMENT or MULTIMODAL
                # Process as document using the AI reasoning engine
                try:
                    text_content = file_content.decode('utf-8', errors='ignore')
                except:
                    text_content = f"Binary document: {filename}"
                
                # Use multimodal fusion to reason about the document content
                fused_context = self.multimodal_fusion.fuse_contexts(
                    ocr_text=text_content,
                    frame_descriptions=[],
                    transcript=""
                )
                
                # Perform AI reasoning
                reasoning = self.multimodal_fusion.run_multimodal_reasoning(fused_context)
                
                result["summary"] = reasoning.get("unified_summary", f"Document processed: {filename}")
                result["unified_reasoning"] = reasoning
                
                # Reliable data extraction
                word_count = len(text_content.split())
                result["structured_data"] = {
                    "document_text": text_content[:2000],  # More context
                    "document_length": len(text_content),
                    "word_count": word_count,
                    "filename": filename,
                    "key_entities": reasoning.get("key_entities", []),
                    "sentiment": "neutral", # Default
                }
                
                result["insights"] = [
                    f"Word density: {(word_count / max(1, len(text_content))) * 100:.2f}%",
                    f"Entity count: {len(reasoning.get('key_entities', []))}"
                ]
                
                # Update high-level summary
                if reasoning.get("unified_summary"):
                    result["summary"] = reasoning["unified_summary"]
            
            # Run unified multimodal reasoning (Engine 2) for all types if not already run
            if not result["unified_reasoning"].get("unified_summary"):
                fused_context = self.multimodal_fusion.fuse_contexts(
                    ocr_text=result["structured_data"].get("document_text", "") or result["structured_data"].get("transcript", ""),
                    frame_descriptions=frame_descriptions,
                    transcript=transcript
                )
                
                unified_reasoning = self.multimodal_fusion.run_multimodal_reasoning(fused_context)
                result["unified_reasoning"] = unified_reasoning
            else:
                unified_reasoning = result["unified_reasoning"]
            
            # Classify input type for reasoning
            input_classification = self.multimodal_fusion.classify_input(unified_reasoning["unified_summary"])
            result["structured_data"]["input_classification"] = input_classification
            
            # Run action decision system (Engine 3)
            action_analysis = self.action_decision.analyze_for_actions(
                structured_data=result["structured_data"],
                insights={"topics": result["insights"]},
                validation={"status": "processed"}  # Simplified validation
            )
            
            # Run autonomous AI agent (Engine 4) if user goal provided
            if user_goal:
                # Parse goal
                goal_intent = self.agent_planner.parse_goal(user_goal)
                
                # Prepare context for agent
                agent_context = {
                    **result["structured_data"],
                    "unified_reasoning": result["unified_reasoning"],
                    "action_analysis": action_analysis,
                    "goal_intent": goal_intent
                }
                
                # Generate plan
                plan = self.agent_planner.generate_plan(user_goal, agent_context)
                
                # Execute plan
                agent_result = self.agent_planner.execute_plan(plan, agent_context)
                result["agent_result"] = agent_result
                
                # Store session in memory
                session_id = str(uuid.uuid4())
                self.memory_system.store_session(
                    session_id=session_id,
                    context=agent_context,
                    summary=unified_reasoning["unified_summary"]
                )
                result["agent_result"]["session_id"] = session_id
            else:
                # Still run action decision but no agent execution
                auto_actions, confirm_actions = self.action_decision.filter_executable(
                    action_analysis["recommended_actions"]
                )
                result["agent_result"]["recommended_actions"] = auto_actions
                result["agent_result"]["actions_requiring_confirmation"] = confirm_actions
            
            # Calculate confidence score (simplified)
            confidence_factors = [
                0.3 if result["summary"] and len(result["summary"]) > 10 else 0.0,
                0.3 if result["unified_reasoning"]["unified_summary"] and len(result["unified_reasoning"]["unified_summary"]) > 10 else 0.0,
                0.2 if len(result["insights"]) > 0 else 0.0,
                0.2 if result["agent_result"]["status"] in ["success", "pending_confirmation"] else 0.0
            ]
            result["confidence_score"] = sum(confidence_factors)
            
            return result
            
        except Exception as e:
            print(f"Error in multimodal pipeline: {e}")
            return {
                "input_type": "error",
                "summary": f"Processing failed: {str(e)}",
                "structured_data": {},
                "insights": [],
                "video_timeline": [],
                "unified_reasoning": {
                    "unified_summary": "Error in processing",
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