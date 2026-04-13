import json
from typing import Dict, Any, List
from ..core.ai_client import ai_client

class NeuralATSService:
    def __init__(self):
        self.client = ai_client
        self.model = "openai/gpt-4o"  # High-fidelity for roadmap generation

    async def analyze_resume(self, text: str, structured_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Performs deep Neural ATS analysis on a resume.
        Returns compatibility score, detailed roadmap, and keyword insights.
        """
        try:
            prompt = f"""
            You are an elite Recruitment AI and ATS Expert. Analyze the following resume text and structured data.
            Provide a high-fidelity analysis that helps the candidate reach 99% compatibility with top-tier job openings.

            RESUME TEXT:
            {text[:6000]}

            STRUCTURED DATA:
            {json.dumps(structured_data, indent=2)}

            Return a JSON object with the following fields:
            1. ats_score: (float, 0-100) base score.
            2. competitiveness: (string) 'Low', 'Average', 'High', 'Elite'.
            3. skill_gap_analysis: {{
                "found": [list of key strengths found],
                "missing": [list of high-demand industry skills missing from this profile]
            }}
            4. impact_keywords: {{
                "matched": [list of action-oriented impact words found],
                "missing": [list of power-words used in elite resumes that are missing]
            }}
            5. compatibility_roadmap: [
                {{
                    "phase": "Formatting & Core Structure",
                    "status": "completed/pending/critical",
                    "suggestion": "Detailed instruction on how to fix this phase"
                }},
                {{
                    "phase": "Skill Optimization",
                    "status": "completed/pending/critical",
                    "suggestion": "How to weave missing skills into the profile"
                }},
                {{
                    "phase": "Impact & Quantifiable Results",
                    "status": "completed/pending/critical",
                    "suggestion": "Specific bullets that need metrics (e.g. 'Improved X by Y%')"
                }},
                {{
                    "phase": "Elite Polish",
                    "status": "completed/pending/critical",
                    "suggestion": "Final touches to stand out"
                }}
            ]
            6. overall_summary: (string) 2-3 sentence strategic summary.

            Ensure the JSON is perfectly valid.
            """

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a senior ATS intelligence system. Output only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )

            result = json.loads(response.choices[0].message.content)
            return result
        except Exception as e:
            print(f"Neural ATS Service Error: {e}")
            return {
                "ats_score": 65,
                "competitiveness": "Average",
                "skill_gap_analysis": {"found": [], "missing": ["Error during deep analysis"]},
                "impact_keywords": {"matched": [], "missing": []},
                "compatibility_roadmap": [],
                "overall_summary": "We encountered an error during deep analysis. Please try again or review the basic insights."
            }

ats_service = NeuralATSService()
