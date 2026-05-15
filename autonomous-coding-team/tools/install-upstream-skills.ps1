param(
  [string]$Destination = "",
  [string]$CodexHome = "",
  [string]$ManifestPath = "",
  [string]$SourceOverridesJson = "",
  [switch]$CheckOnly,
  [switch]$Upgrade
)

$ErrorActionPreference = 'Stop'

function Resolve-CodexHome {
  param([string]$Explicit)

  if ($Explicit -and $Explicit.Trim().Length -gt 0) {
    return [System.IO.Path]::GetFullPath($Explicit)
  }
  if ($env:CODEX_HOME -and $env:CODEX_HOME.Trim().Length -gt 0) {
    return [System.IO.Path]::GetFullPath($env:CODEX_HOME)
  }
  return (Join-Path ([Environment]::GetFolderPath('UserProfile')) '.codex')
}

function Resolve-SkillsRoot {
  param([string]$Explicit, [string]$CodexHomePath)

  if ($Explicit -and $Explicit.Trim().Length -gt 0) {
    return [System.IO.Path]::GetFullPath($Explicit)
  }
  return (Join-Path $CodexHomePath 'skills')
}

function Convert-ToHashtable {
  param($Value)

  $result = @{}
  if ($null -eq $Value) { return $result }
  foreach ($property in $Value.PSObject.Properties) {
    $result[$property.Name] = $property.Value
  }
  return $result
}

function Read-JsonFile {
  param([string]$Path, $Default)

  if (-not $Path -or $Path.Trim().Length -eq 0) { return $Default }
  if (-not (Test-Path -LiteralPath $Path)) { return $Default }
  return (Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json)
}

function Invoke-Git {
  param([string[]]$GitArgs, [string]$WorkingDirectory = "")

  $oldLocation = Get-Location
  $oldErrorActionPreference = $ErrorActionPreference
  try {
    if ($WorkingDirectory) { Set-Location -LiteralPath $WorkingDirectory }
    $ErrorActionPreference = 'Continue'
    $output = & git @GitArgs 2>&1
    if ($LASTEXITCODE -ne 0) {
      throw "git $($GitArgs -join ' ') failed: $($output -join [Environment]::NewLine)"
    }
    return (($output | Out-String).Trim())
  }
  finally {
    $ErrorActionPreference = $oldErrorActionPreference
    Set-Location -LiteralPath $oldLocation
  }
}

function Get-LatestCommit {
  param([string]$Source)

  if (Test-Path -LiteralPath $Source) {
    return Invoke-Git -GitArgs @('-C', $Source, 'rev-parse', 'HEAD')
  }
  $line = Invoke-Git -GitArgs @('ls-remote', $Source, 'HEAD')
  return (($line -split '\s+')[0])
}

