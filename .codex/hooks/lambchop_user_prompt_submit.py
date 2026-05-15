import json
import re
import sys


INTAKE_PATTERN = re.compile(
    r"\b(bug|broken|breaks|failing|failure|fix|feature|add|implement|regression|issue|problem)\b",
    re.IGNORECASE,
)


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        payload = {}

    prompt = str(payload.get("prompt", ""))
    if not INTAKE_PATTERN.search(prompt):
        return

    context = (
        "This prompt looks like Lambchop project intake. Do not implement the "
        "feature or bug fix in this chat unless the user explicitly says to "
        "override intake-only mode. Investigate enough to capture source-backed "
        "evidence, create a small task-creation plan, queue bounded work in the "
        "state ledger, update progress/dashboard evidence, unpause the project "
        "automation if needed, then trigger a scheduler-visible run-now handoff "
        "so the automation implements the queued task."
    )
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": context,
        }
    }))


if __name__ == "__main__":
    main()
