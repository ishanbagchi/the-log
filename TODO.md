# TODO — Blog Site

A running list of features, fixes, and improvements to add to the site.

---

## Bug Fixes

- [x] **Fix broken slugs for folder-based posts** — `toRouteSlug()` in `index.astro` only strips `.md`, so posts like `scheduler-api-prioritizing-main-thread-work/index.md` produce a wrong href (`/log/.../index`). Strip both `.mdx` and `/index` to match what `[...slug].astro` already does.
- [x] **Remove duplicate `---` closing delimiter** in `settings.astro` frontmatter.
- [x] **Delete or use `Welcome.astro`** — currently imported nowhere (dead code).

---

## SEO & Discoverability

- [ ] **RSS feed** — add `@astrojs/rss` and expose a `/rss.xml` endpoint.
- [ ] **Sitemap** — add `@astrojs/sitemap` integration so search engines can crawl all pages.
- [ ] **`robots.txt`** — add a `public/robots.txt` that allows all crawlers and points to the sitemap.
- [ ] **Twitter/X card meta tags** — add `twitter:card`, `twitter:title`, `twitter:description`, `twitter:creator` to the `<head>`.
- [ ] **Per-post OG image** — generate dynamic Open Graph images (e.g. using `@vercel/og` or Astro's canvas-based OG image endpoint) so every post gets a unique social preview card.

---

## Navigation & UX

- [ ] **Custom 404 page** — add `src/pages/404.astro` with a friendly message and a link back home.
- [ ] **View Transitions** — enable Astro's built-in `<ViewTransitions />` for smooth page-to-page animations.
- [ ] **Pagination on the home page** — once post count grows, paginate or add a "Load more" button instead of listing everything.
- [ ] **Full-text search** — integrate [Pagefind](https://pagefind.app) (static, zero-JS by default) or [Fuse.js](https://fusejs.io) for client-side search beyond tag filtering.
- [ ] **Related posts** — show 2–3 posts with overlapping tags at the bottom of each blog post.
- [ ] **Reading progress bar** — a thin bar at the top of the viewport that fills as you scroll through a post.
- [ ] **Back-to-top button** — appears after scrolling down, smoothly scrolls back to top.
- [ ] **Estimated reading time on blog cards** — surface reading time directly on `BlogCard` so users can gauge length before clicking.

---

## Content Features

- [ ] **`updatedDate` on posts** — populate the `updatedDate` field in frontmatter for posts that get revised; the layout already supports displaying it.
- [ ] **Series / multi-part posts** — add a `series` frontmatter field and render a "Part N of M" navigation strip inside the post layout.
- [ ] **Footnotes/sidenotes** — consider a sidenote component for asides that don't break prose flow.
- [ ] **Callout / admonition component** — a reusable `<Callout type="note|warning|tip" />` component for MDX posts.
- [ ] **Embed components** — reusable MDX components for CodePen, YouTube, Twitter/X, etc.

---

## Performance & Infrastructure

- [ ] **Self-host fonts** — download the Google Fonts files and serve them from `public/fonts/` to remove the external render-blocking request and improve privacy.
- [ ] **Image optimization** — use Astro's `<Image />` component (or `<Picture />`) for any images in posts to get automatic WebP conversion and lazy loading.
- [ ] **Bundle audit** — run `astro build --report` and check if any large client-side JS can be trimmed.

---

## Developer Experience

- [ ] **Prettier / ESLint config** — add consistent formatting rules so contributors (or future-you) don't bikeshed on style.
- [ ] **Deploy preview comments** — set up Vercel preview deployments with branch comments so you can review posts before merging.
- [ ] **Content drafts workflow** — document or script a way to create a new draft post from a template file.
- [ ] **Update README** — replace the default Astro starter README with one that describes this specific project, its conventions, and how to add a new post.

---

## Nice-to-Have / Stretch Goals

- [ ] **Newsletter signup** — embed a simple email capture form (Buttondown, ConvertKit, etc.).
- [ ] **Post reactions / likes** — a lightweight "found this helpful?" interaction, could be backed by a serverless function or a service like [lyket](https://lyket.dev).
- [ ] **Comments** — integrate a privacy-friendly comment system (Giscus via GitHub Discussions is a good fit for a developer blog).
- [ ] **Keyboard shortcuts** — `T` to toggle theme, `S` to jump to search, etc.
- [ ] **Print stylesheet** — clean print CSS so posts look good when saved as PDF.