function Copy-SafeDirectory {
  param([string]$Source, [string]$Target)

  if (Test-Path -LiteralPath $Target) {
    $item = Get-Item -LiteralPath $Target -Force
    $isReparsePoint = (($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0)
    if ($isReparsePoint) {
      Remove-Item -LiteralPath $Target -Force
    } else {
      Remove-Item -LiteralPath $Target -Recurse -Force
    }
  }
  Copy-Item -LiteralPath $Source -Destination $Target -Recurse -Force
}

function Clone-Source {
  param([string]$Source, [string]$WorkRoot, [string]$Name)

  $clonePath = Join-Path $WorkRoot $Name
  if (Test-Path -LiteralPath $Source) {
    Invoke-Git -GitArgs @('clone', $Source, $clonePath) | Out-Null
  } else {
    Invoke-Git -GitArgs @('clone', '--depth', '1', $Source, $clonePath) | Out-Null
  }
  return $clonePath
}

function Test-SingleSkillAvailable {
  param([string]$SkillsRoot, $Skill)

  $targetName = if ($Skill.target_name) { $Skill.target_name } else { $Skill.name }
  return (Test-Path -LiteralPath (Join-Path (Join-Path $SkillsRoot $targetName) 'SKILL.md'))
}

function Test-CollectionAvailable {
  param([string]$SkillsRoot, [string]$SourcePath)

  $skillDirs = Get-ChildItem -LiteralPath $SourcePath -Directory | Where-Object {
    Test-Path -LiteralPath (Join-Path $_.FullName 'SKILL.md')
  }
  if (-not $skillDirs.Count) { return $false }
  foreach ($dir in $skillDirs) {
    if (-not (Test-Path -LiteralPath (Join-Path (Join-Path $SkillsRoot $dir.Name) 'SKILL.md'))) {
      return $false
    }
  }
  return $true
}

function Install-Skill {
  param([string]$SkillsRoot, $Skill, [string]$ClonePath)

  $sourcePath = Join-Path $ClonePath $Skill.skill_path
  if ($Skill.install_type -eq 'single_skill') {
    if (-not (Test-Path -LiteralPath (Join-Path $sourcePath 'SKILL.md'))) {
      throw "SKILL.md missing for $($Skill.name) at $sourcePath"
    }
    $targetName = if ($Skill.target_name) { $Skill.target_name } else { $Skill.name }
    Copy-SafeDirectory -Source $sourcePath -Target (Join-Path $SkillsRoot $targetName)
    return
  }

  if ($Skill.install_type -ne 'skill_collection') {
    throw "Unsupported install_type '$($Skill.install_type)' for $($Skill.name)"
  }

  $skillDirs = Get-ChildItem -LiteralPath $sourcePath -Directory | Where-Object {
    Test-Path -LiteralPath (Join-Path $_.FullName 'SKILL.md')
  }
  if (-not $skillDirs.Count) {
    throw "No skill directories found for $($Skill.name) at $sourcePath"
  }
  foreach ($dir in $skillDirs) {
    Copy-SafeDirectory -Source $dir.FullName -Target (Join-Path $SkillsRoot $dir.Name)
  }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$repoRoot = Split-Path -Parent $repoRoot
if (-not $ManifestPath) {
  $ManifestPath = Join-Path $repoRoot 'autonomous-coding-team\references\core-upstream-skills.json'
}

$codexHomePath = Resolve-CodexHome -Explicit $CodexHome
$skillsRoot = Resolve-SkillsRoot -Explicit $Destination -CodexHomePath $codexHomePath
$manifest = Read-JsonFile -Path $ManifestPath -Default $null
if ($null -eq $manifest) { throw "Manifest not found: $ManifestPath" }
$overrides = Convert-ToHashtable (Read-JsonFile -Path $SourceOverridesJson -Default ([pscustomobject]@{}))
$registryPath = Join-Path $codexHomePath $manifest.registry_file
$registryDir = Split-Path -Parent $registryPath
$registry = Read-JsonFile -Path $registryPath -Default ([pscustomobject]@{
  version = 1
  updated_at = $null
  capabilities = [pscustomobject]@{}
})
$capabilities = Convert-ToHashtable $registry.capabilities

New-Item -ItemType Directory -Force -Path $skillsRoot | Out-Null
New-Item -ItemType Directory -Force -Path $registryDir | Out-Null

$workRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("lambchop-upstream-skills-" + [System.Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $workRoot | Out-Null

try {
  foreach ($skill in @($manifest.skills)) {
    $source = if ($overrides.ContainsKey($skill.name)) { [string]$overrides[$skill.name] } else { [string]$skill.repository }
    $latestCommit = Get-LatestCommit -Source $source
    $existing = if ($capabilities.ContainsKey($skill.name)) { $capabilities[$skill.name] } else { $null }
    $installedCommit = if ($existing -and $existing.installed_commit) { [string]$existing.installed_commit } else { $null }
    $clonePath = Clone-Source -Source $source -WorkRoot $workRoot -Name $skill.name
    $sourceSkillPath = Join-Path $clonePath $skill.skill_path
    $available = if ($skill.install_type -eq 'single_skill') {
      Test-SingleSkillAvailable -SkillsRoot $skillsRoot -Skill $skill
    } else {
      Test-CollectionAvailable -SkillsRoot $skillsRoot -SourcePath $sourceSkillPath
    }

    $status = 'available'
    $action = 'available'
    $shouldInstall = (-not $available)
    $shouldUpgrade = ($available -and $installedCommit -and $installedCommit -ne $latestCommit -and $Upgrade)
    if ($shouldInstall -or $shouldUpgrade) {
      if ($CheckOnly) {
        $status = if ($shouldInstall) { 'missing' } else { 'update_available' }
        $action = $status
      } else {
        Install-Skill -SkillsRoot $skillsRoot -Skill $skill -ClonePath $clonePath
        $installedCommit = $latestCommit
        $status = if ($shouldInstall) { 'installed' } else { 'updated' }
        $action = $status
      }
    } elseif ($available -and $installedCommit -and $installedCommit -ne $latestCommit) {
      $status = 'update_available'
      $action = 'update_available'
    } elseif ($available -and -not $installedCommit) {
      $installedCommit = $latestCommit
      $status = 'available'
      $action = 'available'
    } elseif (-not $available) {
      $status = 'missing'
      $action = 'missing'
    }

    $capabilities[$skill.name] = [ordered]@{
      name = $skill.name
      display_name = $skill.display_name
      repository = $skill.repository
      source = $source
      install_type = $skill.install_type
      skill_path = $skill.skill_path
      status = $status
      installed_commit = $installedCommit
      latest_commit = $latestCommit
      checked_at = (Get-Date).ToUniversalTime().ToString('o')
      use_when = $skill.use_when
    }
    Write-Output "$action`: $($skill.name)@$latestCommit"
  }
}
finally {
  if (Test-Path -LiteralPath $workRoot) {
    Remove-Item -LiteralPath $workRoot -Recurse -Force
  }
}

$orderedCapabilities = [ordered]@{}
foreach ($key in ($capabilities.Keys | Sort-Object)) {
  $orderedCapabilities[$key] = $capabilities[$key]
}
$output = [ordered]@{
  version = 1
  updated_at = (Get-Date).ToUniversalTime().ToString('o')
  capabilities = $orderedCapabilities
}
$json = $output | ConvertTo-Json -Depth 12
[System.IO.File]::WriteAllText($registryPath, $json + [Environment]::NewLine, (New-Object System.Text.UTF8Encoding($false)))
Write-Output "registry: $registryPath"
