# Poznávačka

Procvičování poznávačky živé přírody podle seznamu Biologické olympiády (kategorie A, B).
Statická stránka pro GitHub Pages: kvíz, kartičky s opakováním a atlas s fotkami z Wikimedia Commons.

- **Kvíz** – fotka a čtyři možnosti, nebo psaní názvu. Psaní se boduje jako v olympiádě:
  přesná odpověď 1 bod, správný rod (u položek určovaných do rodu čeleď) půl bodu,
  diakritika a drobné překlepy se tolerují.
- **Kartičky** – fotka, odkrytí odpovědi a vlastní hodnocení; kartičky se vracejí podle Leitnerova systému.
- **Atlas** – všechny položky se jmény, zařazením a více fotkami.

Postup se ukládá do `localStorage` prohlížeče.

## Vývoj

```bash
nvm use
npm install
npm run dev
```

`npm run typecheck`, `npm run build`, `npx prettier --check .`

Push do `main` spustí GitHub Action, která stránku sestaví a nasadí na GitHub Pages
(v nastavení repozitáře: Pages → Source: GitHub Actions).

## Data

`public/data/taxa.json` vzniká skripty ve `scripts/` ze seznamu přírodnin (PDF):

1. `parse_pdf.py` čte tabulky PDF i s fonty – tučné písmo v seznamu značí úroveň, do které se určuje
   (druh, rod, čeleď, řád…).
2. `build_items.py` z nich skládá položky: rozvine zkratky („k. luční“ → „kakost luční“), synonyma,
   poznámky („larva, imago“), zavlečené druhy a zařazení do skupin.
3. `fetch_images.py` najde články na české a anglické Wikipedii a Wikidatech a vybere až pět fotek
   z Wikimedia Commons i s autorem a licencí. Fotky se načítají přímo z Commons.
4. `fetch_sounds.py` přidá k ptákům až dvě nahrávky hlasu z Commons (MP3, aby hrály i v Safari).
5. `export_site_data.py` zapíše JSON pro stránku.

```bash
cd scripts
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
mkdir -p source  # sem PDF se seznamem jako source/seznam.pdf
.venv/bin/python parse_pdf.py source/seznam.pdf source/events.json
.venv/bin/python build_items.py source/events.json source/items.json
.venv/bin/python fetch_images.py source/items.json source/items_with_photos.json
.venv/bin/python fetch_sounds.py source/items_with_photos.json source/items_with_media.json
.venv/bin/python export_site_data.py source/items_with_media.json ../public/data/taxa.json
```

Skripty si odpovědi API ukládají do `wiki_cache.json`, takže opakované spuštění je rychlé.

## Zdroje

- Seznam: P. Bogusch, J. Jehlička, F. Kolář, J. Matějů – _Seznam přírodnin pro poznávačku, kategorie A, B_,
  Biologická olympiáda, ČZU v Praze, 2013. Neživá příroda (horniny) není zahrnutá.
- Fotky a nahrávky: [Wikimedia Commons](https://commons.wikimedia.org/) (nahrávky ptáků často
  z xeno-canto), autor a licence jsou u každého souboru a odkazují na jeho stránku.
