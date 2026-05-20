import json
import re
import sys
from pathlib import Path


def workflow_allows_push() -> bool:
    state_path = Path("docs/lambchop/state.json")
    if not state_path.exists():
        return False
    try:
        state = json.loads(state_path.read_text(encoding="utf-8"))
    except Exception:
        return False
    return bool((state.get("project") or {}).get("autonomy_policy", {}).get("may_push"))


BLOCK_RULES = [
    (re.compile(r"\bgit\s+reset\s+--hard\b", re.IGNORECASE), "destructive git reset is forbidden"),
    (re.compile(r"\bgit\s+clean\b.*\s-[^\s]*f", re.IGNORECASE), "destructive git clean is forbidden"),
    (re.compile(r"\bgit\s+push\b", re.IGNORECASE), "publishing branches is forbidden by default"),
    (re.compile(r"\bgh\s+pr\s+create\b|\bhub\s+pull-request\b", re.IGNORECASE), "opening pull requests is forbidden by default"),
    (re.compile(r"\b(vercel|netlify|fly|railway|render|firebase)\s+deploy\b", re.IGNORECASE), "deployment is forbidden by default"),
    (re.compile(r"\b(kubectl|helm)\s+(apply|delete|upgrade|install)\b", re.IGNORECASE), "production-style infrastructure mutation is forbidden by default"),
    (re.compile(r"\b(linear|jira)\b.*\b(create|update|delete|close)\b", re.IGNORECASE), "external tracker mutation is forbidden by default"),
]

QUALITY_RULES = [
    (re.compile(r"\bautomation_update\b|\bnext_run_at\b|\bautomation\.toml\b", re.IGNORECASE),
     "Automation schedule/status work must preserve the parked weekly anchor, pause before maintenance, and record scheduler evidence."),
]


def command_from(payload):
    tool_input = payload.get("tool_input") or {}
    if isinstance(tool_input, dict):
        command = tool_input.get("command")
        if command is None:
            command = json.dumps(tool_input)
        return str(command)
    return str(tool_input)


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        payload = {}

    command = command_from(payload)
    if re.search(r"\bgit\s+pu" r"sh\b", command, flags=re.IGNORECASE) and workflow_allows_push():
        allow_rules = [
            rule for rule in BLOCK_RULES
            if not rule[0].pattern.lower().startswith(r"\bgit\s+push\b")
        ]
    else:
        allow_rules = BLOCK_RULES

    for pattern, reason in allow_rules:
        if pattern.search(command):
            print(json.dumps({
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": f"Lambchop guardrail: {reason}. Update WORKFLOW.md and get explicit user approval before doing this.",
                }
            }))
            return

    for pattern, context in QUALITY_RULES:
        if pattern.search(command):
            print(json.dumps({
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "additionalContext": f"Lambchop quality context: {context}",
                }
            }))
            return


if __name__ == "__main__":
    main()
