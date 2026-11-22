"""Throttled, cached access to Wikipedia, Wikidata and Commons APIs shared by the fetch scripts."""
import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

USER_AGENT = "PoznavackaBuilder/0.1 (one-off educational dataset build; low request rate) python-urllib"
CACHE_FILE = "wiki_cache.json"
# Wikimedia rate-limits anonymous clients; one request per ~second stays under the limit.
REQUEST_PAUSE_SECONDS = 1.2
MAX_ATTEMPTS = 8
CACHE_SAVE_EVERY = 20

try:
    cache = json.load(open(CACHE_FILE))
except FileNotFoundError:
    cache = {}


def save_cache():
    json.dump(cache, open(CACHE_FILE, "w"))


def get_json(url):
    if url in cache:
        return cache[url]
    for attempt in range(MAX_ATTEMPTS):
        try:
            time.sleep(REQUEST_PAUSE_SECONDS)
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json", "Accept-Encoding": "identity"})
            with urllib.request.urlopen(request, timeout=60) as response:
                result = json.load(response)
            cache[url] = result
            if len(cache) % CACHE_SAVE_EVERY == 0:
                save_cache()
            return result
        except urllib.error.HTTPError as error:
            wait = int(error.headers.get("Retry-After") or 0) or 20 * (attempt + 1)
            print("retry", attempt, error.code, "wait", wait, url[:80], file=sys.stderr)
            time.sleep(wait)
        except Exception as error:  # noqa: BLE001
            print("retry", attempt, error, url[:80], file=sys.stderr)
            time.sleep(5 * (attempt + 1))
    save_cache()
    raise RuntimeError(url)


def wiki_api(lang, params):
    params = {**params, "format": "json", "formatversion": "2"}
    return get_json(f"https://{lang}.wikipedia.org/w/api.php?" + urllib.parse.urlencode(params))


def commons_api(params):
    params = {**params, "format": "json", "formatversion": "2"}
    return get_json("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params))


def chunks(seq, size):
    for index in range(0, len(seq), size):
        yield seq[index:index + size]


def plain_author(meta):
    """Artist from Commons extmetadata without HTML."""
    artist = re.sub(r"<[^>]+>", "", html.unescape(meta.get("Artist", {}).get("value", ""))).strip()
    return artist[:120] or "neznámý autor"
