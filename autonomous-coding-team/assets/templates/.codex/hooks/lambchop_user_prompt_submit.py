import json
import re
import sys


EXECUTION_PATTERN = re.compile(
    r"\b(bug|broken|breaks|failing|failure|fix|feature|add|implement|regression|issue|problem)\b",
    re.IGNORECASE,
)
DESIGN_PATTERN = re.compile(
    r"\b(ui|gui|dashboard|design|prototype|mockup|visual|layout|style|polish|animation|slide|infographic)\b",
    re.IGNORECASE,
)


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        payload = {}

    prompt = str(payload.get("prompt", ""))
    if not EXECUTION_PATTERN.search(prompt) and not DESIGN_PATTERN.search(prompt):
        return

    context_parts = []
    if EXECUTION_PATTERN.search(prompt):
        context_parts.append(
            "This prompt looks like Lambchop execution work. Diagnose the problem "
            "first, then implement directly when the work is bounded and you can "
            "leave source-of-truth evidence on the integration branch in this turn. "
            "Keep the change inside the smallest responsible work scope, use TDD, "
            "update progress/dashboard/backoff/state evidence, and only use a "
            "scheduler-visible run-now handoff when you intentionally defer the "
            "remaining work instead of finishing it now."
        )
    if DESIGN_PATTERN.search(prompt):
        context_parts.append(
            "This prompt involves UI or visual design. Check/install the shared "
            "Huashu Design skill first, then use it for dashboard GUI, app UI, "
            "prototype, visual direction, or design critique work before changing "
            "the user-facing interface."
        )
    context = " ".join(context_parts)
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": context,
        }
    }))


if __name__ == "__main__":
    main()
