import json
import os
from typing import List, Dict, Any
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def suggest_actions(structured_json: Dict[str, Any], doc_type: str, risk_level: str) -> List[Dict[str, Any]]:
    """Suggest actions based on document data using GPT"""
    
    # Convert structured JSON to string for prompt
    data_str = json.dumps(structured_json, indent=2)
    
    # Prepare prompt for GPT
    prompt = f"""
Given this document data:
{data_str}

Document type: {doc_type}
Risk level: {risk_level}

Return STRICT JSON with the following format:
{{
  "actions": [
    {{
      "label": "Action Label",
      "priority": "high|medium|low",
      "icon": "emoji or symbol"
    }}
  ]
}}

Provide 2-4 actionable items based on the document analysis. Consider:
- Document type specific actions (invoice approval, receipt validation, ID verification)
- Risk level appropriate actions (high risk needs more scrutiny)
- Data quality issues that need addressing
- Compliance or validation requirements
- Business process next steps

Only return the JSON object, no additional text.
"""

    try:
        # Generate response using new AsyncOpenAI client
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are an AI assistant that suggests business actions based on document analysis. Return only valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=300
        )
        
        # Parse the response
        result_text = response.choices[0].message.content.strip()
        
        # Extract JSON from response (handle potential extra text)
        if result_text.startswith("{"):
            result = json.loads(result_text)
        else:
            # Try to find JSON in the response
            start_idx = result_text.find("{")
            end_idx = result_text.rfind("}") + 1
            if start_idx >= 0 and end_idx > start_idx:
                json_str = result_text[start_idx:end_idx]
                result = json.loads(json_str)
            else:
                raise ValueError("No valid JSON found in response")
        
        # Validate and return actions
        actions = result.get("actions", [])
        
        # Ensure each action has required fields
        validated_actions = []
        for action in actions:
            if isinstance(action, dict) and "label" in action:
                validated_action = {
                    "label": str(action["label"]),
                    "priority": action.get("priority", "medium"),
                    "icon": action.get("icon", "➡️")
                }
                validated_actions.append(validated_action)
        
        return validated_actions
        
    except Exception as e:
        print(f"Action engine error: {e}")
        # Fallback actions if GPT fails
        return [
            {
                "label": "Review Document",
                "priority": "medium",
                "icon": "👁️"
            },
            {
                "label": "Validate Data",
                "priority": "high" if risk_level == "high" else "medium",
                "icon": "🔍"
            }
        ]