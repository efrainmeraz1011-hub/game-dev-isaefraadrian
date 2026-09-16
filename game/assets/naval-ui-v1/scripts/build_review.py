#!/usr/bin/env python3
"""Build an offline 1x/4x catalog from the delivered-asset manifest; stdlib only."""
from __future__ import annotations

import argparse
import base64
import json
from pathlib import Path
import struct


def png_size(data: bytes) -> tuple[int, int]:
    if data[:8] != b"\x89PNG\r\n\x1a\n" or data[12:16] != b"IHDR":
        raise ValueError("Not a PNG with a valid IHDR header")
    return struct.unpack(">II", data[16:24])


def build(manifest_path: Path, output: Path) -> int:
    document = json.loads(manifest_path.read_text())
    assets = document["assets"]
    if not isinstance(assets, list) or not assets:
        raise ValueError("Manifest assets must be a non-empty list")
    entries, seen = [], set()
    for asset in assets:
        asset_id = str(asset["id"])
        if asset_id in seen:
            raise ValueError(f"Duplicate asset ID: {asset_id}")
        seen.add(asset_id)
        path = Path(asset["path"])
        if not path.is_absolute():
            path = manifest_path.parent / path
        data = path.read_bytes()
        width, height = png_size(data)
        expected = int(asset["width"]), int(asset["height"])
        if (width, height) != expected:
            raise ValueError(f"{asset_id}: PNG is {width}x{height}; manifest says {expected}")
        entries.append({
            "id": asset_id, "path": str(asset["path"]),
            "width": width, "height": height,
            "family": str(asset.get("family", "Uncategorized")),
            "status": str(asset.get("status", "Unspecified")),
            "source_job_id": asset.get("source_job_id"),
            "src": "data:image/png;base64," + base64.b64encode(data).decode("ascii"),
        })
    encoded = json.dumps(entries, ensure_ascii=True).replace("<", "\\u003c")
    content = TEMPLATE.replace("__ASSET_DATA__", encoded).replace("__ASSET_COUNT__", str(len(entries)))
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(content)
    return len(entries)


