import json
import re
import sys


EVIDENCE_PATTERN = re.compile(
    r"\b(validation|validated|test|tests|progress\.md|state\.json|dashboard|backoff|queued|blocker|scheduler|rrule|paused|unpaused)\b",
    re.IGNORECASE,
)


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        payload = {}

    if payload.get("stop_hook_active"):
        print(json.dumps({"continue": True}))
        return

    message = str(payload.get("last_assistant_message") or "")
    if EVIDENCE_PATTERN.search(message):
        print(json.dumps({"continue": True}))
        return

    print(json.dumps({
        "decision": "block",
        "reason": (
            "Before stopping, check Lambchop completion evidence: queued work or explicit no-work reason, "
            "validation result, ledger updates, dashboard/backoff status, and scheduler pause/RRULE status."
        ),
    }))


if __name__ == "__main__":
    main()
