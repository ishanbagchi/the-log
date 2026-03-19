# TODO — Blog Site

A running list of features, fixes, and improvements to add to the site.

---

## Bug Fixes

- [x] **Fix broken slugs for folder-based posts** — `toRouteSlug()` in `index.astro` only strips `.md`, so posts like `scheduler-api-prioritizing-main-thread-work/index.md` produce a wrong href (`/log/.../index`). Strip both `.mdx` and `/index` to match what `[...slug].astro` already does.
- [x] **Remove duplicate `---` closing delimiter** in `settings.astro` frontmatter.
- [x] **Delete or use `Welcome.astro`** — currently imported nowhere (dead code).

---

## SEO & Discoverability

- [x] **RSS feed** — add `@astrojs/rss` and expose a `/rss.xml` endpoint.
- [x] **Sitemap** — add `@astrojs/sitemap` integration so search engines can crawl all pages.
- [x] **`robots.txt`** — add a `public/robots.txt` that allows all crawlers and points to the sitemap.
- [x] **Twitter/X card meta tags** — add `twitter:card`, `twitter:title`, `twitter:description`, `twitter:creator` to the `<head>`.
- [x] **Per-post OG image** — generate dynamic Open Graph images (e.g. using `@vercel/og` or Astro's canvas-based OG image endpoint) so every post gets a unique social preview card.

---

## Navigation & UX

- [x] **Custom 404 page** — add `src/pages/404.astro` with a friendly message and a link back home.
- [x] **View Transitions** — enable Astro's built-in `<ViewTransitions />` for smooth page-to-page animations.
- [x] **Pagination on the home page** — once post count grows, paginate or add a "Load more" button instead of listing everything.
- [x] **Full-text search** — integrate [Pagefind](https://pagefind.app) (static, zero-JS by default) or [Fuse.js](https://fusejs.io) for client-side search beyond tag filtering.
- [x] **Related posts** — show 2–3 posts with overlapping tags at the bottom of each blog post.
- [x] **Reading progress bar** — a thin bar at the top of the viewport that fills as you scroll through a post.
- [x] **Back-to-top button** — appears after scrolling down, smoothly scrolls back to top.
- [x] **Estimated reading time on blog cards** — surface reading time directly on `BlogCard` so users can gauge length before clicking.
- [ ] **Previous / Next post navigation** — chronological prev/next links at the bottom of each post so readers can move through the archive without going back to the list.
- [ ] **Shareable heading anchors** — auto-generated `#` anchor icons on `h2`/`h3` headings (via `rehype-autolink-headings`) so readers can link to a specific section.
- [ ] **Tag pages** — dedicated `/tag/[tag]` routes that are linkable and crawlable; currently tag filtering only works client-side on the home page.
- [ ] **Active section highlight in TOC** — as the reader scrolls, highlight the currently visible heading in the TOC sidebar using an `IntersectionObserver`.
- [ ] **Year grouping on home page** — group the post list by calendar year with a subtle year label, making the archive easier to scan as it grows.
- [ ] **Social share strip** — a small row at the end of each post with a "Copy link" button and a "Share on X" link.
- [ ] **Skip-to-content link** — a visually hidden `<a href="#main">Skip to content</a>` that becomes visible on focus, for keyboard and screen-reader users.
- [ ] **Smooth-scroll to hash on load** — when arriving at a URL with a `#` fragment (TOC links, `/settings#shortcuts`, heading anchors), scroll smoothly instead of jumping.

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

- [x] **Prettier / ESLint config** — add consistent formatting rules so contributors (or future-you) don't bikeshed on style.
- [x] **Content drafts workflow** — document or script a way to create a new draft post from a template file.
- [x] **Update README** — replace the default Astro starter README with one that describes this specific project, its conventions, and how to add a new post.
- [ ] **Deploy preview comments** — set up Vercel preview deployments with branch comments so you can review posts before merging.

---

## Nice-to-Have / Stretch Goals

- [ ] **Newsletter signup** — embed a simple email capture form (Buttondown, ConvertKit, etc.).
- [ ] **Post reactions / likes** — a lightweight "found this helpful?" interaction, could be backed by a serverless function or a service like [lyket](https://lyket.dev).
- [ ] **Comments** — integrate a privacy-friendly comment system (Giscus via GitHub Discussions is a good fit for a developer blog).
- [x] **Keyboard shortcuts** — `T` to toggle theme, `S` to jump to search, etc.
- [ ] **Print stylesheet** — clean print CSS so posts look good when saved as PDF.
