import json
import re
import sys
from pathlib import Path


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
TWO_PHASE_PATTERN = re.compile(
    r"\b(two[- ]phase|planning\s*/\s*scheduling|planning-only|plan-and-execute|plan\s+and\s+execute)\b",
    re.IGNORECASE,
)
QUEUED_TASK_CAPTURE_PATTERN = re.compile(
    r"\b(?:queued|schedule(?:d)?|created|added)\s+`?(task-[0-9a-z_-]+)`?\b",
    re.IGNORECASE,
)
IMPLEMENTED_TASK_CAPTURE_PATTERN = re.compile(
    r"\b(?:implemented|fixed|patched|refactored|completed)\s+`?(task-[0-9a-z_-]+)`?\b",
    re.IGNORECASE,
)

def read_chat_mode():
    candidates = [Path("docs/lambchop/state.json")]
    docs_dir = Path("docs")
    if docs_dir.exists():
        for path in docs_dir.glob("*/state.json"):
            candidates.append(path)

    for path in candidates:
        if not path.exists():
            continue
        try:
            state = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        return ((state.get("project") or {}).get("chat_policy") or {}).get("mode")
    return None


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        payload = {}

    if payload.get("stop_hook_active"):
        print(json.dumps({"continue": True}))
        return

    message = str(payload.get("last_assistant_message") or "")
    chat_mode = read_chat_mode()
    if chat_mode == "maintenance":
        print(json.dumps({"continue": True}))
        return
    queued_task_ids = {m.group(1).lower() for m in QUEUED_TASK_CAPTURE_PATTERN.finditer(message)}
    implemented_task_ids = {m.group(1).lower() for m in IMPLEMENTED_TASK_CAPTURE_PATTERN.finditer(message)}
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

    overlap = sorted(queued_task_ids.intersection(implemented_task_ids))
    if overlap:
        print(json.dumps({
            "decision": "block",
            "reason": (
                "Two-phase contract: do not schedule/queue and implement the same work item in one turn. "
                f"Detected queued+implemented overlap: {', '.join(overlap)}. Queue the runnable work, "
                "record handoff evidence, and rely on a fresh scheduler-visible automation run to execute it."
            ),
        }))
        return

    if TWO_PHASE_PATTERN.search(message) and not QUEUED_PATTERN.search(message):
        print(json.dumps({
            "decision": "block",
            "reason": (
                "Two-phase loop explanations must not stop at a summary. Queue a concrete bounded work item, "
                "record progress/dashboard/backoff evidence, unpause or confirm ACTIVE automation status, "
                "and trigger a scheduler-visible run-now handoff (or record the exact blocker)."
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
