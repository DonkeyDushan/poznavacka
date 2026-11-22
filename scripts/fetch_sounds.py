"""Attach bird song recordings from Wikimedia Commons (MP3, so Safari can play them) to bird species."""
import json
import sys
import urllib.parse

from wiki_client import chunks, commons_api, get_json, plain_author, save_cache

ITEMS, OUT = sys.argv[1], sys.argv[2]
MAX_SOUNDS = 2
SEARCH_LIMIT = 10
# Long field recordings are mostly silence or other birds; prefer short clean songs.
MAX_DURATION_SECONDS = 150
MP3 = "audio/mpeg"

items = json.load(open(ITEMS))
birds = [item for item in items if item["group"] == "birds" and item["rank"] == "species"]


def wikidata_audio(qids):
    """Files from the Wikidata audio property (P51), the curated recording of the species."""
    files = {}
    for batch in chunks(sorted(qids), 50):
        result = get_json("https://www.wikidata.org/w/api.php?" + urllib.parse.urlencode({
            "action": "wbgetentities", "ids": "|".join(batch), "props": "claims", "format": "json"}))
        for qid, entity in result.get("entities", {}).items():
            claims = entity.get("claims", {}).get("P51", [])
            values = (claim.get("mainsnak", {}).get("datavalue", {}).get("value") for claim in claims)
            files[qid] = [value.replace("_", " ") for value in values if isinstance(value, str)]
    return files


def search_audio(latin_name):
    """Commons audio files whose title names the species (xeno-canto uploads do)."""
    result = commons_api({"action": "query", "list": "search", "srsearch": f'"{latin_name}" filetype:audio',
                          "srnamespace": 6, "srlimit": SEARCH_LIMIT})
    titles = [hit["title"][5:] for hit in result.get("query", {}).get("search", [])]
    return [title for title in titles if latin_name.lower() in title.lower()]


def mp3_source(info):
    if info.get("mime") == MP3:
        return info["url"]
    for derivative in info.get("derivatives", []):
        if derivative.get("type", "").startswith(MP3):
            return derivative["src"]
    return None


def audio_info(files):
    details = {}
    for batch in chunks(sorted(set(files)), 50):
        result = commons_api({"action": "query", "titles": "|".join("File:" + f for f in batch), "prop": "videoinfo",
                              "viprop": "url|mime|derivatives|extmetadata",
                              "viextmetadatafilter": "Artist|LicenseShortName"})
        for page in result.get("query", {}).get("pages", []):
            info = (page.get("videoinfo") or [None])[0]
            src = info and mp3_source(info)
            if not src:
                continue
            meta = info.get("extmetadata", {})
            details[page["title"][5:]] = {
                "src": src,
                "page": info["descriptionurl"],
                "author": plain_author(meta),
                "license": meta.get("LicenseShortName", {}).get("value", ""),
                "duration": info.get("duration") or 0,
            }
    return details


p51 = wikidata_audio({item["wiki"]["qid"] for item in birds if item.get("wiki", {}).get("qid")})
candidates = {}
for item in birds:
    files = list(p51.get(item["wiki"].get("qid") or "", []))
    for name in item["lat_all"]:
        files += search_audio(name)
    candidates[item["id"]] = list(dict.fromkeys(files))

details = audio_info([f for files in candidates.values() for f in files])
for item in items:
    files = candidates.get(item["id"], [])
    usable = [details[f] for f in files if f in details and details[f]["duration"] <= MAX_DURATION_SECONDS]
    item["sounds"] = [{key: sound[key] for key in ("src", "page", "author", "license")} for sound in usable[:MAX_SOUNDS]]

save_cache()
json.dump(items, open(OUT, "w"), ensure_ascii=False, indent=1)
without = [item["cz"] for item in birds if not item["sounds"]]
print(f"{len(birds) - len(without)} of {len(birds)} bird species have a recording", file=sys.stderr)
print("without:", ", ".join(without), file=sys.stderr)
