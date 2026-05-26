# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the label strings Lambchop should use in GitHub Issues.

| Label in skills | Label in GitHub Issues | Meaning |
| --- | --- | --- |
| `needs-triage` | `needs-triage` | Maintainer needs to evaluate this issue |
| `needs-info` | `needs-info` | Waiting on reporter for more information |
| `ready-for-agent` | `ready-for-agent` | Fully specified, ready for an AFK agent |
| `ready-for-human` | `ready-for-human` | Requires human implementation or decision |
| `wontfix` | `wontfix` | Will not be actioned |

When a skill mentions a role such as "apply the AFK-ready triage label", use the corresponding GitHub label from this table.

If the GitHub repository does not have one of these labels, record that missing-label blocker in Lambchop state/progress/dashboard evidence before using a fallback label.
