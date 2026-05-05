# Work Item Model

## State File Shape
The generated state file under `docs/` includes:

- `project`: identity, workflow paths, branch/worktree conventions, autonomy policy
- `work_items`: ordered queue
- `last_run`: latest summary, active item, and next action

## Statuses
Use only:

- `todo`
- `in_progress`
- `blocked`
- `done`
- `skipped`

## Required Work Item Fields
Each item includes:

- `key`
- `title`
- `type`
- `status`
- `priority`
- `dependencies`
- `source_refs`
- `acceptance_criteria`
- `implementation_notes`
- `validation`
- `branch`
- `worktree`
- `commit`
- `blocker`
- `exclusive_scope`
- `shared_scope`
- `lease`
- `next_step`
- `integration`
- `updated_at`

## Lease Shape
```json
{
  "run_id": null,
  "owner": null,
  "claimed_at": null,
  "expires_at": null,
  "heartbeat_at": null
}
```

Default lease duration is 120 minutes. Default max concurrent runs is 3.

## Integration Shape
```json
{
  "target_branch": "main",
  "status": "not_ready",
  "merged_at": null,
  "merge_commit": null,
  "reconciled_at": null
}
```

## Concurrency Rules
A live `in_progress` item is not a global lock. Another run may select a different eligible item only when:

- dependencies are satisfied
- the item is `todo`
- its `exclusive_scope` does not overlap any live leased item
- concurrency cap has not been reached

Shared files such as root manifests, lockfiles, configs, and docs belong in `shared_scope`. Shared scope overlap does not automatically block work, but it must be recorded as an integration risk and reconciled later.
