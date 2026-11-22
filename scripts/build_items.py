"""Turn the parsed event stream into quiz items."""
import json
import re
import sys
import unicodedata

EVENTS, OUT = sys.argv[1], sys.argv[2]
events = json.load(open(EVENTS))

RANK_BY_HEADER = {"čeleď": "family", "třída": "class", "skupina": "group", "řád": "order"}
RANK_BY_HEADING = {"Kmen": "phylum", "Třída": "class", "Řád": "order"}

# Site groups by the headings above a taxon; the first match wins, so order matters.
GROUPS = [
    ("protists", lambda p: any(h.startswith("Superskupina " + n) for h in p for n in ("Excavata", "Amoebozoa", "SAR"))),
    ("algae", lambda p: any(k in h for h in p for k in ("zelených řas", "Zygnematophyta", "Charophyta")) and not any(k in h for h in p for k in ("játrovky", "mechy", "hlevíky", "plavuně", "kapradiny", "jehličnany", "krytosemenné"))),
    ("bryophytes", lambda p: any(k in h for h in p for k in ("játrovky", "mechy (Bryophyta)", "hlevíky"))),
    ("ferns", lambda p: any(k in h for h in p for k in ("plavuně", "kapradiny"))),
    ("conifers", lambda p: any("jehličnany" in h for h in p)),
    ("monocots", lambda p: any("jednoděložné" in h for h in p)),
    ("dicots", lambda p: any(k in h for h in p for k in ("dvouděložné", "Vývojově původní"))),
    ("lichens", lambda p: any("lichenizované" in h for h in p)),
    ("fungi", lambda p: any("Říše houby" in h for h in p)),
    ("insects", lambda p: any("hmyz (Insecta)" in h for h in p)),
    ("arthropods", lambda p: any("členovci" in h for h in p)),
    ("invertebrates", lambda p: any("Říše živočichové" in h for h in p) and not any("strunatci" in h for h in p)),
    ("fish", lambda p: any(k in h for h in p for k in ("kruhoústí", "paprskoploutví"))),
    ("amphibians", lambda p: any("obojživelníci" in h for h in p)),
    ("reptiles", lambda p: any("plazi" in h for h in p)),
    ("birds", lambda p: any("ptáci (Aves)" in h for h in p)),
    ("mammals", lambda p: any("savci" in h for h in p)),
]
HEADING_LEVEL = ["Superskupina", "Říše", "Skupina", "Podskupina", "Oddělení", "Kmen", "Podkmen", "Nadtřída", "Třída", "Podtřída", "Řád", "Podřád"]


def heading_level(text):
    first = text.split()[0].rstrip(":")
    if first in HEADING_LEVEL:
        return HEADING_LEVEL.index(first)
    if text.startswith("Vývojově"):
        return HEADING_LEVEL.index("Třída")
    if text.startswith("lichenizované"):
        return HEADING_LEVEL.index("Oddělení")
    return HEADING_LEVEL.index("Řád")


def slug(text):
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def split_cell(text):
    """Return (czech part, latin groups, czech names in parentheses, note, introduced)."""
    note = None
    text = re.sub(r"(?<=[a-z])- (?=[a-z])", "-", text.replace("“", "\"")).strip()
    introduced = "*" in text
    text = text.replace("*", "")
    # note after a dash outside parentheses
    depth, cut = 0, None
    for index, char in enumerate(text):
        depth += char == "("
        depth -= char == ")"
        if char == "–" and depth == 0:
            cut = index
            break
    note_latin = []
    if cut is not None:
        note_text = text[cut + 1:]
        text = text[:cut].strip()
        note_latin = [g.strip() for g in re.findall(r"\(([^()]*)\)?", note_text) if g.strip()[:1].isupper()]
        note = re.sub(r"\s*\([A-Z][^()]*\)?", "", note_text)
        note = re.sub(r"\s*\[[^\]]*\]", "", note).strip(" ;,") or None
    text = re.sub(r"\s*\[[^\]]*\]", "", text)
    groups = re.findall(r"\(([^()]*)\)?", text)
    first_paren = text.find("(")
    czech = (text[:first_paren] if first_paren >= 0 else text).strip().strip(",")
    latin, czech_alt = [], []
    for group in groups:
        group = group.strip()
        if not group:
            continue
        if group[0].isupper():
            latin.append(group)
        else:
            czech_alt.append(group)
    latin += note_latin
    # stray latin without parens, e.g. "Pisaura [1])"
    for stray in re.findall(r",\s*([A-Z][a-z]+)\)", text):
        latin.append(stray)
    return czech, latin, czech_alt, note, introduced


