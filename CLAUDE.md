# Namma Indies

## What this is

Namma Indies is an open-source, community-built census of India's street
dogs ("indies"). The idea: a neighborhood-by-neighborhood way to see, name,
and care for street dogs, with feeders treated as the resident experts —
they already hold the whole story (which dog limps, which one just had
puppies, which one waits by the tea stall), there's just nowhere to put it.
Think iNaturalist-meets-Pokémon-Go for street dogs.

The heart of it: **to look, and not look away**.
The mission: **so that no street dog lives or dies uncounted**.

This repo is the org root site — a single static landing page, live at
nammaindies.org.

## Voice

Warm, literary, unadorned. This is a passion project rooted in love, not a
startup — copy should never read like a pitch deck. No forms/newsletter/
social-icon clutter, no stats-first framing, no forced urgency.

Taglines to draw on:
- "every street dog, known and named"
- "give every indie a naam"

When writing or editing copy here, lead with story, not mission-statement
language — let the "why" emerge rather than announcing it.

## Stack

- Single `index.html`, inline CSS, no build step, no JS dependency, no
  frameworks. Must work with JS disabled.
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
