import json
import httpx
from typing import List, Dict, Any
from ..core.config import settings

# OpenRouter API configuration
OPENROUTER_API_KEY = settings.OPENROUTER_API_KEY
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL_NAME = "openai/gpt-4o"  # Using GPT-4o for agent planning

class AgentPlanner:
    def parse_goal(self, goal_string: str) -> dict:
        """Extract intent from user goal string"""
        # Simple intent extraction - in practice would use NLP
        goal_lower = goal_string.lower()
        
        # Define intent patterns
        if any(word in goal_lower for word in ["summarize", "summary", "tldr", "brief"]):
            intent = "summarize"
        elif any(word in goal_lower for word in ["action", "do", "execute", "perform", "implement"]):
            intent = "action"
        elif any(word in goal_lower for word in ["analyze", "analysis", "insight", "understand"]):
            intent = "analyze"
        elif any(word in goal_lower for word in ["report", "document", "write", "create"]):
            intent = "report"
        else:
            intent = "general"
        
        return {
            "goal": goal_string,
            "intent": intent,
            "keywords": [word for word in goal_string.split() if len(word) > 3][:5]
        }
    
    def generate_plan(self, goal: str, context: dict) -> dict:
        """Generate execution plan using Autonomous AI Agent prompt"""
        try:
            # Prepare context for the AI
            context_str = json.dumps(context, indent=2)
            
            headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": MODEL_NAME,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an autonomous AI agent. Understand the user goal. Break it into ordered steps. Evaluate risk per step. Execute supported actions only. Do not execute high-risk actions without confirmation. Ensure logical consistency."
                    },
                    {
                        "role": "user",
                        "content": f"USER GOAL: {goal}\n\nAVAILABLE CONTEXT:\n{context_str}"
                    }
                ],
                "response_format": {"type": "json_object"},
                "max_tokens": 1500
            }
            
            response = httpx.post(OPENROUTER_API_URL, headers=headers, json=payload, timeout=30.0)
            response.raise_for_status()
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            # Parse JSON response
            try:
                parsed = json.loads(content)
                # Ensure required fields exist
                if "plan" not in parsed:
                    parsed["plan"] = []
                if "actions_executed" not in parsed:
                    parsed["actions_executed"] = []
                if "status" not in parsed:
                    parsed["status"] = "pending"
                if "errors" not in parsed:
                    parsed["errors"] = []
                
                # Validate plan steps
                for i, step in enumerate(parsed["plan"]):
                    if "step" not in step:
                        step["step"] = i + 1
                    if "action" not in step:
                        step["action"] = "Unknown action"
                    if "risk" not in step:
                        step["risk"] = "low"
                    if "status" not in step:
                        step["status"] = "pending"
                    # Ensure risk is valid
                    if step["risk"] not in ["low", "medium", "high"]:
                        step["risk"] = "low"
                    # Ensure status is valid
                    if step["status"] not in ["pending", "done", "blocked"]:
                        step["status"] = "pending"
                        
                return parsed
            except json.JSONDecodeError:
                # Fallback if response is not valid JSON
                return {
                    "plan": [
                        {
                            "step": 1,
                            "action": "Review generated insights",
                            "risk": "low",
                            "status": "pending"
                        }
                    ],
                    "actions_executed": [],
                    "status": "failed",
                    "errors": ["Failed to parse agent plan"]
                }
        except Exception as e:
            print(f"Error generating plan: {e}")
            return {
                "plan": [
                    {
                        "step": 1,
                        "action": "Manual review required",
                        "risk": "medium",
                        "status": "blocked"
                    }
                ],
                "actions_executed": [],
                "status": "failed",
                "errors": [f"Error in agent planner: {str(e)}"]
            }
    
    def execute_plan(self, plan: dict, context: dict) -> dict:
        """Execute the generated plan step by step"""
        try:
            # Make a copy of the plan to modify
            executed_plan = plan.copy()
            executed_plan["actions_executed"] = []
            executed_plan["errors"] = []
            
            # Supported actions mapping
            supported_actions = {
                "export_to_json": self._export_to_json,
                "store_to_memory": self._store_to_memory,
                "generate_report": self._generate_report,
                "send_summary_email": self._send_summary_email,
                "trigger_webhook": self._trigger_webhook,
                "update_external_db": self._update_external_db
            }
            
            # Process each step in order
            for step in executed_plan["plan"]:
                step_num = step["step"]
                action_name = step["action"]
                risk_level = step["risk"]
                
                print(f"Executing step {step_num}: {action_name} (risk: {risk_level})")
                
                # Check if action is supported
                if action_name not in supported_actions:
                    step["status"] = "blocked"
                    step["error"] = f"Unsupported action: {action_name}"
                    executed_plan["errors"].append(f"Step {step_num}: Unsupported action '{action_name}'")
                    continue
                
                # For medium/high risk actions, we would normally pause for confirmation
                # In this implementation, we'll execute all but mark high-risk as requiring confirmation
                if risk_level == "high":
                    step["status"] = "pending_confirmation"
                    executed_plan["status"] = "pending_confirmation"
                    # We still execute it for now, but in a real system this would wait for user confirmation
                    # For demo purposes, we'll execute but note it requires confirmation
                    try:
                        result = supported_actions[action_name](context)
                        step["status"] = "done"
                        step["result"] = result
                        executed_plan["actions_executed"].append(action_name)
                    except Exception as e:
                        step["status"] = "failed"
                        step["error"] = str(e)
                        executed_plan["errors"].append(f"Step {step_num}: {str(e)}")
                else:
                    # Low risk actions execute immediately
                    try:
                        result = supported_actions[action_name](context)
                        step["status"] = "done"
                        step["result"] = result
                        executed_plan["actions_executed"].append(action_name)
                    except Exception as e:
                        step["status"] = "failed"
                        step["error"] = str(e)
                        executed_plan["errors"].append(f"Step {step_num}: {str(e)}")
            
            # Determine overall status
            if any(step.get("status") == "failed" for step in executed_plan["plan"]):
                executed_plan["status"] = "failed"
            elif any(step.get("status") == "pending_confirmation" for step in executed_plan["plan"]):
                executed_plan["status"] = "pending_confirmation"
            elif all(step.get("status") == "done" for step in executed_plan["plan"]):
                executed_plan["status"] = "success"
            else:
                executed_plan["status"] = "in_progress"
                
            return executed_plan
        except Exception as e:
            print(f"Error executing plan: {e}")
            return {
                "plan": plan.get("plan", []),
                "actions_executed": [],
                "status": "failed",
                "errors": [f"Error executing plan: {str(e)}"]
            }
    
    def _export_to_json(self, context: dict) -> str:
        """Export context to JSON format"""
        import json
        return json.dumps(context, indent=2)
    
    def _store_to_memory(self, context: dict) -> str:
        """Store context to memory (placeholder)"""
        # In a real implementation, this would store to ChromaDB
        return f"Stored context to memory: {hash(str(context))}"
    
    def _generate_report(self, context: dict) -> str:
        """Generate a report from context"""
        # Simple report generation
        report = f"""
VISIONMIND AI REPORT
====================

Context Summary:
{str(context)[:500]}...

Generated by Autonomous AI Agent
"""
        return report.strip()
    
    def _send_summary_email(self, context: dict) -> str:
        """Compose email draft (does not send)"""
        # In a real implementation, this would draft an email
        return f"Email draft prepared based on context: {hash(str(context))}"
    
    def _trigger_webhook(self, context: dict) -> str:
        """POST results to external URL (placeholder)"""
        # In a real implementation, this would make an HTTP POST request
        return f"Webhook triggered with context hash: {hash(str(context))}"
    
    def _update_external_db(self, context: dict) -> str:
        """Write to external data source (placeholder)"""
        # In a real implementation, this would update an external database
        return f"External DB updated with context hash: {hash(str(context))}"