def split_names(czech):
    """'trnka obecná syn. sl. trnka, s. trnitá' -> ['trnka obecná', 'sl. trnka', 's. trnitá']"""
    czech = czech.replace(" vč. ", " syn. ").replace(" resp. ", " syn. ")
    parts = re.split(r"\s+syn\.\s+|,\s*|\s+syn\.$", czech)
    return [p.strip().strip(")").strip() for p in parts if p.strip().strip(")").strip()]


# typos in the 2013 list that break Wikipedia look-ups
LATIN_TYPOS = {"Clytocibe nebularis": "Clitocybe nebularis", "Haliaetus": "Haliaeetus", "Pacifasctacus leniusculus": "Pacifastacus leniusculus", "Tetragnathisae": "Tetragnathidae", "Mebracidae": "Membracidae", "Apis melifera": "Apis mellifera"}


ABBREV = re.compile(r"^((?:[a-zčďěňřšťžáéíóúůý]{1,3}\.\s*)+)(.*)$")


def expand_czech(name, genus_options):
    match = ABBREV.match(name)
    if not match or not genus_options:
        return name
    abbrevs = [a for a in match.group(1).split(".") if a.strip()]
    abbrevs = [a.strip() for a in abbrevs]
    rest = match.group(2).strip()
    for option in genus_options:
        words = option.split()
        if len(abbrevs) == len(words) and all(w.startswith(a) for w, a in zip(words, abbrevs)):
            return f"{option} {rest}".strip()
    for option in genus_options:
        if option.startswith(abbrevs[0]) and len(abbrevs) == 1:
            return f"{option} {rest}".strip()
    return name


def latin_names(group):
    """'Euphorbia incl. Tithymalus' -> ['Euphorbia', 'Tithymalus'], 'P. avium syn. C. avium' -> [...]"""
    group = group.replace(" agg.", "")
    parts = re.split(r"\s+syn\.\s+|\s+incl\.\s+|\s+resp\.\s+|,\s*|\s+vč\.\s+|/", group)
    names = []
    for part in (p.strip() for p in parts if p.strip()):
        words = part.split()
        # "Muscicapa Ficedula": two genera without a separator
        names += words if len(words) > 1 and all(w[0].isupper() for w in words) else [part]
    return names


def expand_latin(name, genus_latin_options, primary_genus):
    match = re.match(r"^([A-Z][a-z]{0,10})\.\s*(.+)$", name)
    if match:
        prefix, rest = match.groups()
        for option in genus_latin_options:
            if option.startswith(prefix):
                return f"{option} {rest}"
        return f"{primary_genus or prefix + '.'} {rest}"
    if re.match(r"^[a-z]", name) and primary_genus:
        return f"{primary_genus} {name}"
    return name


