import json
import sys


def stringify(value):
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    return json.dumps(value)


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        payload = {}

    tool_input = payload.get("tool_input") or {}
    tool_response = payload.get("tool_response") or {}
    command = stringify(tool_input.get("command") if isinstance(tool_input, dict) else tool_input)
    response_text = stringify(tool_response)
    lower = f"{command}\n{response_text}".lower()

    contexts = []
    if any(token in lower for token in ["exit_code\": 1", "exit_code: 1", "failed", "failing", "error"]):
        contexts.append("record failing validation evidence in progress, state, dashboard data, and backoff before moving on")
    if any(token in lower for token in ["apply_patch", "edit", "write"]):
        contexts.append("after edits, keep ledgers and dashboard evidence aligned with real workflow changes")
    if any(token in lower for token in ["automation", "scheduler", "rrule", "next_run_at"]):
        contexts.append("record scheduler status, pause/unpause evidence, parked RRULE, and any blocker")

    if contexts:
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PostToolUse",
                "additionalContext": "Lambchop follow-up: " + "; ".join(contexts) + ".",
            }
        }))


if __name__ == "__main__":
    main()
