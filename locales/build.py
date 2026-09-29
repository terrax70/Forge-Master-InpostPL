"""Rebuild the browser dictionary: python locales/build.py"""
import json
from pathlib import Path
root = Path(__file__).resolve().parent
pairs = dict(line.split("\t", 1) for line in (root / "en.tsv").read_text(encoding="utf-8-sig").splitlines() if "\t" in line)
for key, value in list(pairs.items()):
    if key.startswith((". ", ", ")):
        pairs[key[2:]] = value[2:] if value.startswith((". ", ", ")) else value
(root / "en.js").write_text("window.INPPL_EN=" + json.dumps(pairs, ensure_ascii=False) + ";\n", encoding="utf-8")
