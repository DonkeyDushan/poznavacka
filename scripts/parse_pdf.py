"""Parse the BiO 'poznávačka' PDF into structured taxa (bold = required level)."""
import json
import re
import sys

import pymupdf

PDF, OUT = sys.argv[1], sys.argv[2]
FIRST_PAGE, LAST_PAGE = 7, 34  # 1-based PDF pages holding the tables
# Each PDF page holds two printed pages side by side.
HALF = 419.5
FOOTER_Y = 550
CELL_GAP = 14.5
HEADER_WORDS = {"čeleď", "rod", "druh", "třída", "skupina", "řád", "rod/skupina", "rod/druh", "skupina/rod", "druh/skupina", "podtřída", "nadčeleď", "podčeleď"}

doc = pymupdf.open(PDF)


def is_bold(font):
    return font.endswith("Semibold") or font.endswith("-Bold")


def collect_lines(page, x_from, x_to):
    spans = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                if not span["text"].strip():
                    continue
                x0, y0, x1, _ = span["bbox"]
                if not (x_from <= x0 < x_to) or y0 > FOOTER_Y:
                    continue
                spans.append({"x": x0 - x_from, "x1": x1 - x_from, "y": y0, "text": span["text"], "font": span["font"]})
    spans.sort(key=lambda s: s["y"])
    rows = []
    for span in spans:
        if rows and span["y"] - rows[-1][0]["y"] < 2.5:
            rows[-1].append(span)
            continue
        rows.append([span])
    ordered = [span for row in rows for span in sorted(row, key=lambda s: s["x"])]
    lines = []
    for span in ordered:
        line = lines[-1] if lines else None
        if line and abs(line["y"] - span["y"]) < 2.5 and -1.5 < span["x"] - line["x1"] < 4:
            gap = span["x"] - line["x1"]
            line["text"] += ("" if gap < 1.2 or line["text"].endswith(" ") or span["text"].startswith(" ") else " ") + span["text"]
            line["x1"] = span["x1"]
            line["spans"].append(span)
            continue
        lines.append({"x": span["x"], "x1": span["x1"], "y": span["y"], "text": span["text"], "spans": [span]})
    return lines


def column_of(item):
    x = item["x"]
    if x < 150:
        return 0
    if x < 265:
        return 1
    return 2


def line_text(line):
    return re.sub(r"\s+", " ", line["text"]).strip()


def kind_of(line):
    fonts = {s["font"] for s in line["spans"]}
    text = line_text(line)
    if text in HEADER_WORDS and all("Bold" in f for f in fonts):
        return "header"
    if text.isdigit():
        return "skip"
    if any("Georgia" in f or f.startswith("LidoSTF") for f in fonts):
        return "heading"
    if line["x"] < 37.5 and all("Light" in f for f in fonts):
        return "description"
    return "cell"


events = []  # ordered stream of headings, headers and cells
for pno in range(FIRST_PAGE - 1, LAST_PAGE):
    page = doc[pno]
    for x_from, x_to in ((0, HALF), (HALF, 2000)):
        lines = collect_lines(page, x_from, x_to)
        open_cells = {}
        last_heading = None
        for line in lines:
            kind = kind_of(line)
            text = line_text(line)
            if kind == "skip" or kind == "description":
                continue
            if kind == "header":
                if column_of(line) == 0:
                    events.append({"type": "header", "label": text, "y": line["y"], "page": pno + 1})
                open_cells = {}
                continue
            if kind == "heading":
                bold = any(is_bold(s["font"]) for s in line["spans"])
                # note in Light font on same line belongs to heading
                if last_heading and abs(last_heading["y"] - line["y"]) < 2.5:
                    last_heading["text"] += " " + text
                    last_heading["bold"] |= bold
                    continue
                last_heading = {"type": "heading", "text": text, "bold": bold, "y": line["y"], "page": pno + 1}
                events.append(last_heading)
                open_cells = {}
                continue
            # light note right after a heading on the same y
            if last_heading and abs(last_heading["y"] - line["y"]) < 2.5:
                last_heading["text"] += " " + text
                continue
            col = column_of(line)
            cell = open_cells.get(col)
            if cell and line["y"] - cell["last_y"] < CELL_GAP:
                cell["text"] += " " + text
                cell["last_y"] = line["y"]
                continue
            bold = is_bold(line["spans"][0]["font"])
            cell = {"type": "cell", "half": x_from, "col": col, "text": text, "bold": bold, "y": line["y"], "last_y": line["y"], "page": pno + 1}
            open_cells[col] = cell
            events.append(cell)

# within a half, cells starting on the same row are ordered by column
def reorder(stream):
    out = []
    for event in stream:
        out.append(event)
        index = len(out) - 1
        while index > 0 and same_half(out[index - 1], event) and out[index - 1]["type"] == "cell" and event["type"] == "cell" \
                and abs(out[index - 1]["y"] - event["y"]) < 3 and out[index - 1]["col"] > event["col"]:
            out[index - 1], out[index] = out[index], out[index - 1]
            index -= 1
    return out


def same_half(a, b):
    return a["page"] == b["page"] and a.get("half") == b.get("half")


events = reorder(events)
for event in events:
    event.pop("last_y", None)
    if "text" in event:
        event["text"] = re.sub(r"\s+", " ", event["text"]).replace("( ", "(").replace(" )", ")").strip()

json.dump(events, open(OUT, "w"), ensure_ascii=False, indent=1)
print(len(events), "events")
