import json
import os
from typing import List, Dict, Any

from ..core.ai_client import ai_client as client


async def suggest_actions(structured_json: Dict[str, Any], doc_type: str, risk_level: str) -> List[Dict[str, Any]]:
    """Suggest actions based on document data using GPT via OpenRouter"""

    try:
        data_str = json.dumps(structured_json, indent=2)[:3000]
    except Exception:
        data_str = str(structured_json)[:3000]

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

Provide 2-4 actionable items based on the document analysis.
Only return the JSON object, no additional text.
"""

    try:
        response = await client.chat.completions.create(
            model="openai/gpt-3.5-turbo",  # OpenRouter requires provider prefix
            messages=[
                {
                    "role": "system",
                    "content": "You are an AI assistant that suggests business actions. Return only valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=400
        )

        result_text = response.choices[0].message.content.strip()
        result = json.loads(result_text)
        actions = result.get("actions", [])

        validated = []
        for action in actions:
            if isinstance(action, dict) and "label" in action:
                validated.append({
                    "label": str(action["label"]),
                    "priority": action.get("priority", "medium"),
                    "icon": action.get("icon", "➡️")
                })

        return validated

    except Exception as e:
        print(f"Action engine error: {e}")
        return [
            {"label": "Review Document", "priority": "medium", "icon": "👁️"},
            {"label": "Validate Data", "priority": "high" if risk_level == "high" else "medium", "icon": "🔍"}
        ]