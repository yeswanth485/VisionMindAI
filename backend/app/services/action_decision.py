import json
from typing import List, Dict, Any
from ..core.ai_client import ai_client
from ..core.config import settings

class ActionDecision:
    def __init__(self):
        self.client = ai_client
        self.model = "openai/gpt-4o"

    async def analyze_for_actions(self, structured_data: dict, insights: dict, validation: dict) -> dict:
        """Analyze data and suggest actions using AI Action Decision System (Async)"""
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
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an AI action decision system. Evaluate the importance of the data. Identify risks. Suggest conservative, non-assumptive actions. Return ONLY a valid JSON object."
                    },
                    {
                        "role": "user",
                        "content": context
                    }
                ],
                response_format={"type": "json_object"},
                max_tokens=1000
            )
            
            content = response.choices[0].message.content
            
            try:
                parsed = json.loads(content)
                # Ensure required fields exist
                parsed.setdefault("recommended_actions", [])
                parsed.setdefault("priority", "low")
                
                for action in parsed["recommended_actions"]:
                    action.setdefault("action", "Unknown action")
                    action.setdefault("reason", "No reason provided")
                    action.setdefault("risk", "low")
                    if action["risk"] not in ["low", "medium", "high"]:
                        action["risk"] = "low"
                        
                return parsed
            except json.JSONDecodeError:
                return {
                    "recommended_actions": [{"action": "Review generated insights", "reason": "AI response was not valid JSON", "risk": "low"}],
                    "priority": "low"
                }
        except Exception as e:
            print(f"Error analyzing for actions: {e}")
            return {
                "recommended_actions": [{"action": "Manual review required", "reason": f"Decision system error: {str(e)}", "risk": "medium"}],
                "priority": "medium"
            }
    
    def filter_executable(self, recommended_actions: List[Dict[str, Any]]) -> tuple:
        """Separate low-risk from medium/high-risk actions (Synchronous is fine for logic)"""
        auto_execute = []
        require_confirmation = []
        
        for action in recommended_actions:
            if action.get("risk") == "low":
                auto_execute.append(action)
            else:
                require_confirmation.append(action)
                
        return auto_execute, require_confirmation