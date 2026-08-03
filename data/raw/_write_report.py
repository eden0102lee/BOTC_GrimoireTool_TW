import json, csv, re
from pathlib import Path
root = Path(r"C:\Users\u\Projects\clocktower-grimoire_TW")
proj = json.loads((root/"src/roles.json").read_text(encoding="utf-8"))
with (root/"data/raw/community_translations_preview.csv").open(encoding="utf-8-sig", newline="") as f:
    comm = {r["id"]: r for r in csv.DictReader(f)}
comm_ids = set(comm)
proj_ids = {r["id"] for r in proj}
norm_mismatch = []
for pid in sorted(proj_ids):
    if pid not in comm_ids:
        alt = pid.replace("_", "")
        if alt in comm_ids:
            norm_mismatch.append((pid, alt))
report = {
    "official_roles_url": "https://script.bloodontheclocktower.com/data/roles.json",
    "official_roles_status": "404 Not Found (HTML saved as data/raw/_official_roles_404.html)",
    "official_roles_fallback": {
        "url": "https://raw.githubusercontent.com/bra1n/townsquare/develop/src/roles.json",
        "count": 130,
        "first_role_id": "washerwoman",
    },
    "grimoire_character_source": {
        "page": "https://clocktower.gstonegames.com/grimoire/",
        "mechanism": "Vue SPA; roles bundled in webpack module ./roles.json (chunk b1d9) inside js/app.424f069e.js",
        "public_api_probed": "No public roles JSON/API found (oss.gstonegames.com and clocktower.gstonegames.com/api/* returned 404)",
        "embedded_roles_count": 209,
        "companion_modules": ["editions.json", "fabled.json", "game.json", "hatred.json", "tpi_roles_id_map.json"],
        "cdn_icons": "https://oss.gstonegames.com/data_file/clocktower/role_icon/{slug}.png",
    },
    "community_sheet": {
        "export_url_gid_1544433985": "https://docs.google.com/spreadsheets/d/1aAJdqSTafHnw01w-WZ94UPx1Me70Kz-EG1NFfBht2tA/export?format=csv&gid=1544433985",
        "gviz_url": "gid=1544433985 gviz/tq?tqx=out:csv",
        "row_count": 181,
        "headers": ["id", "name", "ability", "flavor", "firstNightReminder", "otherNightReminder", "remindersGlobal", "reminders"],
    },
    "project_coverage": {
        "src_roles_json_count": len(proj),
        "roles_with_cjk_name": sum(1 for r in proj if re.search(r"[\u4e00-\u9fff]", r.get("name", ""))),
        "characters_zh_TW_csv_data_rows": 10,
        "community_covers_project_roles": len(proj_ids & comm_ids),
        "project_roles_missing_in_community": sorted(proj_ids - comm_ids),
        "community_rows_not_in_project_roles": len(comm_ids - proj_ids),
        "possible_id_normalization_pairs": norm_mismatch[:20],
    },
}
(root/"data/raw/_investigation_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(report, ensure_ascii=False, indent=2))
