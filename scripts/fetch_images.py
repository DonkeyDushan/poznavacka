"""Attach Wikimedia Commons photos (with attribution) to quiz items."""
import json
import re
import sys
import urllib.parse

from wiki_client import cache, chunks, get_json, plain_author, save_cache, wiki_api

ITEMS, OUT = sys.argv[1], sys.argv[2]
MAX_IMAGES = 5
THUMB_WIDTH = 960
SKIP_FILE = re.compile(r"(map|mapa|range|distribution|areal|areál|verbreitung|karte|logo|icon|flag|wappen|coat|stamp|známka|herbarium|skeleton|skull|lebka|diagram|scheme|illustration|drawing|plate|tafel|ilustrace|kresba|sound|\.svg|\.png|\.gif|\.tif|\.webm|\.ogg|\.pdf)", re.I)
# Nests, eggs, bones and traces show the animal's signs, not the animal; the quiz needs the organism itself.
SKIP_SIGNS = re.compile(r"\b(nests?|nid|eggs?|eggshells?|fossils?|silurian|eie?r?|gelege|oeufs?|œufs?|clutch|skulls?|skeletons?|bones?|feathers?|footprints?|tracks?|droppings?|pellets?|gewölle|carcass\w*|dead(?! ?man)|road ?kill|hnízd\w*|vejce|vajíč\w*|lebk[ay]|kostr[ay]|pírk\w*|stop[ay]|trus|vývrž\w*|mrtv\w*|schädel)\b", re.I)
SKIP_CATEGORY = re.compile(r"fossil|maps|distribution|herbarium|illustrations|drawings|nests|eggs|skulls|skeletons|bones|feathers|footprints|tracks|droppings|pellets|carcasses|dead ", re.I)
items = json.load(open(ITEMS))

# 1) Resolve Wikipedia articles by Latin name (redirects resolve), then Czech name
def resolve_titles(lang, titles):
    found = {}
    for batch in chunks(titles, 50):
        result = wiki_api(lang, {"action": "query", "titles": "|".join(batch), "redirects": 1, "prop": "pageprops", "ppprop": "wikibase_item|disambiguation"})
        query = result.get("query", {})
        mapping = {t: t for t in batch}
        for step in ("normalized", "redirects"):
            for change in query.get(step, []):
                for original, target in mapping.items():
                    if target == change["from"]:
                        mapping[original] = change["to"]
        pages = {p["title"]: p for p in query.get("pages", [])}
        for original, target in mapping.items():
            page = pages.get(target)
            if page and not page.get("missing") and "disambiguation" not in page.get("pageprops", {}):
                found[original] = (target, page.get("pageprops", {}).get("wikibase_item"))
    return found


def capitalized(text):
    return text[:1].upper() + text[1:]


latin_titles = sorted({n for item in items for n in item["lat_all"] if n})
en_by_latin = resolve_titles("en", latin_titles)
cs_by_latin = resolve_titles("cs", latin_titles)
cs_by_czech = resolve_titles("cs", sorted({capitalized(i["cz"]) for i in items if i["cz"]}))
print("en", len(en_by_latin), "cs", len(cs_by_latin), "cs-cz", len(cs_by_czech), "of", len(latin_titles), file=sys.stderr)

def candidates_of(item):
    """(title language, title, qid, needs check) in priority order; English redirects by Latin name are trusted."""
    found = [("en", *en_by_latin[n], False) for n in item["lat_all"] if n in en_by_latin]
    found += [("cs", *cs_by_latin[n], True) for n in item["lat_all"] if n in cs_by_latin]
    if capitalized(item["cz"]) in cs_by_czech:
        found.append(("cs", *cs_by_czech[capitalized(item["cz"])], True))
    return [c for c in found if c[2]]


# 2) Wikidata entities: taxon name (P225) to validate Czech hits, main image (P18), sitelinks
qids = sorted({c[2] for item in items for c in candidates_of(item)})
entities = {}
for batch in chunks(qids, 50):
    result = get_json("https://www.wikidata.org/w/api.php?" + urllib.parse.urlencode({
        "action": "wbgetentities", "ids": "|".join(batch), "props": "claims|sitelinks", "sitefilter": "cswiki|enwiki", "format": "json"}))
    entities.update(result.get("entities", {}))


def claim_values(entity, prop):
    values = (claim.get("mainsnak", {}).get("datavalue", {}).get("value") for claim in entity.get("claims", {}).get(prop, []))
    return [v for v in values if isinstance(v, str)]


def matches_taxon(entity, item):
    """A Czech title like "Rosa" (dew) must belong to a taxon with the same genus as the item."""
    genera = {name.split()[0].lower() for name in item["lat_all"]}
    return any(name.split()[0].lower() in genera for name in claim_values(entity, "P225"))


for item in items:
    wiki = {"images": [], "cs": None, "en": None, "qid": None}
    for language, title, qid, needs_check in candidates_of(item):
        entity = entities.get(qid, {})
        if needs_check and not matches_taxon(entity, item):
            continue
        sitelinks = entity.get("sitelinks", {})
        wiki.update({
            "qid": qid,
            "images": [v.replace("_", " ") for v in claim_values(entity, "P18")],
            "cs": title if language == "cs" else sitelinks.get("cswiki", {}).get("title"),
            "en": title if language == "en" else sitelinks.get("enwiki", {}).get("title"),
        })
        break
    item["wiki"] = wiki

