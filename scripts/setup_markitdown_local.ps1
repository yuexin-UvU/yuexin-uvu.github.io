param(
    [switch]$UpdateSource
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$sourceRoot = Join-Path $repoRoot "tools\markitdown"
$packageRoot = Join-Path $sourceRoot "packages\markitdown"
$venvPath = Join-Path $repoRoot ".venv-markitdown"
$venvPython = Join-Path $venvPath "Scripts\python.exe"

if (-not (Test-Path $sourceRoot)) {
    throw "Local MarkItDown source tree not found: $sourceRoot"
}

if ($UpdateSource) {
    git -C $sourceRoot pull --ff-only
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to update local MarkItDown source tree."
    }
}

if (-not (Test-Path $venvPython)) {
    python -m venv $venvPath
}

$editableSpec = "$packageRoot[pdf,pptx]"

& $venvPython -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) {
    throw "Failed to upgrade pip in the local MarkItDown virtual environment."
}

& $venvPython -m pip install -e $editableSpec
if ($LASTEXITCODE -ne 0) {
    throw "Failed to install MarkItDown from local source."
}

Write-Host "MarkItDown source is available at $sourceRoot"
Write-Host "MarkItDown virtual environment is available at $venvPath"
