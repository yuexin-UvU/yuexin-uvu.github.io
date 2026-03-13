# Local MarkItDown Setup

This repository keeps a local copy of Microsoft's MarkItDown tool so other AI threads can reuse it without reinstalling from scratch.

## Local paths

- Source code: `tools/markitdown/`
- Python package root: `tools/markitdown/packages/markitdown/`
- Virtual environment: `.venv-markitdown/`
- Rebuild script: `scripts/setup_markitdown_local.ps1`
- Generic conversion entrypoint: `scripts/convert_with_markitdown.ps1`
- Ref batch conversion entrypoint: `scripts/convert_ref_with_markitdown.ps1`
- Python conversion CLI: `scripts/convert_ref_with_markitdown.py`
- Default output directory: `ref/markdown/`

## Current source snapshot

- Upstream repo: `https://github.com/microsoft/markitdown.git`
- Local branch: `main`
- Local commit: `4a5340f93b2bf1dc11641f921fbfd6d5f016924b`

## Quick start

Convert every supported file under `ref/`:

```powershell
.\scripts\convert_ref_with_markitdown.ps1 -Overwrite
```

Convert a single file:

```powershell
.\scripts\convert_with_markitdown.ps1 -InputPath "ref\个人简历.pptx" -OutputFile "ref\markdown\个人简历.md" -Overwrite
```

Convert recursively under another directory:

```powershell
.\scripts\convert_with_markitdown.ps1 -InputPath "some-folder" -OutputDir "some-folder\markdown" -Recursive -Overwrite
```

If you want inline base64 images inside Markdown instead of placeholder image paths:

```powershell
.\scripts\convert_ref_with_markitdown.ps1 -KeepDataUris -Overwrite
```

## Environment maintenance

Rebuild the local virtual environment from the local source tree:

```powershell
.\scripts\setup_markitdown_local.ps1
```

Update the local source checkout and reinstall from it:

```powershell
.\scripts\setup_markitdown_local.ps1 -UpdateSource
```

## Notes for future AI threads

- Prefer the local source tree at `tools/markitdown/` instead of reinstalling from the internet.
- The local virtual environment is already wired to the local source with an editable install.
- The default batch conversion only includes `.pdf` and `.pptx`.
- PPTX conversion now exports image files into sibling asset directories such as `ref/markdown/个人简历.assets/`.
- Use `-KeepDataUris` when you want self-contained Markdown with embedded base64 images instead of external asset folders.
- If you need direct CLI access, use:

```powershell
.\.venv-markitdown\Scripts\python -m markitdown "input.pptx" -o "output.md" --image-output-dir "output.assets" --image-url-root "output.assets"
```
