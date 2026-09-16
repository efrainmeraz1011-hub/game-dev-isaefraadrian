#!/usr/bin/env python3
"""Compare every native source against its exported Aseprite atlas rectangle."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from PIL import Image


def verify(manifest_path: Path, layout_path: Path, atlas_path: Path, output: Path):
    manifest = json.loads(manifest_path.read_text())
    layout = json.loads(layout_path.read_text())
    index = {item["id"]: item for item in layout["assets"]}
    atlas = Image.open(atlas_path).convert("RGBA")
    assert atlas.size == (layout["width"], layout["height"]), "Atlas dimensions differ from layout"
    assert set(index) == {item["id"] for item in manifest["assets"]}, "Atlas/manifest IDs differ"
    results = []
    for asset in manifest["assets"]:
        source_path = Path(asset["path"])
        if not source_path.is_absolute():
            source_path = manifest_path.parent / source_path
        source = Image.open(source_path).convert("RGBA")
        rect = index[asset["id"]]
        assert source.size == (rect["width"], rect["height"]), asset["id"]
        crop = atlas.crop((rect["x"], rect["y"], rect["x"] + rect["width"], rect["y"] + rect["height"]))
        before, after = source.tobytes(), crop.tobytes()
        counts = dict(exact_rgba_mismatch_pixels=0, alpha_mismatch_pixels=0,
                      visible_rgb_mismatch_pixels=0, fully_transparent_rgb_difference_pixels=0)
        for offset in range(0, len(before), 4):
            a, b = before[offset:offset + 4], after[offset:offset + 4]
            if a != b:
                counts["exact_rgba_mismatch_pixels"] += 1
            if a[3] != b[3]:
                counts["alpha_mismatch_pixels"] += 1
            if a[:3] != b[:3]:
                key = "fully_transparent_rgb_difference_pixels" if a[3] == b[3] == 0 else "visible_rgb_mismatch_pixels"
                counts[key] += 1
        results.append(dict(id=asset["id"], size=list(source.size), atlas_rect=[rect[key] for key in ("x", "y", "width", "height")],
                            exact_rgba_match=counts["exact_rgba_mismatch_pixels"] == 0,
                            visible_pixels_and_alpha_match=counts["alpha_mismatch_pixels"] == 0 and counts["visible_rgb_mismatch_pixels"] == 0,
                            **counts))
    report = dict(asset_count=len(results), exact_rgba_matches=sum(item["exact_rgba_match"] for item in results),
                  visible_pixels_and_alpha_matches=sum(item["visible_pixels_and_alpha_match"] for item in results),
                  allowed_difference="Only RGB values under fully transparent pixels may normalize in Aseprite. Alpha changes and visible RGB changes always fail.",
                  atlas=str(atlas_path.relative_to(manifest_path.parent)) if atlas_path.is_relative_to(manifest_path.parent) else atlas_path.name, results=results)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2) + "\n")
    return report


def main():
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=root / "manifest.json")
    parser.add_argument("--layout", type=Path, default=root / "naval-ui-assets-v1-atlas-layout.json")
    parser.add_argument("--atlas", type=Path, default=root / "naval-ui-assets-v1-export-check.png")
    parser.add_argument("--output", type=Path, default=root / "qa/source-export-comparison.json")
    args = parser.parse_args()
    report = verify(args.manifest.resolve(), args.layout.resolve(), args.atlas.resolve(), args.output.resolve())
    print(json.dumps({key: report[key] for key in ("asset_count", "exact_rgba_matches", "visible_pixels_and_alpha_matches")}, indent=2))
    if report["visible_pixels_and_alpha_matches"] != report["asset_count"]:
        raise SystemExit("Source/export mismatch in visible pixels or alpha; see comparison report")


if __name__ == "__main__":
    main()
