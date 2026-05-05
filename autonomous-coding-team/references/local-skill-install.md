# Local Skill Installation (Codex)

This repo contains a Codex skill at `autonomous-coding-team/`. To use it across projects, install (or link) it into your local Codex skills folder.

## Pressure Scenario (What This Doc Must Cover)
- You have `Lambchop` cloned locally.
- You want Codex to load the `autonomous-coding-team` skill without copying files after every change.

## Skill Folder
The skill folder is the `autonomous-coding-team/` directory itself (it contains `SKILL.md`, `agents/`, `references/`, and `assets/`).

Codex typically loads local skills from:
- Windows: `C:\Users\<YOU>\.codex\skills\`
- macOS/Linux: `~/.codex/skills/`

## Recommended: Copy Install (No Admin)
Copying avoids symlink/junction permissions. Re-run it after updating the skill.

Windows (PowerShell 7):
```powershell
# From the Lambchop repo root
pwsh -NoProfile -File autonomous-coding-team\\tools\\install-skill.ps1
```

Custom destination (safe for testing):
```powershell
pwsh -NoProfile -File autonomous-coding-team\\tools\\install-skill.ps1 -Destination C:\\tmp\\codex-skills-sandbox
```

## Optional: Link Instead Of Copy
Linking keeps the skill “live” as you edit it in this repo.

### Windows (PowerShell) — Directory Junction
Directory junctions work without admin in most setups.

1. Decide paths:
   - Source: `<repo>\autonomous-coding-team`
   - Destination: `C:\Users\<YOU>\.codex\skills\autonomous-coding-team`
2. Create the junction:
   - If the destination folder already exists, delete it first.

Recommended (scripted):
```powershell
pwsh -NoProfile -File autonomous-coding-team\\tools\\install-skill.ps1 -Mode junction
```

Manual example:
```powershell
$source = "C:\path\to\Lambchop\autonomous-coding-team"
$dest = "C:\Users\<YOU>\.codex\skills\autonomous-coding-team"

New-Item -ItemType Junction -Path $dest -Target $source
```

To uninstall:
```powershell
Remove-Item "C:\Users\<YOU>\.codex\skills\autonomous-coding-team"
```

### macOS/Linux — Symlink
```bash
ln -s /path/to/Lambchop/autonomous-coding-team ~/.codex/skills/autonomous-coding-team
```

To uninstall:
```bash
rm ~/.codex/skills/autonomous-coding-team
```

## Verify
After linking/copying:
- Restart Codex (or reload skills if supported).
- Confirm the `autonomous-coding-team` skill is available and can be invoked by name.

## Notes / Non-Goals
- This is Codex-first installation. Cursor / Claude Code compatibility is explicitly out-of-scope for v1.
