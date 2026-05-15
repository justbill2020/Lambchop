import json
import sys


def main():
    try:
        json.load(sys.stdin)
    except Exception:
        pass

    context = (
        "Lambchop repo-local hooks are active. Before editing, read WORKFLOW.md "
        "and the configured docs/<project-slug>/ state, progress, backoff, "
        "scheduled-work-plan, and dashboard data. Treat ordinary bug, feature, "
        "and broken-workflow chats as intake unless the user explicitly overrides "
        "that rule. Hooks improve active-session quality; automations remain the "
        "unattended execution engine."
    )
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": context,
        }
    }))


if __name__ == "__main__":
    main()
