param(
    [switch]$Recursive,
    [switch]$KeepDataUris,
    [switch]$Overwrite
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$wrapperPath = Join-Path $repoRoot "scripts\convert_with_markitdown.ps1"

& $wrapperPath -Recursive:$Recursive -KeepDataUris:$KeepDataUris -Overwrite:$Overwrite
exit $LASTEXITCODE
