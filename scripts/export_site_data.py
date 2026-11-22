"""Convert parsed items with photos into the JSON the site loads."""
import json
import re
import sys
import urllib.parse
from pathlib import Path

ITEMS, OUT = sys.argv[1], sys.argv[2]

GROUPS = [
    ("protists", "Prvoci a jednobuněční"),
    ("algae", "Řasy"),
    ("bryophytes", "Mechorosty"),
    ("ferns", "Plavuně a kapradiny"),
    ("conifers", "Nahosemenné"),
    ("monocots", "Jednoděložné rostliny"),
    ("dicots", "Dvouděložné rostliny"),
    ("fungi", "Houby"),
    ("lichens", "Lišejníky"),
    ("invertebrates", "Bezobratlí (mimo členovce)"),
    ("arthropods", "Pavoukovci, korýši a další členovci"),
    ("insects", "Hmyz"),
    ("fish", "Ryby a mihule"),
    ("amphibians", "Obojživelníci"),
    ("reptiles", "Plazi"),
    ("birds", "Ptáci"),
    ("mammals", "Savci"),
]



def clean_section(path):
    if not path:
        return None
    text = re.sub(r"\s*\[[^\]]*\]", "", path[-1])
    text = re.sub(r"\s+–.*$", "", text)
    return text.replace("Třída: ", "Třída ").strip()


def wikipedia_url(wiki):
    if wiki.get("cs"):
        return "https://cs.wikipedia.org/wiki/" + urllib.parse.quote(wiki["cs"].replace(" ", "_"))
    if wiki.get("en"):
        return "https://en.wikipedia.org/wiki/" + urllib.parse.quote(wiki["en"].replace(" ", "_"))
    return None


# Hand-curated from Czech mushroom atlases: Wikidata's edibility (P789) is sparse and contradictory.
EDIBILITY = json.load(open(Path(__file__).with_name("fungi_edibility.json")))

items = json.load(open(ITEMS))
unknown_ids = set(EDIBILITY) - {item["id"] for item in items}
if unknown_ids:
    raise SystemExit(f"fungi_edibility.json names unknown taxa: {sorted(unknown_ids)}")
taxa = []
for item in items:
    family = item.get("family")
    genus = item.get("genus")
    latin = item["lat_all"]
    taxa.append({
        "id": item["id"],
        "rank": item["rank"],
        "czechName": item["cz"],
        "czechSynonyms": item["cz_all"][1:],
        "latinName": latin[0] if latin else "",
        "latinSynonyms": latin[1:],
        "note": item["note"],
        "isIntroduced": item["introduced"],
        "groupId": item["group"],
        "sectionName": clean_section(item["path"]),
        "higherTaxon": {"rank": family["rank"], "czechName": family["cz"], "latinName": family["lat"]} if family and family["cz"] else None,
        "genus": {"czechNames": genus["cz_all"], "latinNames": genus["lat_all"]} if genus else None,
        "photos": item.get("images", []),
        "sounds": item.get("sounds", []),
        "edibility": EDIBILITY.get(item["id"]),
        "wikipediaUrl": wikipedia_url(item.get("wiki", {})),
    })

json.dump(
    {"groups": [{"id": group_id, "label": label} for group_id, label in GROUPS], "taxa": taxa},
    open(OUT, "w"),
    ensure_ascii=False,
    separators=(",", ":"),
)
print(len(taxa), "taxa,", sum(1 for t in taxa if not t["photos"]), "without photos")
