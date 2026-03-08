from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

from markitdown import MarkItDown


DEFAULT_EXTENSIONS = (".pdf", ".pptx")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Convert files to Markdown with the local MarkItDown environment.")
    parser.add_argument(
        "--input-path",
        default="ref",
        help="File or directory to convert. Relative paths are resolved from the repository root.",
    )
    parser.add_argument(
        "--output-dir",
        default="ref/markdown",
        help="Directory that receives generated Markdown files when output-file is not provided.",
    )
    parser.add_argument(
        "--output-file",
        help="Exact output Markdown file path. Only valid when converting a single file.",
    )
    parser.add_argument(
        "--extensions",
        nargs="+",
        default=list(DEFAULT_EXTENSIONS),
        help="Extensions to include when input-path is a directory.",
    )
    parser.add_argument(
        "--recursive",
        action="store_true",
        help="Recurse into subdirectories when input-path is a directory.",
    )
    parser.add_argument(
        "--keep-data-uris",
        action="store_true",
        help="Keep base64 data URIs in generated Markdown instead of truncating them.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing Markdown files. By default, existing files are skipped.",
    )
    return parser


def resolve_path(repo_root: Path, raw_path: str) -> Path:
    path = Path(raw_path)
    if not path.is_absolute():
        path = repo_root / path
    return path.resolve()


def collect_source_files(input_path: Path, extensions: set[str], recursive: bool) -> list[Path]:
    if input_path.is_file():
        return [input_path]

    pattern = "**/*" if recursive else "*"
    return sorted(
        path.resolve()
        for path in input_path.glob(pattern)
        if path.is_file() and path.suffix.lower() in extensions
    )


def build_output_path(source_file: Path, input_path: Path, output_dir: Path, output_file: Path | None) -> Path:
    if output_file is not None:
        return output_file

    if input_path.is_file():
        return output_dir / f"{source_file.stem}.md"

    relative_parent = source_file.relative_to(input_path).parent
    return output_dir / relative_parent / f"{source_file.stem}.md"


def build_image_asset_paths(source_file: Path, destination: Path, keep_data_uris: bool) -> tuple[Path | None, str | None]:
    if keep_data_uris or source_file.suffix.lower() != ".pptx":
        return None, None

    asset_dir = destination.parent / f"{destination.stem}.assets"
    asset_url_root = asset_dir.relative_to(destination.parent).as_posix()
    return asset_dir, asset_url_root


def main() -> int:
    args = build_parser().parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    input_path = resolve_path(repo_root, args.input_path)
    output_dir = resolve_path(repo_root, args.output_dir)
    output_file = resolve_path(repo_root, args.output_file) if args.output_file else None
    extensions = {extension.lower() if extension.startswith(".") else f".{extension.lower()}" for extension in args.extensions}
    local_source = repo_root / "tools" / "markitdown" / "packages" / "markitdown"

    if not local_source.exists():
        print(f"Local MarkItDown source tree not found: {local_source}", file=sys.stderr)
        return 1

    if not input_path.exists():
        print(f"Input path does not exist: {input_path}", file=sys.stderr)
        return 1

    if output_file is not None and not input_path.is_file():
        print("--output-file can only be used when --input-path points to a single file.", file=sys.stderr)
        return 1

    source_files = collect_source_files(input_path, extensions, args.recursive)

    if not source_files:
        print(f"No supported files found in {input_path}")
        return 0

    markitdown = MarkItDown()
    failures = []
    skipped = []
    for source_file in source_files:
        destination = build_output_path(source_file, input_path, output_dir, output_file)
        destination.parent.mkdir(parents=True, exist_ok=True)

        if destination.exists() and not args.overwrite:
            skipped.append(source_file.name)
            print(f"Skipping {source_file.name} because {destination.relative_to(repo_root)} already exists")
            continue

        image_output_dir, image_url_root = build_image_asset_paths(source_file, destination, args.keep_data_uris)

        if image_output_dir and image_output_dir.exists() and args.overwrite:
            shutil.rmtree(image_output_dir)

        print(f"Converting {source_file.name} -> {destination.relative_to(repo_root)}")
        try:
            result = markitdown.convert(
                str(source_file),
                keep_data_uris=args.keep_data_uris,
                image_output_dir=str(image_output_dir) if image_output_dir else None,
                image_url_root=image_url_root,
            )
            destination.write_text(result.markdown, encoding="utf-8")
        except Exception:
            failures.append(source_file.name)

    if failures:
        print("Failed to convert:", ", ".join(failures), file=sys.stderr)
        return 1

    converted_count = len(source_files) - len(skipped)
    print(f"Converted {converted_count} files into {output_dir.relative_to(repo_root)}")
    if skipped:
        print(f"Skipped {len(skipped)} existing files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
