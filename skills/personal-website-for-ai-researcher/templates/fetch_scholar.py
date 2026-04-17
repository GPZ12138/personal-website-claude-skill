#!/usr/bin/env python3
"""Fetch live Google Scholar stats and write data/scholar.json.

Two-tier "polite poll" strategy to minimize load on Google Scholar:

  Tier 1 — lightweight check (runs every day)
      A single plain HTTPS GET of the public profile page with a normal
      browser User-Agent, exactly like a human clicking refresh on their
      own Scholar page. Parse one number out of the HTML: the total
      citation count. Stop here if that number matches what we already
      have on disk — nothing changed, no work needed.

  Tier 2 — full scrape (only if Tier 1 sees a change, or is forced)
      Use the `scholarly` library to pull the full per-year breakdown,
      h-index, i10-index, and publications_count. This is the "heavy"
      call; we only make it on days where something actually moved.

Failure modes are all non-destructive: on any error we keep the previous
snapshot intact and only bump `last_check`, so the front-end never
flickers to zero even if Scholar ever rate-limits us.

Force a full scrape by setting the env var FORCE_REFRESH=1 (done from
the workflow's manual `workflow_dispatch` with an input).
"""

from __future__ import annotations

import datetime as dt
import json
import os
import re
import sys
import urllib.request
from pathlib import Path

SCHOLAR_ID   = os.environ.get("SCHOLAR_ID", "").strip()
if not SCHOLAR_ID:
    raise SystemExit(
        "SCHOLAR_ID environment variable is required. "
        "Get your Scholar ID from the profile URL (the `user=...` parameter)."
    )
OUT_PATH     = Path(__file__).resolve().parents[1] / "data" / "scholar.json"

PROFILE_URL  = f"https://scholar.google.com/citations?user={SCHOLAR_ID}&hl=en"

# A realistic desktop Safari User-Agent. The point is to look like a
# normal human visitor, not a generic Python/urllib client.
BROWSER_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) "
    "Version/17.4 Safari/605.1.15"
)


def utc_now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_existing() -> dict:
    if OUT_PATH.exists():
        try:
            return json.loads(OUT_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass
    return {}


def coerce_int(value, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def write_out(payload: dict) -> None:
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(
        f"[ok] wrote {OUT_PATH}: citations={payload.get('total_citations')} "
        f"h={payload.get('h_index')} per_year={payload.get('per_year')}"
    )


# ---------------------------------------------------------------------------
# Tier 1 — lightweight polite check
# ---------------------------------------------------------------------------
def quick_total_citations(scholar_id: str) -> int | None:
    """Fetch the public profile page as a normal browser would and read
    the headline total-citations number out of the HTML. Returns None on
    any error (network, CAPTCHA, unexpected markup)."""
    req = urllib.request.Request(
        PROFILE_URL,
        headers={
            "User-Agent":       BROWSER_UA,
            "Accept":           "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language":  "en-US,en;q=0.9",
            "Cache-Control":    "no-cache",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            html = resp.read().decode("utf-8", errors="replace")
    except Exception as exc:  # noqa: BLE001
        print(f"[warn] quick check: request failed: {exc}", file=sys.stderr)
        return None

    # Scholar returns a CAPTCHA page sometimes — detect it explicitly.
    if "gs_captcha_f" in html or "Please show you&#39;re not a robot" in html:
        print("[warn] quick check: got CAPTCHA page; skipping", file=sys.stderr)
        return None

    # First occurrence of .gsc_rsb_std is the total-citations cell on the
    # profile page (the bigger of the two columns: "All" vs "Since 2020").
    m = re.search(r'gsc_rsb_std[^>]*>(\d+)', html)
    if m:
        return int(m.group(1))
    print("[warn] quick check: could not find citation count in HTML", file=sys.stderr)
    return None


# ---------------------------------------------------------------------------
# Tier 2 — full scrape via `scholarly` (only when needed)
# ---------------------------------------------------------------------------
def full_scrape(scholar_id: str) -> dict:
    from scholarly import scholarly, ProxyGenerator  # type: ignore

    # Free-proxy rotation helps avoid datacenter-IP blocks.
    try:
        pg = ProxyGenerator()
        if pg.FreeProxies():
            scholarly.use_proxy(pg)
    except Exception as exc:  # noqa: BLE001
        print(f"[warn] proxy setup failed: {exc}", file=sys.stderr)

    author = scholarly.search_author_id(scholar_id)
    author = scholarly.fill(
        author, sections=["basics", "indices", "counts", "publications"]
    )

    per_year_raw = author.get("cites_per_year", {}) or {}
    per_year = {str(k): coerce_int(v) for k, v in per_year_raw.items()}

    publications_count = len(author.get("publications", []) or [])

    return {
        "name":                author.get("name", ""),
        "affiliation":         author.get("affiliation", ""),
        "scholar_id":          scholar_id,
        "total_citations":     coerce_int(author.get("citedby", 0)),
        "h_index":             coerce_int(author.get("hindex", 0)),
        "i10_index":           coerce_int(author.get("i10index", 0)),
        "publications_count":  publications_count,
        "per_year":            per_year,
        "last_updated":        utc_now_iso(),
    }


def merge_with_fallback(new: dict, existing: dict) -> dict:
    """Prefer fresh values from `new`, but fall back to `existing` where
    `new` has empty/zero values. This guarantees we never clobber a good
    snapshot with an incomplete one."""
    merged = dict(existing)
    merged.update({
        k: v for k, v in new.items() if v not in (None, "", 0, {}, [])
    })
    if not new.get("per_year"):
        merged["per_year"] = existing.get("per_year", {})
    if new.get("last_updated"):
        merged["last_updated"] = new["last_updated"]
    return merged


# ---------------------------------------------------------------------------
# Entry
# ---------------------------------------------------------------------------
def main() -> int:
    existing = load_existing()
    force = os.environ.get("FORCE_REFRESH", "").strip().lower() in ("1", "true", "yes", "y")
    now = utc_now_iso()

    # --- Tier 1 ---------------------------------------------------------
    current_total = quick_total_citations(SCHOLAR_ID)
    previous_total = existing.get("total_citations")

    if not force and current_total is not None and current_total == previous_total:
        print(
            f"[ok] Tier 1: total citations unchanged ({current_total}); "
            "skipping full scrape."
        )
        existing["last_check"]        = now
        existing["last_check_method"] = "quick"
        write_out(existing)
        return 0

    if force:
        print("[info] FORCE_REFRESH set; running full scrape regardless.")
    elif current_total is None:
        print("[warn] Tier 1 did not return a count; will try full scrape "
              "as fallback, but keep existing snapshot on failure.", file=sys.stderr)
    else:
        print(f"[info] Tier 1: total citations changed {previous_total} -> "
              f"{current_total}; running full scrape.")

    # --- Tier 2 ---------------------------------------------------------
    try:
        scraped = full_scrape(SCHOLAR_ID)
    except Exception as exc:  # noqa: BLE001
        print(f"[error] full scrape failed: {exc}", file=sys.stderr)
        if existing:
            existing["last_check"]        = now
            existing["last_check_method"] = "quick-failed-heavy-failed"
            write_out(existing)
            return 0
        return 1

    merged = merge_with_fallback(scraped, existing)
    merged["last_check"]        = merged.get("last_updated", now)
    merged["last_check_method"] = "full"
    write_out(merged)
    return 0


if __name__ == "__main__":
    sys.exit(main())
