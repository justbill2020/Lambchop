param(
  [string]$TargetRoot = (Get-Location).Path,
  [string]$TemplateRoot = (Join-Path (Split-Path $PSScriptRoot -Parent) "assets\templates\.codex")
)

$ErrorActionPreference = "Stop"

function Read-JsonFile($Path, $Fallback) {
  if (-not (Test-Path -LiteralPath $Path)) {
    return $Fallback
  }
  try {
    return Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
  } catch {
    throw "Cannot parse existing hooks file '$Path': $($_.Exception.Message)"
  }
}

function Convert-ToHashtable($Value) {
  if ($null -eq $Value) {
    return @{}
  }
  if ($Value -is [System.Collections.IDictionary]) {
    return $Value
  }
  $result = @{}
  foreach ($property in $Value.PSObject.Properties) {
    $result[$property.Name] = $property.Value
  }
  return $result
}

function Is-LambchopHook($Hook) {
  if ($null -eq $Hook) {
    return $false
  }
  $command = [string]$Hook.command
  return $command -match "lambchop_"
}

$targetCodex = Join-Path $TargetRoot ".codex"
$targetHooksDir = Join-Path $targetCodex "hooks"
$targetHooksJson = Join-Path $targetCodex "hooks.json"
$templateHooksJson = Join-Path $TemplateRoot "hooks.json"
$templateHooksDir = Join-Path $TemplateRoot "hooks"

New-Item -ItemType Directory -Path $targetHooksDir -Force | Out-Null
Copy-Item -Path (Join-Path $templateHooksDir "lambchop_*.py") -Destination $targetHooksDir -Force

$existing = Read-JsonFile $targetHooksJson ([pscustomobject]@{ hooks = [pscustomobject]@{} })
$template = Read-JsonFile $templateHooksJson $null

$existingHooks = Convert-ToHashtable $existing.hooks
$templateHooks = Convert-ToHashtable $template.hooks

foreach ($eventName in $templateHooks.Keys) {
  $existingGroups = @()
  if ($existingHooks.ContainsKey($eventName) -and $null -ne $existingHooks[$eventName]) {
    $existingGroups = @($existingHooks[$eventName])
  }

  $preservedGroups = @()
  foreach ($group in $existingGroups) {
    $groupCopy = [ordered]@{}
    foreach ($property in $group.PSObject.Properties) {
      if ($property.Name -ne "hooks") {
        $groupCopy[$property.Name] = $property.Value
      }
    }

    $preservedHandlers = @()
    foreach ($handler in @($group.hooks)) {
      if (-not (Is-LambchopHook $handler)) {
        $preservedHandlers += $handler
      }
    }

    if ($preservedHandlers.Count -gt 0) {
      $groupCopy["hooks"] = $preservedHandlers
      $preservedGroups += [pscustomobject]$groupCopy
    }
  }

  $existingHooks[$eventName] = @($preservedGroups + @($templateHooks[$eventName]))
}

$merged = [ordered]@{ hooks = [ordered]@{} }
foreach ($key in ($existingHooks.Keys | Sort-Object)) {
  $merged.hooks[$key] = $existingHooks[$key]
}

$json = $merged | ConvertTo-Json -Depth 100
$encoding = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($targetHooksJson, $json + [Environment]::NewLine, $encoding)

Write-Output "Installed Lambchop repo-local hooks at $targetHooksJson"
