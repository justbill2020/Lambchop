import json
import re
import sys


EVIDENCE_PATTERN = re.compile(
    r"\b(validation|validated|test|tests|progress\.md|state\.json|dashboard|backoff|queued|blocker|scheduler|rrule|paused|unpaused)\b",
    re.IGNORECASE,
)
COMMIT_PATTERN = re.compile(r"\b(commit|committed|git commit|commit [0-9a-f]{7,40})\b", re.IGNORECASE)
PUSH_PATTERN = re.compile(r"\b(push|pushed|git push|github)\b", re.IGNORECASE)

QUEUED_PATTERN = re.compile(r"\b(queued|queue|todo|work item|task-[0-9a-z_-]+)\b", re.IGNORECASE)
HANDOFF_PATTERN = re.compile(r"\b(triggered|trigger|run-now|scheduler-visible|next_run_at)\b", re.IGNORECASE)
UNPAUSE_PATTERN = re.compile(r"\b(unpaused|already active|active automation|automation active)\b", re.IGNORECASE)
IMPLEMENTED_CHAT_PATTERN = re.compile(
    r"\b(implemented|fixed|added|changed|updated the code|patched|refactored)\b",
    re.IGNORECASE,
)
AUTOMATION_CONTEXT_PATTERN = re.compile(
    r"\b(automation run|scheduled run|work item|queued|intake|run-now|scheduler-visible|explicit override)\b",
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
    github_publish_required = bool(payload.get("github_repo")) and (
        bool(payload.get("workflow_allows_push")) or bool(payload.get("user_requested_push"))
    )
    if github_publish_required and EVIDENCE_PATTERN.search(message) and (
        not COMMIT_PATTERN.search(message) or not PUSH_PATTERN.search(message)
    ):
        print(json.dumps({
            "decision": "block",
            "reason": (
                "This is a GitHub repo with push enabled or requested. Before stopping, commit the completed "
                "changes, push the branch to GitHub, and record commit/push evidence with validation and ledger updates. "
                "Do not push if workflow safety still forbids publishing; record that blocker instead."
            ),
        }))
        return

    if QUEUED_PATTERN.search(message) and not HANDOFF_PATTERN.search(message):
        print(json.dumps({
            "decision": "block",
            "reason": (
                "Feature/bug intake must not stop after only queuing work. Record the queued task, "
                "unpause the project automation if needed, trigger a scheduler-visible run-now handoff, "
                "and record progress/dashboard/backoff evidence."
            ),
        }))
        return

    if QUEUED_PATTERN.search(message) and not UNPAUSE_PATTERN.search(message):
        print(json.dumps({
            "decision": "block",
            "reason": (
                "Feature/bug intake handoff must record whether the automation was unpaused or already active "
                "before the scheduler-visible trigger."
            ),
        }))
        return

    if IMPLEMENTED_CHAT_PATTERN.search(message) and not AUTOMATION_CONTEXT_PATTERN.search(message):
        print(json.dumps({
            "decision": "block",
            "reason": (
                "This looks like implementation work in an ordinary chat. Lambchop feature/bug chats "
                "should act as intake: create tasks, hand off to automation, or state an explicit user override."
            ),
        }))
        return

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
