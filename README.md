# kmaddireddy.com

Personal site for Krishna Maddireddy: experience, apps, GitHub and articles.
Built with [Astro](https://astro.build) and hosted on Cloudflare.

## Run it locally

```sh
npm install
npm run dev        # http://localhost:4321
```

## Where things live

| What | File |
| --- | --- |
| Name, headline, about, links, "built from zero" timeline | `src/data/profile.json` |
| Apps (SpendQuery, PaakData, AskEider) | `src/data/apps.json` |
| Experience and education | `src/data/experience.json` |
| GitHub accounts shown in the GitHub section | `src/data/github.json` |
| Articles (one Markdown file each) | `src/content/articles/` |
| Images for articles | `public/images/articles/` |
| Colors and fonts | `src/styles/global.css` |

Public repositories from the GitHub accounts are pulled in automatically each time the site builds.

## Publish an article

**From the browser:** go to `https://kmaddireddy.com/admin`, sign in, click *New Article*, write, and click *Save*.
The editor commits the file to GitHub and Cloudflare rebuilds the site in about a minute.

Signing in: the quickest way is *Sign In with Token*. Create a GitHub fine-grained token at
<https://github.com/settings/personal-access-tokens/new> with access to only the `kmaddireddy` repository and
**Contents: Read and write** permission, then paste it in. (For a regular "Sign in with GitHub" button, deploy
[sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) and set `base_url` in `public/admin/config.yml`.)

**From your editor:**

```sh
npm run new -- "My article title"   # creates src/content/articles/my-article-title.md as a draft
# write it, set draft: false
git add . && git commit -m "New article" && git push
```

Front matter fields:

```yaml
title: My article title
description: One or two sentences shown in lists and link previews.
date: 2026-10-04
tags: [llm, data-quality]
draft: false                          # true hides it from the live site
originalUrl: https://www.linkedin.com/... # optional, adds an "Originally published on" link
```

Every article also appears in the RSS feed at `/rss.xml` and the sitemap.

## Deploy on Cloudflare (one-time setup)

1. **Push this folder to GitHub** as a new repository named `kmaddireddy` under `KrishnaMaddireddy`
   (private is fine):
   ```sh
   git remote add origin https://github.com/KrishnaMaddireddy/kmaddireddy.git
   git push -u origin main
   ```
2. In the Cloudflare dashboard, open **Workers & Pages → Create → Import a repository**, pick `kmaddireddy`, and use:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
3. Deploy. `wrangler.jsonc` attaches **kmaddireddy.com** and **www.kmaddireddy.com** to the site automatically, because
   the domain is already on Cloudflare. If either domain already has a DNS record pointing somewhere else, delete that
   record first (DNS → Records), then redeploy.

After that, every push to `main` (including saves from `/admin`) rebuilds and publishes the site.

Optional: add a `GITHUB_TOKEN` build variable (read-only, public repos) in the Cloudflare build settings if the GitHub
section ever hits GitHub's anonymous rate limit.

You can also deploy straight from your machine with `npx wrangler login` then `npm run deploy`.
