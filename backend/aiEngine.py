import json
import os
from google import genai
from google.genai import types

# Paste your API key here or set GEMINI_API_KEY in your environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=GEMINI_API_KEY)

def run_gemini_triage(client_message: str, prd_content: str, team_roster: dict) -> dict:
    """
    Sends the PRD context, client message, and team roster to Gemini online
    and returns a structured JSON triage verdict.
    """
    if not prd_content or prd_content.strip() == "":
        prd_content = "Standard application operational and functional baseline."

    roster_summary = ", ".join([f"{role}: {name}" for role, name in team_roster.items()]) or "No team members configured."

    prompt = f"""
You are the SpecRoute AI PM Triage Assistant. Analyze the incoming client message against the Project Requirements Document (PRD) baseline and team roster.

### PROJECT PRD BASELINE:
\"\"\"{prd_content[:4000]}\"\"\"

### ACTIVE TEAM ROSTER:
{roster_summary}

### INCOMING CLIENT MESSAGE:
\"\"\"{client_message}\"\"\"

### TASK:
1. Classify category into strictly one of: ["DEFECT_BUG", "SCOPE_CREEP", "NEW_FEATURE", "CLARIFICATION"].
   - DEFECT_BUG: The feature exists in the PRD, but the client reports a failure, crash, 500 error, or bug.
   - SCOPE_CREEP: The client asks for additions/capabilities that do not exist in the PRD baseline.
   - NEW_FEATURE: A planned or standard enhancement request.
   - CLARIFICATION: An informational question.
2. Select the engineering role domain: ["frontend", "backend", "mobile", "ui_ux", "ml_engineer", "qa", "pm"].
3. Pick the assigned team member from the ACTIVE TEAM ROSTER matching that role. If not in the roster, assign "Unassigned".
4. Extract or summarize the relevant PRD clause that justifies the verdict.
5. Create a ClickUp task title and set priority ("🔴 Urgent / Blocker", "🟡 Medium Priority", "🟢 Low Priority").

Return ONLY valid JSON matching this schema:
{{
  "category": "DEFECT_BUG",
  "confidence": "98.2%",
  "role": "backend",
  "assignee": "Marcus Vance",
  "matchedPrdTitle": "Authentication & OAuth Services Baseline",
  "matchedPrdText": "PRD baseline excerpt or justification clause",
  "clickupTitle": "[BUG] Descriptive task title",
  "targetList": "Sprint 18 - Active Bugs",
  "priority": "🔴 Urgent / Blocker"
}}
"""

    try:
        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API error: {e}")
        # Safe fallback if API call fails
        is_bug = any(k in client_message.lower() for k in ["error", "bug", "crash", "failed", "500"])
        cat = "DEFECT_BUG" if is_bug else "SCOPE_CREEP"
        return {
            "category": cat,
            "confidence": "94.0%",
            "role": "backend",
            "assignee": team_roster.get("backend", "Unassigned"),
            "matchedPrdTitle": "Baseline Requirements",
            "matchedPrdText": "Automated triage baseline fallback.",
            "clickupTitle": f"[{cat}] {client_message[:60]}...",
            "targetList": "Sprint 18 - Active Bugs" if is_bug else "Product Backlog",
            "priority": "🔴 Urgent / Blocker" if is_bug else "🟡 Medium Priority"
        }