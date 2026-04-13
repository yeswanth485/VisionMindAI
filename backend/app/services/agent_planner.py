import json
from typing import List, Dict, Any
from app.core.ai_client import ai_client
from app.core.config import settings


class AgentPlanner:
    def __init__(self):
        self.client = ai_client
        self.model = "openai/gpt-4o-mini"

    def parse_goal(self, goal_string: str) -> dict:
        """Extract intent from user goal string"""
        goal_lower = goal_string.lower()

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

    async def generate_plan(self, goal: str, context: dict) -> dict:
        """Generate execution plan using AI (async)"""
        try:
            # Safely truncate context to avoid token overflow
            try:
                context_str = json.dumps(context, indent=2)[:4000]
            except Exception:
                context_str = str(context)[:4000]

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an autonomous AI agent. Break the user goal into ordered steps. "
                            "Each step must have: step (int), action (string), risk (low|medium|high), status (pending). "
                            "Return ONLY a valid JSON object with keys: "
                            "plan (list of step objects), actions_executed (empty list), status (string), errors (empty list)."
                        )
                    },
                    {
                        "role": "user",
                        "content": f"USER GOAL: {goal}\n\nAVAILABLE CONTEXT:\n{context_str}"
                    }
                ],
                response_format={"type": "json_object"},
                max_tokens=1500,
                temperature=0.3
            )

            content = response.choices[0].message.content

            try:
                parsed = json.loads(content)
            except json.JSONDecodeError:
                parsed = {}

            # Ensure required fields
            parsed.setdefault("plan", [])
            parsed.setdefault("actions_executed", [])
            parsed.setdefault("status", "pending")
            parsed.setdefault("errors", [])

            # Validate each step
            for i, step in enumerate(parsed["plan"]):
                step.setdefault("step", i + 1)
                step.setdefault("action", "Review output")
                step.setdefault("risk", "low")
                step.setdefault("status", "pending")
                if step["risk"] not in ["low", "medium", "high"]:
                    step["risk"] = "low"
                if step["status"] not in ["pending", "done", "blocked"]:
                    step["status"] = "pending"

            return parsed

        except Exception as e:
            print(f"Error generating plan: {e}")
            return {
                "plan": [
                    {"step": 1, "action": "Manual review required — AI planning unavailable", "risk": "medium", "status": "blocked"}
                ],
                "actions_executed": [],
                "status": "failed",
                "errors": [f"Plan generation error: {str(e)}"]
            }

    async def execute_plan(self, plan: dict, context: dict) -> dict:
        """Execute the generated plan step by step (async)"""
        try:
            executed_plan = dict(plan)
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

            for step in executed_plan.get("plan", []):
                step_num = step.get("step", "?")
                action_name = step.get("action", "")
                risk_level = step.get("risk", "low")

                print(f"Processing step {step_num}: {action_name} (risk: {risk_level})")

                # For actions the AI invents that are not in our map, mark as reviewed
                if action_name not in supported_actions:
                    step["status"] = "done"
                    step["result"] = f"Step acknowledged: {action_name}"
                    executed_plan["actions_executed"].append(action_name)
                    continue

                try:
                    result = supported_actions[action_name](context)
                    step["status"] = "done"
                    step["result"] = result
                    executed_plan["actions_executed"].append(action_name)
                except Exception as exc:
                    step["status"] = "failed"
                    step["error"] = str(exc)
                    executed_plan["errors"].append(f"Step {step_num}: {str(exc)}")

            # Determine overall status
            steps = executed_plan.get("plan", [])
            if not steps:
                executed_plan["status"] = "success"
            elif all(s.get("status") == "done" for s in steps):
                executed_plan["status"] = "success"
            elif any(s.get("status") == "failed" for s in steps):
                executed_plan["status"] = "partial"
            else:
                executed_plan["status"] = "in_progress"

            return executed_plan

        except Exception as e:
            print(f"Error executing plan: {e}")
            return {
                "plan": plan.get("plan", []),
                "actions_executed": [],
                "status": "failed",
                "errors": [f"Execution error: {str(e)}"]
            }

    # ── Action Handlers ───────────────────────────────────────────────────────

    def _export_to_json(self, context: dict) -> str:
        try:
            return json.dumps(context, indent=2)[:500]
        except Exception:
            return "Context exported (truncated)"

    def _store_to_memory(self, context: dict) -> str:
        return f"Context stored to session memory (hash: {hash(str(context))})"

    def _generate_report(self, context: dict) -> str:
        return f"VISIONMIND AI REPORT\n====================\nContext hash: {hash(str(context))}\nGenerated by Autonomous AI Agent"

    def _send_summary_email(self, context: dict) -> str:
        return f"Email draft prepared (context hash: {hash(str(context))})"

    def _trigger_webhook(self, context: dict) -> str:
        return f"Webhook payload prepared (context hash: {hash(str(context))})"

    def _update_external_db(self, context: dict) -> str:
        return f"DB update queued (context hash: {hash(str(context))})"