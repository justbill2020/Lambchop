param(
  [string]$Destination = "",
  [ValidateSet('copy','junction')] [string]$Mode = 'copy',
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

function Resolve-CodexSkillsRoot {
  param([string]$Explicit)

  if ($Explicit -and $Explicit.Trim().Length -gt 0) {
    return [System.IO.Path]::GetFullPath($Explicit)
  }

  $home = $env:CODEX_HOME
  if ($home -and $home.Trim().Length -gt 0) {
    return (Join-Path $home 'skills')
  }

  $userProfile = [Environment]::GetFolderPath('UserProfile')
  return (Join-Path $userProfile '.codex\skills')
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$repoRoot = Split-Path -Parent $repoRoot
$source = Join-Path $repoRoot 'autonomous-coding-team'
$skillsRoot = Resolve-CodexSkillsRoot -Explicit $Destination
$target = Join-Path $skillsRoot 'autonomous-coding-team'

Write-Host "Repo root:    $repoRoot"
Write-Host "Source:      $source"
Write-Host "Skills root: $skillsRoot"
Write-Host "Target:      $target"
Write-Host "Mode:        $Mode"

if (-not (Test-Path -LiteralPath $source)) { throw "Source folder missing: $source" }
if (-not (Test-Path -LiteralPath (Join-Path $source 'SKILL.md'))) { throw "Source SKILL.md missing: $(Join-Path $source 'SKILL.md')" }

New-Item -ItemType Directory -Force -Path $skillsRoot | Out-Null

if (Test-Path -LiteralPath $target) {
  if (-not $Force) {
    throw "Target already exists. Re-run with -Force to replace: $target"
  }
  $item = Get-Item -LiteralPath $target -Force
  $isReparsePoint = (($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0)
  if ($isReparsePoint) {
    # Safety: avoid deleting the linked target contents (junction/symlink). Remove only the link itself.
    Remove-Item -LiteralPath $target -Force
  } else {
    Remove-Item -LiteralPath $target -Recurse -Force
  }
}

if ($Mode -eq 'copy') {
  Copy-Item -LiteralPath $source -Destination $target -Recurse -Force
  Write-Host "Installed by copy."
} else {
  New-Item -ItemType Junction -Path $target -Target $source | Out-Null
  Write-Host "Installed by junction."
}

Write-Host "OK: $target"
