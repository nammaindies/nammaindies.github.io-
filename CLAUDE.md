# Namma Indies

## What this is

Namma Indies is an open-source, community-built census of India's street
dogs ("indies"). The idea: a neighbourhood-by-neighbourhood way to see,
name, and care for street dogs, with the people who already know them as
the resident experts — they hold the whole story (which dog limps, which
one just had puppies, which one waits by the tea stall), there's just
nowhere to put it. Think iNaturalist-meets-Pokémon-Go for street dogs.

Dogs are the focus, but not the whole story: **species** is a first-class
field in the system, so India's street cats ride along — tracked in the
same pipeline, counted per species. On the public pages cats stay a quiet
easter egg (a few light mentions, e.g. the curled-tail mark reads as dog
*or* cat), never a headline.

The heart of it: **to look, and not look away**.
The mission: **so that no street dog lives or dies uncounted**.

This repo is the org root site, live at nammaindies.org. Pages:
`index.html` (landing), `problem.html` (**Why** — the problem + welfare
fan-out), `technical.html` (**How** — the re-ID/architecture), and
`join.html` (**Join Us** — who's building it + partners). Shared footer
nav: Home · Why · How · Join Us.

## Voice

Warm, literary, unadorned. This is a passion project rooted in love, not a
startup — copy should never read like a pitch deck. No forms/newsletter/
social-icon clutter, no stats-first framing, no forced urgency.

Taglines to draw on:
- "every street dog, known and named"
- "give every indie a naam"

When writing or editing copy here, lead with story, not mission-statement
language — let the "why" emerge rather than announcing it.

Don't privilege "feeders." The people who know the dogs are a wide set —
neighbours, shopkeepers, security guards, kids, anyone on the street — not
only those who feed them. Use "neighbours" or "the people who know the
dogs"; avoid "feeders" as a category label in public copy.

Spelling: British/Indian (neighbourhood, sterilise, recognise, labelled).

Also avoid LLM-ish signposting ("here's the part worth sitting with", "the
quiet magic", "not X but Y"); keep sentences flat and declarative. The
`.github.io` about-voice mirrors Akash's own essays.

## Stack

- Static HTML pages, each with its own inline CSS (shared token set +
  logo/nav/footer block copied across files), no build step, no JS
  dependency, no frameworks. Must work with JS disabled.
- The mark is one curled-tail SVG (`favicon.svg`, inline logos,
  `brand/` PNGs for social). Motion (hero draw-in, logo hover-wag) sits
  behind `prefers-reduced-motion`.
- Mobile-first, system fonts, generous whitespace, light/dark via
  `prefers-color-scheme`.
- Hosted on GitHub Pages, source: `main` branch, `/` root.
- Custom domain via the `CNAME` file at repo root (must contain exactly
  `nammaindies.org`, no protocol, no trailing path).

## DNS / Pages wiring

- Domains `nammaindies.org` (primary) and `nammaindies.com` are registered
  and live on Cloudflare.
- `nammaindies.org` DNS (all records **DNS-only / unproxied** — Cloudflare's
  proxy breaks GitHub Pages' cert issuance):
  - `A @` → `185.199.108.153`, `.109.153`, `.110.153`, `.111.153`
    (GitHub Pages apex IPs)
  - `AAAA @` → `2606:50c0:8000::153`, `8001::153`, `8002::153`, `8003::153`
  - `CNAME www` → `nammaindies.github.io`
- `nammaindies.com` redirects to `nammaindies.org` via Cloudflare (bulk
  redirect rule), not hosted directly.
- GitHub Pages "Enforce HTTPS" should only be flipped on **after** GitHub
  finishes provisioning the TLS cert for the custom domain (usually minutes,
  up to 24h) — enabling it too early can lock out HTTP before the cert
  exists.
- Never hardcode API tokens (Cloudflare, GitHub) in files or commits — read
  from environment variables (`CLOUDFLARE_API_TOKEN`, etc.) at call time.