# 3) More photos from the articles (page image first)
def article_images(lang, titles):
    out = {}
    for batch in chunks(sorted(set(titles)), 50):
        params = {"action": "query", "titles": "|".join(batch), "prop": "pageimages|images", "piprop": "name", "imlimit": "max"}
        while True:
            result = wiki_api(lang, params)
            for page in result.get("query", {}).get("pages", []):
                entry = out.setdefault(page["title"], {"page": None, "images": []})
                if page.get("pageimage"):
                    entry["page"] = page["pageimage"].replace("_", " ")
                for image in page.get("images", []):
                    entry["images"].append(re.sub(r"^[^:]+:", "", image["title"]))
            if "continue" not in result:
                break
            params = {**params, **result["continue"]}
    return out


cs_images = article_images("cs", [i["wiki"]["cs"] for i in items if i["wiki"]["cs"]])
en_images = article_images("en", [i["wiki"]["en"] for i in items if i["wiki"]["en"]])

for item in items:
    candidates = list(item["wiki"]["images"])
    for source, title in ((cs_images, item["wiki"]["cs"]), (en_images, item["wiki"]["en"])):
        entry = source.get(title) if title else None
        if not entry:
            continue
        if entry["page"]:
            candidates.append(entry["page"])
        candidates += entry["images"]
    seen, files = set(), []
    for file in candidates:
        if file in seen or SKIP_FILE.search(file) or SKIP_SIGNS.search(file):
            continue
        seen.add(file)
        files.append(file)
    item["wiki"]["files"] = files[:MAX_IMAGES * 2]

# 4) Image info (thumb + attribution) from Commons
def photo_from_imageinfo(page):
    """Photo dict for a Commons page, or None when it is not a usable photo of the organism."""
    if page.get("missing") or not page.get("imageinfo"):
        return None
    ii = page["imageinfo"][0]
    meta = ii.get("extmetadata", {})
    categories = meta.get("Categories", {}).get("value", "")
    if ii.get("mime") not in ("image/jpeg", "image/webp") or ii.get("width", 0) < 300:
        return None
    if SKIP_FILE.search(page["title"]) or SKIP_SIGNS.search(page["title"]) or SKIP_CATEGORY.search(categories):
        return None
    return {
        "src": ii.get("thumburl") or ii["url"],
        "page": ii["descriptionurl"],
        "author": plain_author(meta),
        "license": meta.get("LicenseShortName", {}).get("value", ""),
    }


def imageinfo_query(titles):
    return "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query", "titles": "|".join("File:" + f for f in titles), "prop": "imageinfo",
        "iiprop": "url|extmetadata|size|mime", "iiurlwidth": THUMB_WIDTH, "format": "json", "formatversion": "2",
        "iiextmetadatafilter": "Artist|LicenseShortName|LicenseUrl|Categories",
    })


# Reuse every file already answered in the cache, whatever batch it came in.
info, known = {}, set()
for url, result in cache.items():
    if not url.startswith("https://commons.wikimedia.org/") or "prop=imageinfo" not in url or "generator=search" in url:
        continue
    for page in result.get("query", {}).get("pages", []):
        title = page["title"][5:]
        known.add(title)
        photo = photo_from_imageinfo(page)
        if photo:
            info[title] = photo

missing_files = sorted({f for item in items for f in item["wiki"]["files"]} - known)
for batch in chunks(missing_files, 50):
    for page in get_json(imageinfo_query(batch)).get("query", {}).get("pages", []):
        photo = photo_from_imageinfo(page)
        if photo:
            info[page["title"][5:]] = photo

for item in items:
    item["images"] = [info[f] for f in item["wiki"]["files"] if f in info][:MAX_IMAGES]

# 5) Last resort: Commons file search by the Latin name
def commons_search(name):
    result = get_json("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query", "generator": "search", "gsrsearch": f'"{name}" filetype:bitmap', "gsrnamespace": 6,
        "gsrlimit": MAX_IMAGES * 2, "prop": "imageinfo", "iiprop": "url|extmetadata|mime|size", "iiurlwidth": THUMB_WIDTH,
        "iiextmetadatafilter": "Artist|LicenseShortName|Categories", "format": "json", "formatversion": "2"}))
    pages = sorted(result.get("query", {}).get("pages", []), key=lambda p: p.get("index", 0))
    photos = [photo_from_imageinfo(page) for page in pages]
    return [photo for photo in photos if photo][:MAX_IMAGES]


for item in items:
    if not item["images"] and item["lat"]:
        item["images"] = commons_search(item["lat"])

save_cache()
json.dump(items, open(OUT, "w"), ensure_ascii=False, indent=1)
without = [i for i in items if not i["images"]]
print("items", len(items), "without images", len(without), file=sys.stderr)
for item in without:
    print("  NOIMG", item["rank"], item["cz"], item["lat"], file=sys.stderr)
