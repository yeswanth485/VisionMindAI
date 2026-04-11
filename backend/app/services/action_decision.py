import json
import httpx
from typing import List, Dict, Any
from app.core.config import settings

# OpenRouter API configuration
OPENROUTER_API_KEY = settings.OPENROUTER_API_KEY
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL_NAME = "openai/gpt-4o"  # Using GPT-4o for decision making

class ActionDecision:
    def analyze_for_actions(self, structured_data: dict, insights: dict, validation: dict) -> dict:
        """Analyze data and suggest actions using AI Action Decision System prompt"""
        try:
            # Prepare context for the AI
            context = f"""
STRUCTURED DATA:
{json.dumps(structured_data, indent=2)}

INSIGHTS:
{json.dumps(insights, indent=2)}

VALIDATION RESULTS:
{json.dumps(validation, indent=2)}
"""
            
            headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": MODEL_NAME,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an AI action decision system. Evaluate the importance of the data. Identify risks. Suggest conservative, non-assumptive actions. Do not avoid assumptions."
                    },
                    {
                        "role": "user",
                        "content": context
                    }
                ],
                "response_format": {"type": "json_object"},
                "max_tokens": 1000
            }
            
            response = httpx.post(OPENROUTER_API_URL, headers=headers, json=payload, timeout=30.0)
            response.raise_for_status()
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            # Parse JSON response
            try:
                parsed = json.loads(content)
                # Ensure required fields exist
                if "recommended_actions" not in parsed:
                    parsed["recommended_actions"] = []
                if "priority" not in parsed:
                    parsed["priority"] = "low"
                
                # Validate each action has required fields
                for action in parsed["recommended_actions"]:
                    if "action" not in action:
                        action["action"] = "Unknown action"
                    if "reason" not in action:
                        action["reason"] = "No reason provided"
                    if "risk" not in action:
                        action["risk"] = "low"
                    # Ensure risk is valid
                    if action["risk"] not in ["low", "medium", "high"]:
                        action["risk"] = "low"
                        
                return parsed
            except json.JSONDecodeError:
                # Fallback if response is not valid JSON
                return {
                    "recommended_actions": [
                        {
                            "action": "Review generated insights",
                            "reason": "Unable to parse AI recommendations",
                            "risk": "low"
                        }
                    ],
                    "priority": "low"
                }
        except Exception as e:
            print(f"Error analyzing for actions: {e}")
            return {
                "recommended_actions": [
                    {
                        "action": "Manual review required",
                        "reason": f"Error in action decision system: {str(e)}",
                        "risk": "medium"
                    }
                ],
                "priority": "medium"
            }
    
    def filter_executable(self, recommended_actions: List[Dict[str, Any]]) -> tuple:
        """Separate low-risk (auto-execute) from medium/high-risk (require confirmation) actions"""
        auto_execute = []
        require_confirmation = []
        
        for action in recommended_actions:
            if action.get("risk") == "low":
                auto_execute.append(action)
            else:
                require_confirmation.append(action)
                
        return auto_execute, require_confirmation