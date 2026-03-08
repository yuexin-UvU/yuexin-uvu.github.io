param(
    [string]$InputPath = "ref",
    [string]$OutputDir = "ref\\markdown",
    [string]$OutputFile,
    [string[]]$Extensions = @(".pdf", ".pptx"),
    [switch]$Recursive,
    [switch]$KeepDataUris,
    [switch]$Overwrite
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$pythonExe = Join-Path $repoRoot ".venv-markitdown\Scripts\python.exe"
$scriptPath = Join-Path $repoRoot "scripts\convert_ref_with_markitdown.py"

if (-not (Test-Path $pythonExe)) {
    throw "Local MarkItDown virtual environment not found: $pythonExe"
}

$commandArgs = @(
    $scriptPath,
    "--input-path", $InputPath,
    "--output-dir", $OutputDir,
    "--extensions"
)
$commandArgs += $Extensions

if ($OutputFile) {
    $commandArgs += @("--output-file", $OutputFile)
}

if ($Recursive) {
    $commandArgs += "--recursive"
}

if ($KeepDataUris) {
    $commandArgs += "--keep-data-uris"
}

if ($Overwrite) {
    $commandArgs += "--overwrite"
}

& $pythonExe @commandArgs
exit $LASTEXITCODE
