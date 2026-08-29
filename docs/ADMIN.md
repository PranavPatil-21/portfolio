# Editing your site

Everything on your portfolio is editable from a browser. You never need a
terminal, an editor, or a git command.

This guide is written on the assumption that you'll read it once, six months
from now, having forgotten all of it.

---

## Logging in

1. Go to **`https://<your-site>/admin/`** (the trailing slash matters).
2. Click **Sign in with GitHub**.
3. GitHub asks you to authorise. Approve it.

That's the whole login. There is no separate password for the site — GitHub
*is* the login, and only your GitHub account has write access to the repo, which
is what makes you the only person who can edit.

If sign-in fails, see [Troubleshooting](#troubleshooting).

---

## The basic rhythm

Every edit follows the same three steps:

1. Change something.
2. Click **Save**, then **Publish**.
3. **Wait about a minute.** Your change is now a commit in the repo, which
   triggers a rebuild. The site updates when the build finishes.

That one-minute delay is normal and is not a sign anything is wrong. If you
refresh immediately and see the old content, wait and refresh again.

---

## What you can change

### Add a job

**Experience → New Experience.** Fill in role, company, location and start date.
Leave *End* empty and tick *Current* for your present job. Add bullets one at a
time — each is a separate line item.

Bullets are the substance of the section. Write them the way they read on your
resume.

### Add a project

**Projects → New Project.** Title and summary are required; the summary is what
shows on the card. The longer body below the fields is optional and renders on
the project itself.

*Repo* and *Demo* links only appear if you fill them in — leaving them blank
hides the buttons rather than showing dead ones.

### Write an article

**Articles → New Article.** Write in Markdown. Tick **Draft** to keep it hidden
while you work; untick it to publish. Drafts never appear on the live site.

### Update your resume PDF

**Settings → Resume PDF → Choose an image/file → Upload.** Pick your new PDF.
The download button on the site points at whatever is uploaded here, so you
never need to change a link.

### Change your bio, headline, or any wording

**Settings.** Name, roles, bio, location, email and social links all live here.
The roles list is what cycles under your name in the hero.

### Change the colours

**Settings → Theme.** Pick an accent, background and foreground colour. The
whole site — buttons, links, the 3D hero's tint, card surfaces — derives from
these three, so changing the accent changes everything coherently.

Keep background and foreground far apart in brightness, or text becomes hard to
read.

### Reorder or hide sections

**Layout.** Drag the rows into the order you want. Untick **Visible** to hide a
section without deleting its content — useful if you want to hide *Positions of
Responsibility* while it's thin, and bring it back later.

### Add a completely new kind of section

**Sections → New Section.** This is how you add something the site was never
specifically designed for — *Talks*, *Certifications*, *Awards*, *Publications*.

1. Give it a title.
2. Pick a **layout**: `cards` (a grid), `timeline` (dated vertical rail),
   `list` (compact rows), or `logo-grid` (image tiles).
3. Add items. Each has a title plus optional subtitle, date, description,
   image, tags and links — use as few or as many as fit.
4. Go to **Layout** and drag the new section into position.

It picks up the site's existing styling automatically. No code change needed.

### Show your Medium articles

**Settings → Features → Medium Import**, then put your Medium handle (without
the `@`) in **Medium Handle**.

Two limits worth knowing, because they're Medium's, not ours:

- Only your **10 most recent** posts are available. Older ones can't be fetched.
- **Member-only (paywalled) posts** only expose a preview, so those appear as a
  card linking to Medium rather than rendering in full here.

Articles you write in **Articles** have neither limitation, render in full, and
stay forever. That's why they're the default.

---

## If a build fails

Your site does not go down. A failed build means the **previous version stays
live** — a bad edit can't take the site offline.

The usual cause is a required field left empty. To find it:

1. Open your project on [vercel.com](https://vercel.com) → **Deployments**.
2. Click the failed deployment → **Build Logs**.
3. Look for a line like:

   ```
   Invalid content in content/projects/my-project.md:
     • title: Too small: expected string to have >=1 characters
   ```

   That names the exact file and the exact field.

4. Go back to `/admin`, fix that field, and publish again.

## Undoing a mistake

Every publish is a commit, so nothing is ever really lost.

- **Small mistake:** just edit it back in `/admin`.
- **Bigger mistake:** open the repo on GitHub → **Commits**, find the one before
  the mistake, and revert it. The site rebuilds automatically.

---

## Troubleshooting

**"Sign in with GitHub" does nothing, or errors.**
The OAuth helper may be down or misconfigured. Fallback: sign in with a token
instead — see the *Token sign-in fallback* section in `README.md`. This always
works and needs no infrastructure.

**I published but the site looks unchanged.**
Wait a minute and hard-refresh (`Cmd+Shift+R`). If it's still stale after a few
minutes, check Vercel → Deployments for a failed build.

**An image doesn't appear.**
Images must be uploaded through the CMS, not pasted in as links to files on your
computer. Re-upload via the image field.

**I deleted something I wanted.**
See *Undoing a mistake* above. It's in the git history.
