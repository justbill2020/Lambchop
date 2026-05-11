# Upstream Skills

## Principle
Embed Lambchop's project-specific autonomous coding team skill, but install general-purpose agent workflow skills from their current upstream repositories when available.

## Required Local Skill
- `autonomous-coding-team`: provided by this Lambchop repo at `autonomous-coding-team/`.

## Recommended Upstream Skill Pack
Use Superpowers for planning, TDD, debugging, subagent coordination, code review, and verification workflows.

Current upstream:
- Repository: `https://github.com/obra/superpowers`
- Codex guide: `https://github.com/obra/superpowers/blob/main/docs/README.codex.md`
- Codex install prompt: `Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md`

Do not copy Superpowers from a cached plugin folder or from this repo into a target project. Prefer the upstream GitHub repository so future target repos receive the current skills.

## Codex Notes
The Superpowers Codex guide describes linking the upstream `skills/` folder into Codex skill discovery and enabling multi-agent support for subagent-related skills. If multi-agent support is unavailable, record that subagents are unavailable and continue with local critical-path work.

## Target Repo Setup Rule
When deploying Lambchop into another repo:

1. Check whether the required local Lambchop skill is available.
2. Check whether Superpowers is available when the run will use planning, TDD, debugging, subagent, review, or verification workflows.
3. If Superpowers is missing and network/git access is available, install from `https://github.com/obra/superpowers`.
4. If install is blocked, record the blocker and continue with the embedded Lambchop instructions.
