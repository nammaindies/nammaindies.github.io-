/**
 * Namma Indies — feedback receiver.
 *
 * The static site (app.html) posts the "Got an idea?" box here. This Worker:
 *   1. drops obvious bots (honeypot field),
 *   2. verifies a Cloudflare Turnstile token (real bot protection),
 *   3. files a GitHub issue labelled `feedback`.
 *
 * No mailbox, no polling. If you want an agentic triage layer, run it *on the
 * issue* (a GitHub Action on `issues: opened` filtered to label `feedback`) —
 * see README.md. This Worker just gets the idea safely into GitHub.
 *
 * Secrets (set with `wrangler secret put <NAME>`), never committed:
 *   TURNSTILE_SECRET  — Turnstile secret key (pairs with the site key in app.html)
 *   GITHUB_TOKEN      — fine-grained PAT, Issues: read+write on the one repo only
 * Vars (in wrangler.toml, safe to commit):
 *   GITHUB_REPO       — e.g. "nammaindies/nammaindies.github.io-"
 *   ALLOWED_ORIGIN    — e.g. "https://nammaindies.org"
 */

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") {
      return json({ ok: false, error: "method_not_allowed" }, 405, cors);
    }

    // Accept both form posts (no-JS fallback) and fetch FormData.
    let form;
    try {
      form = await request.formData();
    } catch {
      return json({ ok: false, error: "bad_request" }, 400, cors);
    }

    // 1. Honeypot — a hidden field humans never fill. Silently succeed so bots
    //    don't learn they were caught.
    if ((form.get("website") || "").trim() !== "") {
      return respond(request, cors, true);
    }

    const message = (form.get("message") || "").toString().trim();
    const contact = (form.get("contact") || "").toString().trim();
    if (!message) return json({ ok: false, error: "empty" }, 400, cors);
    if (message.length > 5000) return json({ ok: false, error: "too_long" }, 413, cors);

    // 2. Turnstile — the actual bot wall.
    const token = (form.get("cf-turnstile-response") || "").toString();
    const ip = request.headers.get("CF-Connecting-IP") || "";
    if (env.TURNSTILE_SECRET) {
      const ok = await verifyTurnstile(env.TURNSTILE_SECRET, token, ip);
      if (!ok) return json({ ok: false, error: "failed_challenge" }, 403, cors);
    }

    // 3. File the issue.
    const title = "Feedback: " + firstLine(message).slice(0, 72);
    const body = [
      message,
      "",
      "---",
      contact ? `Contact: ${contact}` : "Contact: (none left)",
      "Via: nammaindies.org feedback box",
    ].join("\n");

    try {
      await createIssue(env, title, body);
    } catch (err) {
      return json({ ok: false, error: "issue_failed" }, 502, cors);
    }

    return respond(request, cors, true);
  },
};

async function verifyTurnstile(secret, token, ip) {
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  const data = await res.json().catch(() => ({ success: false }));
  return data.success === true;
}

async function createIssue(env, title, body) {
  const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "nammaindies-feedback-worker",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ title, body, labels: ["feedback"] }),
  });
  if (!res.ok) throw new Error(`github ${res.status}`);
  return res.json();
}

// JS clients get JSON; a plain no-JS form POST gets a friendly HTML page.
function respond(request, cors, ok) {
  const wantsHtml = (request.headers.get("Accept") || "").includes("text/html");
  if (wantsHtml) {
    return new Response(thanksPage(), {
      status: 200,
      headers: { ...cors, "Content-Type": "text/html; charset=utf-8" },
    });
  }
  return json({ ok }, 200, cors);
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function firstLine(s) {
  return s.split("\n")[0].trim() || s.trim();
}

function thanksPage() {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Thank you — Namma Indies</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
background:#faf7f2;color:#2b2620;max-width:32rem;margin:0 auto;padding:5rem 1.5rem;
line-height:1.65}a{color:#a5502e}@media(prefers-color-scheme:dark){body{background:#1c1913;
color:#ece6db}a{color:#e0895a}}</style></head><body>
<h1>Got it — thank you. 🐾</h1>
<p>Your note is with the people building this. <a href="https://nammaindies.org/app.html">Back to the app</a>.</p>
</body></html>`;
}
