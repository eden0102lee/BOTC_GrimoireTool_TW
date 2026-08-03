import re, json, csv
from pathlib import Path
root = Path(r"C:\Users\u\Projects\clocktower-grimoire_TW\data\raw")
raw = (root / "_grimoire_app.js").read_text(encoding="utf-8", errors="replace")
start = raw.find("b1d9:function(e){e.exports=JSON.parse(")
i = start + len("b1d9:function(e){e.exports=JSON.parse(")
assert raw[i] == "'"
i += 1
chars = []
esc = False
while i < len(raw):
    c = raw[i]
    if esc:
        chars.append(c)
        esc = False
    elif c == "\\":
        chars.append(c)
        esc = True
    elif c == "'":
        break
    else:
        chars.append(c)
    i += 1
roles = json.loads("".join(chars))
(root / "_grimoire_roles_meta.json").write_text(
    json.dumps({
        "source": "webpack module b1d9 (./roles.json) in grimoire/js/app.424f069e.js",
        "count": len(roles),
        "other_bundled_json_modules": ["editions.json", "fabled.json", "game.json", "hatred.json", "tpi_roles_id_map.json"],
        "cdn_assets": "https://oss.gstonegames.com/data_file/clocktower/role_icon/{id}.png",
    }, ensure_ascii=False, indent=2),
    encoding="utf-8",
)
(root / "_grimoire_roles_sample.json").write_text(json.dumps(roles[:2], ensure_ascii=False, indent=2), encoding="utf-8")
comm_path = root / "community_translations_preview.csv"
with comm_path.open(encoding="utf-8-sig", newline="") as f:
    comm = list(csv.DictReader(f))
(root / "_community_translations_sample.json").write_text(
    json.dumps({"headers": list(comm[0].keys()), "row_count": len(comm), "sample_rows": comm[:3]}, ensure_ascii=False, indent=2),
    encoding="utf-8",
)
project_roles = json.loads((root.parent.parent / "src" / "roles.json").read_text(encoding="utf-8"))
role_ids = {r["id"] for r in project_roles}
comm_ids = {r["id"] for r in comm}
print("grimoire_roles", len(roles))
print("missing_in_community", sorted(role_ids - comm_ids))
print("missing_in_project_roles", len({r['id'] for r in roles} - role_ids))
import json, csv
from pathlib import Path
root = Path(r"C:\Users\u\Projects\clocktower-grimoire_TW")
raw = (root/"data/raw/_grimoire_app.js").read_text(encoding="utf-8", errors="replace")
# extract tpi map module a84b if present
import re
m = re.search(r'a84b:function\(e\)\{e\.exports=JSON\.parse\(', raw)
if m:
    i = m.end()
    assert raw[i] == "'"
    i += 1
    chars=[]; esc=False
    while i < len(raw):
        c=raw[i]
        if esc: chars.append(c); esc=False
        elif c=='\\': chars.append(c); esc=True
        elif c=="'": break
        else: chars.append(c)
        i+=1
    tpi=json.loads(''.join(chars))
    (root/"data/raw/_grimoire_tpi_roles_id_map_sample.json").write_text(json.dumps({'count':len(tpi), 'sample':dict(list(tpi.items())[:5]) if isinstance(tpi,dict) else tpi[:5]}, ensure_ascii=False, indent=2), encoding='utf-8')
    print('tpi map type', type(tpi).__name__, 'len', len(tpi))
else:
    print('tpi module not found')
