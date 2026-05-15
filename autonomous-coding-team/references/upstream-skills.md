# Upstream Skills

## Principle
Embed Lambchop's project-specific autonomous coding team skill, but install general-purpose agent workflow skills from their current upstream repositories when available.

## Required Local Skill
- `autonomous-coding-team`: provided by this Lambchop repo at `autonomous-coding-team/`.

## Shared First-Run Capability Pattern
Use the same pattern as the shared Lambchop dashboard hub:

1. Check whether the shared capability already exists.
2. Install it once when missing.
3. Reuse the existing install for later target repos.
4. Record exact source commits and blockers.
5. During setup or in-place upgrade, compare saved commits to the latest checked commit and record `update_available` or perform the approved upgrade.

Use `../tools/install-upstream-skills.ps1` with `core-upstream-skills.json` for the Codex-first bootstrap path. It writes `$CODEX_HOME/lambchop/shared-capabilities.json`.

## Required Upstream Skill Packs
Use Superpowers for planning, TDD, debugging, subagent coordination, code review, and verification workflows.

Current upstream:
- Repository: `https://github.com/obra/superpowers`
- Codex guide: `https://github.com/obra/superpowers/blob/main/docs/README.codex.md`
- Codex install prompt: `Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md`

Do not copy Superpowers from a cached plugin folder or from this repo into a target project. Prefer the upstream GitHub repository so future target repos receive the current skills.

Use Huashu Design for dashboard GUI, app UI, prototypes, mockups, visual direction exploration, motion/infographic/slide work, and design critique.

Current upstream:
- Repository: `https://github.com/alchaincyf/huashu-design`
- Skill name: `huashu-design`

Do not require the user to explain Huashu to every project. Lambchop setup and in-place upgrade should make Huashu available as a shared upstream skill and record whether it is installed, available, missing, blocked, or update-available.

## Codex Notes
The Superpowers Codex guide describes linking the upstream `skills/` folder into Codex skill discovery and enabling multi-agent support for subagent-related skills. If multi-agent support is unavailable, record that subagents are unavailable and continue with local critical-path work.

## Target Repo Setup Rule
When deploying or upgrading Lambchop in another repo:

1. Check whether the required local Lambchop skill is available.
2. Check shared capability status for Superpowers and Huashu Design.
3. If a core upstream skill is missing and network/git access is available, install it from its upstream repository.
4. If an installed skill's saved commit differs from latest, record `update_available`; upgrade during setup/upgrade/maintenance, not mid-task.
5. If install or update is blocked, record the blocker and continue with the embedded Lambchop instructions.
6. Record the Lambchop source commit used for the target repo setup/upgrade so future runs can check whether the repo is behind the current Lambchop source.
