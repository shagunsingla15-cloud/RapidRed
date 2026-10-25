import os
import requests

NOTION_TOKEN = os.environ.get("NOTION_TOKEN")
NOTION_DATABASE_ID = os.environ.get("NOTION_DATABASE_ID")
NOTION_VERSION = "2022-06-28"

_PAGES = {}


def _headers():
    return {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }


def _enabled():
    return bool(os.environ.get("NOTION_TOKEN") and os.environ.get("NOTION_DATABASE_ID"))


def log_request(req_id, blood_group, units, hospital, rider, eta_minutes):
    if not _enabled():
        return
    try:
        body = {
            "parent": {"database_id": NOTION_DATABASE_ID},
            "properties": {
                "Request ID": {"title": [{"text": {"content": req_id}}]},
                "Blood Group": {"select": {"name": blood_group}},
                "Units": {"number": units},
                "Hospital": {"rich_text": [{"text": {"content": hospital}}]},
                "Rider": {"rich_text": [{"text": {"content": rider}}]},
                "Status": {"select": {"name": "Dispatched"}},
                "ETA Minutes": {"number": eta_minutes},
            },
        }
        r = requests.post("https://api.notion.com/v1/pages", headers=_headers(), json=body, timeout=10)
        if r.ok:
            _PAGES[req_id] = r.json()["id"]
        else:
            print("Notion log_request failed:", r.status_code, r.text[:200])
    except Exception as e:
        print("Notion log_request error:", e)


def _find_page(req_id):
    try:
        body = {"filter": {"property": "Request ID", "title": {"equals": req_id}}, "page_size": 1}
        r = requests.post(
            f"https://api.notion.com/v1/databases/{NOTION_DATABASE_ID}/query",
            headers=_headers(), json=body, timeout=10,
        )
        if r.ok and r.json().get("results"):
            return r.json()["results"][0]["id"]
        if not r.ok:
            print("Notion find_page failed:", r.status_code, r.text[:200])
    except Exception as e:
        print("Notion find_page error:", e)
    return None


def mark_delivered(req_id):
    if not _enabled():
        return
    page_id = _PAGES.get(req_id) or _find_page(req_id)
    if not page_id:
        print("Notion mark_delivered: no row found for", req_id)
        return
    try:
        body = {"properties": {"Status": {"select": {"name": "Delivered"}}}}
        r = requests.patch(f"https://api.notion.com/v1/pages/{page_id}", headers=_headers(), json=body, timeout=10)
        if not r.ok:
            print("Notion mark_delivered failed:", r.status_code, r.text[:200])
    except Exception as e:
        print("Notion mark_delivered error:", e)