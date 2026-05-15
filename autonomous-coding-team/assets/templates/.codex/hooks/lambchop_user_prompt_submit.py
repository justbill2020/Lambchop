import json
import re
import sys


INTAKE_PATTERN = re.compile(
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
    if not INTAKE_PATTERN.search(prompt) and not DESIGN_PATTERN.search(prompt):
        return

    context_parts = []
    if INTAKE_PATTERN.search(prompt):
        context_parts.append(
            "This prompt looks like Lambchop project intake. Do not implement the "
            "feature or bug fix in this chat unless the user explicitly says to "
            "override intake-only mode. Investigate enough to capture source-backed "
            "evidence, create a small task-creation plan, queue bounded work in the "
            "state ledger, update progress/dashboard evidence, unpause the project "
            "automation if needed, then trigger a scheduler-visible run-now handoff "
            "so the automation implements the queued task."
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
