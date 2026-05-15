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
        "that rule. Check shared capabilities before design or workflow work: "
        "Superpowers for planning/TDD/review, Huashu Design for dashboard GUI, "
        "app UI, prototypes, visual direction, and design critique. During setup "
        "or in-place upgrade, compare the saved Lambchop source commit with the "
        "current Lambchop source and repair the repo when it is behind. Hooks "
        "improve active-session quality; automations remain the unattended "
        "execution engine."
    )
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": context,
        }
    }))


if __name__ == "__main__":
    main()
