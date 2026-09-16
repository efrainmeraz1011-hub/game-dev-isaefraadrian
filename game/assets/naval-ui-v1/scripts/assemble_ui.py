#!/usr/bin/env python3
"""Assemble a reusable UI frame from its17x17 compact source without resampling."""
import argparse
import json
from pathlib import Path
from PIL import Image

PACK=Path(__file__).resolve().parents[1]

def assemble(asset_id, width, height):
    contract=json.loads((PACK/"ui-nine-slice.json").read_text())
    entry=next((x for x in contract["entries"] if x["id"]==asset_id),None)
    if entry is None:raise ValueError(f"Unknown UI asset: {asset_id}")
    n=entry["insets_ltrb"][0]
    if width<2*n+1 or height<2*n+1:raise ValueError(f"Minimum mechanical size is {2*n+1}x{2*n+1}")
    source=Image.open(PACK/entry["compact_template"]).convert("RGBA")
    result=Image.new("RGBA",(width,height),(0,0,0,0))
    sx=[0,n,n+1,2*n+1];sy=sx
    dx=[0,n,width-n,width];dy=[0,n,height-n,height]
    for row in range(3):
        for col in range(3):
            patch=source.crop((sx[col],sy[row],sx[col+1],sy[row+1]))
            for y in range(dy[row],dy[row+1],patch.height):
                for x in range(dx[col],dx[col+1],patch.width):
                    cut=patch.crop((0,0,min(patch.width,dx[col+1]-x),min(patch.height,dy[row+1]-y)))
                    result.paste(cut,(x,y))
    return result

if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("asset_id")
    parser.add_argument("width",type=int)
    parser.add_argument("height",type=int)
    parser.add_argument("output",type=Path)
    args=parser.parse_args()
    image=assemble(args.asset_id,args.width,args.height)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    image.save(args.output)
    print(args.output.resolve())
