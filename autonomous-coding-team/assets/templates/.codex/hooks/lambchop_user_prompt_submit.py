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
        "This prompt looks like Lambchop project intake. Investigate enough to "
        "capture source-backed evidence, then queue bounded work in the state "
        "ledger and update progress/dashboard evidence unless the user explicitly "
        "says this chat should implement now."
    )
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": context,
        }
    }))


if __name__ == "__main__":
    main()
