import os
import requests

CLICKUP_API_TOKEN = os.getenv("CLICKUP_API_TOKEN", "").strip()
DEFAULT_LIST_ID = os.getenv("CLICKUP_LIST_ID", "901215592283").strip()


def map_priority_to_clickup(priority_str: str) -> int:
    """
    ClickUp API Priority Mapping:
    1 = Urgent, 2 = High, 3 = Normal, 4 = Low
    """
    if not priority_str:
        return 3
    p = priority_str.lower()
    if "urgent" in p or "blocker" in p:
        return 1
    elif "high" in p:
        return 2
    elif "medium" in p or "normal" in p:
        return 3
    return 4


def create_clickup_task(
    title: str,
    category: str,
    role: str,
    assignee: str,
    priority_str: str = "🟡 Medium Priority",
    prd_reference: str = "",
    list_id: str = DEFAULT_LIST_ID
) -> dict:
    """
    Creates a real task card in ClickUp via the ClickUp REST API v2.
    """
    if not CLICKUP_API_TOKEN or "YOUR_CLICKUP" in CLICKUP_API_TOKEN:
        return {"success": False, "error": "ClickUp API token not configured."}

    # Automatically extract numeric ID if a full ClickUp URL was provided
    clean_list_id = list_id.rstrip("/").split("/")[-1]

    url = f"https://api.clickup.com/api/v2/list/{clean_list_id}/task"

    headers = {
        "Authorization": CLICKUP_API_TOKEN,
        "Content-Type": "application/json"
    }

    description = (
        f"**Triaged via SpecRoute AI**\n\n"
        f"- **Category:** {category}\n"
        f"- **Target Domain:** {role.upper()}\n"
        f"- **Assigned Resource:** {assignee}\n"
        f"- **PRD Grounding:** {prd_reference or 'N/A'}\n"
    )

    payload = {
        "name": title,
        "markdown_content": description,
        "priority": map_priority_to_clickup(priority_str),
        "tags": [category.lower(), role.lower()]
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        if response.status_code in (200, 201):
            data = response.json()
            return {
                "success": True,
                "clickup_id": data.get("id"),
                "clickup_url": data.get("url")
            }
        else:
            print(f"ClickUp API Error ({response.status_code}): {response.text}")
            return {"success": False, "error": response.text}
    except Exception as e:
        print(f"ClickUp Request Exception: {e}")
        return {"success": False, "error": str(e)}