def parse_taxon(text, genus=None):
    czech, latin_groups, czech_alt, note, introduced = split_cell(text)
    # A cell with only a Latin name ("Boletales") serves as both names.
    if not latin_groups and re.fullmatch(r"[A-Z][a-z]+", czech):
        latin_groups = [czech]
    names = split_names(czech)
    if names and names[0].startswith("skupina ") and len(names[0].split()) > 1:
        names[0] = names[0][len("skupina "):]
    genus_cz = genus["cz_all"] if genus else []
    genus_lat = genus["lat_all"] if genus else []
    names = [expand_czech(n, genus_cz) for n in names]
    names += czech_alt
    # "netopýr ušatý/dlouhouchý" stays as the display name, both halves are accepted answers
    for name in list(names):
        if "/" in name:
            head, _, first = name.partition(" ")
            names += [f"{head} {part.strip()}" for part in first.split("/")]
    latins = []
    for group in latin_groups:
        for name in latin_names(group):
            previous_genus = latins[-1].split()[0] if latins and " " in latins[-1] else None
            latins.append(expand_latin(name, genus_lat, previous_genus or (genus_lat[0] if genus_lat else None)))
    names = list(dict.fromkeys(names))
    latins = list(dict.fromkeys(LATIN_TYPOS.get(n, n) for n in latins))
    return {
        "cz": names[0] if names else "",
        "cz_all": names,
        "lat": latins[0] if latins else "",
        "lat_all": latins,
        "note": note,
        "introduced": introduced,
    }


items = []
heading_stack = []  # (level, text)
col_rank = "family"
family = genus = None


def path_texts():
    return [h for _, h in heading_stack]


def group_of(path):
    for group_id, predicate in GROUPS:
        if predicate(path):
            return group_id
    raise ValueError(f"no group for {path}")


def add_item(rank, taxon, source, parent_family=None, parent_genus=None):
    path = path_texts()
    item = {
        "rank": rank,
        **taxon,
        "family": {"cz": parent_family["cz"], "lat": parent_family["lat"], "rank": parent_family["rank"]} if parent_family else None,
        "genus": {"cz": parent_genus["cz"], "lat": parent_genus["lat"], "cz_all": parent_genus["cz_all"], "lat_all": parent_genus["lat_all"]} if parent_genus else None,
        "path": path,
        "group": group_of(path),
        "page": source["page"],
    }
    items.append(item)
    return item


cells_with_children = set()
for index, event in enumerate(events):
    if event["type"] != "cell":
        continue
    for nxt in events[index + 1:]:
        if nxt["type"] != "cell" or nxt["col"] <= event["col"]:
            break
        if nxt["bold"]:
            cells_with_children.add(index)
            break

for index, event in enumerate(events):
    if event["type"] == "heading":
        level = heading_level(event["text"])
        heading_stack = [(l, t) for l, t in heading_stack if l < level]
        heading_stack.append((level, event["text"]))
        family = genus = None
        next_event = events[index + 1] if index + 1 < len(events) else None
        has_count = re.search(r"\[[^\]]+\]", event["text"])
        is_leaf = next_event is None or next_event["type"] == "heading"
        if event["bold"] or (has_count and is_leaf):
            text = re.sub(r"^\S+:?\s+", "", event["text"])  # drop rank word
            rank = RANK_BY_HEADING.get(event["text"].split()[0].rstrip(":"), "order")
            add_item(rank, parse_taxon(text), event)
        continue
    if event["type"] == "header":
        col_rank = RANK_BY_HEADER.get(event["label"], "family")
        family = genus = None
        continue
    col = event["col"]
    if col == 0:
        taxon = parse_taxon(event["text"])
        family = {**taxon, "rank": col_rank}
        genus = None
        rank = col_rank
    elif col == 1:
        taxon = parse_taxon(event["text"])
        genus = taxon
        rank = "genus"
    else:
        taxon = parse_taxon(event["text"], genus)
        rank = "species"
    is_leaf = index not in cells_with_children and not any(
        e["type"] == "cell" and e["col"] > col for e in events[index + 1:index + 2])
    # Two leaf groups ("krásivky", "vodule") are missing the bold mark in the PDF.
    if event["bold"] or (is_leaf and col < 2 and taxon["cz"] and taxon["lat"]):
        add_item(rank, taxon, event, family if col > 0 else None, genus if col == 2 else None)

seen = {}
for item in items:
    base = slug(item["lat"] or item["cz"]) or "taxon"
    key = base
    counter = 2
    while key in seen:
        key = f"{base}-{counter}"
        counter += 1
    seen[key] = True
    item["id"] = key

json.dump(items, open(OUT, "w"), ensure_ascii=False, indent=1)
print(len(items), "items")
