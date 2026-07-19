# Feedback worker

The "Got an idea?" box on `app.html` posts here. This Cloudflare Worker checks
the submission isn't a bot and files a GitHub issue labelled `feedback`. No
mailbox, nothing to poll.

```
app.html box  ──POST──▶  Worker  ──▶  verify Turnstile  ──▶  GitHub issue (label: feedback)
                            │
                            └─ honeypot check (drops obvious bots first)
```

Everything below is one-time setup. Nothing here is live until you do it, and
the box on the page stays inert (posts nowhere) until step 5.

## 1. Turnstile keys (the bot wall)

In the Cloudflare dashboard → **Turnstile** → add a widget for `nammaindies.org`.
Choose the **Managed** (invisible) mode — no puzzle for real people. You get:

- a **site key** → goes in `app.html` (public, fine to commit)
- a **secret key** → stays a Worker secret (step 4)

## 2. GitHub token (to file the issue)

Create a **fine-grained personal access token** (GitHub → Settings → Developer
settings → Fine-grained tokens):

- **Repository access:** only `nammaindies/nammaindies.github.io-`
- **Permissions:** Issues → **Read and write** (nothing else)
- Short-ish expiry + a calendar reminder to rotate.

Create the `feedback` label in the repo's Issues tab once (any colour).

## 3. Deploy

```sh
cd feedback-worker
npm install -g wrangler   # if you don't have it
wrangler login
wrangler deploy
```

This prints the Worker URL, e.g. `https://nammaindies-feedback.<subdomain>.workers.dev`.
(Optional: put it behind a route like `feedback.nammaindies.org` in the dash.)

## 4. Set the secrets

```sh
wrangler secret put TURNSTILE_SECRET   # paste the Turnstile secret key
wrangler secret put GITHUB_TOKEN       # paste the fine-grained PAT
```

`GITHUB_REPO` and `ALLOWED_ORIGIN` are plain vars in `wrangler.toml` — edit
there if they change.

## 5. Wire the page

In `app.html`:

- set the form `action` to the Worker URL (replace `FEEDBACK_ENDPOINT_URL`)
- set `data-sitekey` to the Turnstile **site key** (replace `TURNSTILE_SITE_KEY`)
- uncomment the Turnstile `<script>` tag near the bottom

Commit + push the site. Submit a test note; confirm an issue appears.

## The agentic layer (already built)

The Worker deliberately just gets a clean issue into GitHub. The *judgement*
lives on the issue, not in the transport path:
[`.github/workflows/feedback-triage.yml`](../.github/workflows/feedback-triage.yml)
runs when a `feedback` issue is filed and has Claude:

- sort it into a theme (`theme:capture` / `map` / `offline` / `access` /
  `privacy` / `idea`),
- check it against open feedback issues and flag likely duplicates
  (`possible-duplicate`),
- leave a short triage note for you.

This keeps the submit path dumb-and-reliable and the smart part auditable and
re-runnable (just re-run the Action).

**One-time setup:** add a repo secret `ANTHROPIC_API_KEY`
(Settings → Secrets and variables → Actions → New repository secret). Labelling
and commenting use the built-in `GITHUB_TOKEN` — no extra token. Model defaults
to Haiku (cheap); change `MODEL` in the workflow to swap it.

## Why this shape

- **Turnstile, not a captcha** — invisible for humans, a hard wall for bots.
- **Honeypot first** — most junk never reaches the Turnstile call.
- **Token server-side only** — the GitHub PAT lives as a Worker secret, never
  in the page. The browser can only ever reach the Worker.
- **Degrades without JS** — a plain form POST still works; the Worker returns a
  thank-you page. The rest of the site stays JS-free; only this form needs script.