TEMPLATE = r'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Naval asset catalog — native pixel review</title>
<style>
:root{color-scheme:dark;font:15px/1.45 system-ui,sans-serif;background:#101d22;color:#e6ede3}
*{box-sizing:border-box}body{margin:0;padding:24px}main{max-width:1600px;margin:auto}
h1{font-size:28px;margin:0 0 8px}h2{font-size:22px;margin:30px 0 12px}h3{font-size:17px;margin:0;overflow-wrap:anywhere}
p{max-width:105ch;margin:8px 0;color:#b6c9c8}header{border-bottom:1px solid #526f75;padding-bottom:18px}
.controls{display:flex;gap:12px;flex-wrap:wrap;margin:18px 0 10px;align-items:end}.controls label{display:grid;gap:4px}
input,select,button{font:inherit;padding:8px;border:1px solid #6f8d8f;border-radius:3px;background:#20353a;color:#e6ede3}
input{min-width:260px}button{cursor:pointer}input:focus-visible,select:focus-visible,button:focus-visible{outline:2px solid #efd083;outline-offset:2px}
.count{margin-left:auto;color:#b6c9c8}.asset{border:1px solid #526f75;border-radius:4px;padding:16px;margin-bottom:18px;background:#162a30;scroll-margin-top:10px}
.meta{font-size:13px;color:#b6c9c8;margin:5px 0 12px;overflow-wrap:anywhere}.meta strong{color:#e6ede3}
.previews{display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start}figure{margin:0;min-width:0;max-width:100%;flex:0 1 auto}
figcaption{font-size:13px;margin-bottom:6px}.pixel-window{max-width:100%;overflow:auto;border:1px solid #6f8d8f;background:#0c171b;padding:12px}
.checker{display:block;width:max-content;height:max-content;background-color:#bec7c6;background-image:conic-gradient(#7f9293 25%,transparent 0 50%,#7f9293 0 75%,transparent 0);background-size:16px 16px}
.checker img{display:block;max-width:none;image-rendering:pixelated;image-rendering:crisp-edges}.badge{display:inline-block;border:1px solid #6f8d8f;padding:1px 6px;margin-left:8px;font-size:12px}
.empty{border:1px dashed #6f8d8f;padding:20px}a{color:#97c8d3}.path{font-family:ui-monospace,monospace}footer{margin-top:30px;border-top:1px solid #526f75;padding-top:14px;color:#b6c9c8;font-size:13px}
@media(max-width:650px){body{padding:12px}input{min-width:0;width:100%}.controls label{flex:1 1 230px}.count{margin-left:0}.asset{padding:10px}}
@media print{.controls{display:none}body{background:white;color:black}.asset{break-inside:avoid;background:white}.meta,p,footer{color:#333}.pixel-window{overflow:visible;max-width:none}.previews{display:block}}
</style></head><body><main>
<header><h1>Naval asset catalog</h1><p>Offline review of __ASSET_COUNT__ delivered PNG assets. Each card shows the original at <strong>1×</strong> and an exact <strong>4× nearest-neighbor</strong> display. Transparent pixels reveal the checkerboard. Larger previews scroll within their frame; they are never shrunk to fit.</p>
<p>Review at browser zoom 100% for the intended display sizes. Labels describe manifest state; this catalog does not certify production readiness or modify an image.</p>
<div class="controls"><label>Find an asset<input id="search" type="search" placeholder="ID, family or status" autocomplete="off"></label><label>Family<select id="family"><option value="">All families</option></select></label><button type="button" id="reset">Show all</button><span class="count" id="count" aria-live="polite"></span></div></header>
<div id="catalog"></div><noscript><p>This offline catalog needs JavaScript enabled to display the embedded images. It makes no network requests.</p></noscript>
<footer>Generated from the asset manifest. Original pixel files remain separate deliverables. Provenance IDs are included where supplied. No external fonts, libraries or image requests.</footer>
</main><script>
'use strict';
const assets=__ASSET_DATA__;
const catalog=document.querySelector('#catalog'),search=document.querySelector('#search'),family=document.querySelector('#family'),count=document.querySelector('#count');
const families=[...new Set(assets.map(a=>a.family))];
for(const name of families){const option=document.createElement('option');option.value=name;option.textContent=name;family.append(option)}
function node(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el}
function preview(a,scale){const figure=node('figure');figure.append(node('figcaption',`${scale}× · ${a.width*scale} × ${a.height*scale} display pixels`));const window=node('div',undefined,'pixel-window');const board=node('div',undefined,'checker');const image=document.createElement('img');image.src=a.src;image.alt=`${a.id}, ${scale} times native size`;image.width=a.width*scale;image.height=a.height*scale;image.style.width=`${a.width*scale}px`;image.style.height=`${a.height*scale}px`;board.append(image);window.append(board);figure.append(window);return figure}
function render(){catalog.replaceChildren();let shown=0;const term=search.value.trim().toLowerCase();for(const group of families){const members=assets.filter(a=>a.family===group&&(!family.value||a.family===family.value)&&(!term||`${a.id} ${a.family} ${a.status}`.toLowerCase().includes(term)));if(!members.length)continue;const section=node('section');section.append(node('h2',`${group} (${members.length})`));for(const a of members){shown++;const article=node('article',undefined,'asset');const title=node('h3',a.id);title.append(node('span',a.status,'badge'));article.append(title);const metadata=node('div',undefined,'meta');metadata.append(node('strong',`${a.width} × ${a.height} native pixels`));metadata.append(document.createTextNode(` · Source job: ${a.source_job_id===null||a.source_job_id===undefined?'not supplied':Array.isArray(a.source_job_id)?a.source_job_id.join(', '):a.source_job_id}`));metadata.append(node('div',a.path,'path'));article.append(metadata);const previews=node('div',undefined,'previews');previews.append(preview(a,1),preview(a,4));article.append(previews);section.append(article)}catalog.append(section)}if(!shown)catalog.append(node('p','No matching assets. Clear the filters to show the full pack.','empty'));count.textContent=`${shown} / ${assets.length} assets`}
search.addEventListener('input',render);family.addEventListener('change',render);document.querySelector('#reset').addEventListener('click',()=>{search.value='';family.value='';render()});render();
</script></body></html>
'''


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    pack = Path(__file__).resolve().parents[1]
    parser.add_argument("--manifest", type=Path, default=pack / "manifest.json")
    parser.add_argument("--output", type=Path, default=pack / "review.html")
    args = parser.parse_args()
    total = build(args.manifest.resolve(), args.output.resolve())
    print(f"Built offline catalog: {args.output} ({total} assets)")


if __name__ == "__main__":
    main()
