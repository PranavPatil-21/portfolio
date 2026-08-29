# Portfolio

Personal portfolio site for Pranav Patil. Content is editable entirely from the
browser at `/admin` — no code changes, no terminal.

**If you just want to edit your site, you want [`docs/ADMIN.md`](docs/ADMIN.md), not this file.**
This file is the one-time setup.

---

## How it works

Content lives as markdown and JSON under `content/`. The admin panel writes to
those files through the GitHub API, so every publish is a commit, and every
commit triggers a rebuild and deploy.

```
/admin (GitHub login) → commit to main → Vercel build → live site
```

There is no database. Nothing to keep alive, nothing that expires from disuse,
nothing to pay for.

| | |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, themed from CMS values via CSS custom properties |
| 3D | three.js via React Three Fiber |
| Admin | Sveltia CMS (git-based) |
| Hosting | Vercel free tier |
| Content validation | Zod, at build time |

---

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
```

| Command | Purpose |
|---|---|
| `npm test` | Unit tests |
| `npm run typecheck` | Type checking |
| `npm run build` | Production build (validates all content) |
| `npm run e2e` | End-to-end + accessibility tests |

---

## One-time setup

### 1. Push to GitHub

Create an empty repo at [github.com/new](https://github.com/new) named
`portfolio` under `PranavPatil-21`. **Do not** initialise it with a README or
`.gitignore`.

```bash
git remote add origin https://github.com/PranavPatil-21/portfolio.git
git push -u origin main
```

### 2. Deploy to Vercel

1. [vercel.com/new](https://vercel.com/new) → import the repo.
2. Framework preset: **Next.js**. Everything else: defaults.
3. Add an environment variable:
   `NEXT_PUBLIC_SITE_URL` = your deployed URL (e.g. `https://portfolio-xyz.vercel.app`).
   This is used for canonical URLs, the sitemap and social preview images.
4. Deploy.

The site is now live and rebuilds on every push.

### 3. Enable admin login

The admin panel needs a small OAuth helper so GitHub can authorise you. It's
free and takes about five minutes.

**a. Register a GitHub OAuth app** at
[github.com/settings/developers](https://github.com/settings/developers) →
*New OAuth App*:

- Homepage URL: your site URL
- Authorization callback URL: `https://<worker-name>.<subdomain>.workers.dev/callback`
  (you'll get this exact URL in the next step — register the app first with a
  placeholder, then come back and correct it)

Note the **Client ID** and generate a **Client Secret**.

**b. Deploy the authenticator:**

```bash
git clone https://github.com/sveltia/sveltia-cms-auth.git
cd sveltia-cms-auth
npx wrangler deploy
npx wrangler secret put GITHUB_CLIENT_ID       # paste the Client ID
npx wrangler secret put GITHUB_CLIENT_SECRET   # paste the Client Secret
npx wrangler secret put ALLOWED_DOMAINS        # your site's domain
```

Wrangler prints the worker URL. Go back and set that as the OAuth app's
callback URL (with `/callback` on the end).

**c. Point the CMS at it** — in `public/admin/config.yml`, under `backend`:

```yaml
backend:
  name: github
  repo: PranavPatil-21/portfolio
  branch: main
  base_url: https://<worker-name>.<subdomain>.workers.dev
```

Commit and push. `/admin` now signs you in with GitHub.

#### Token sign-in fallback

If the OAuth helper is ever unavailable, Sveltia CMS also supports signing in
with a GitHub personal access token — click **Sign in with Token** at `/admin`,
follow the link to generate one with the pre-selected scopes, and paste it. This
needs no infrastructure at all and always works.

The token is stored only in your browser. **Never commit a token or paste one
into a chat, an issue, or a file.**

### 4. Custom domain (optional)

Vercel → project → **Settings → Domains** → add your domain and follow the DNS
instructions. Hosting the domain is free; registering the domain itself is not.

Then update `NEXT_PUBLIC_SITE_URL` to the new domain and redeploy.

### 5. Medium articles (optional)

In `/admin` → **Settings → Features**, enable *Medium Import* and set your
handle. See [`docs/ADMIN.md`](docs/ADMIN.md) for the two limits Medium imposes.

---

## Design docs

- [`docs/superpowers/specs/2026-08-29-portfolio-design.md`](docs/superpowers/specs/2026-08-29-portfolio-design.md) — what was built and why
- [`docs/superpowers/plans/2026-08-29-portfolio.md`](docs/superpowers/plans/2026-08-29-portfolio.md) — implementation plan

## A note on content safety

Every content file is validated against a Zod schema at build time. A malformed
edit fails the build with a message naming the file and field — and because a
failed build leaves the previous deploy live, **a bad edit cannot take the site
down**.
