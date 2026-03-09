---
title: 'Building a Table of Contents Sidebar Without a Library'
description: 'How I added a sticky, auto-highlighting table of contents to The Log using nothing but an IntersectionObserver, 60 lines of vanilla JS, and a bit of CSS.'
pubDate: 2026-03-09
tags: ['craft', 'javascript', 'css', 'the-log']
---

Long posts need navigation. If a reader lands halfway through a blog and wants to jump to a specific section, a wall of text with no landmarks is hostile. So I decided to add a table of contents sidebar to The Log.

I had one constraint: no library. The implementation had to be vanilla JS, composable with the existing Astro layout, and small enough that I could reason about every line of it.

Here is what I built and how.

## The Shape of the Thing

The sidebar sits to the left of the article. It is sticky, it stays in view as you scroll. Each heading in the post becomes a link. The currently-visible section gets highlighted in gold, tracking your reading position in real time.

On viewports narrower than 1080px it disappears entirely. The post column is too wide on mobile for a sidebar to make sense.

## The HTML

The structure is minimal. An `<aside>` with a label, a small heading, and an empty `<nav>`. The nav is intentionally empty at markup time, JavaScript fills it in after the page loads.

```astro
<aside class="toc-sidebar" aria-label="Table of contents">
  <p class="toc-title">On this page</p>
  <nav class="toc"></nav>
</aside>
```

The `<aside>` sits as a flex sibling of the `<article>` inside `<main>`. The post wrapper becomes a flex row:

```css
.post-wrapper {
	display: flex;
	justify-content: center;
	align-items: flex-start;
	gap: 3rem;
}
```

## The Sticky CSS

Sticky sidebars have one requirement: the parent must not have `overflow: hidden`. Beyond that, the setup is straightforward.

```css
.toc-sidebar {
	width: 190px;
	flex-shrink: 0;
	position: sticky;
	top: 5rem;
	max-height: calc(100vh - 7rem);
	overflow-y: auto;
	scrollbar-width: none;
}
```

`top: 5rem` respects the sticky header. `max-height` with `overflow-y: auto` means long tables of contents scroll independently of the page, the sidebar never grows taller than the viewport. `scrollbar-width: none` hides the scrollbar without removing the scrollability.

The link styles use a left border as the visual rail:

```css
.toc-link {
	display: block;
	font-family: var(--font-mono);
	font-size: 0.72rem;
	padding: 0.25rem 0;
	padding-left: 0.75rem;
	border-left: 1px solid var(--color-border);
	color: var(--color-text-muted);
	opacity: 0.55;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.toc-link.toc-active {
	color: var(--color-gold);
	opacity: 1;
	border-left-color: var(--color-gold);
}
```

H3 links get a deeper inset to convey hierarchy:

```css
.toc-h3 {
	padding-left: 1.35rem;
	font-size: 0.68rem;
}
```

## The JavaScript

The JS runs once on page load and does four things.

**1. Collect headings.** Query every `h2` and `h3` inside `.prose`, skip if there are none, and remove the sidebar.

```typescript
const headings = Array.from(
	document.querySelectorAll<HTMLElement>('.prose h2, .prose h3'),
)

if (headings.length === 0) {
	sidebar.remove()
	return
}
```

**2. Ensure IDs exist.** Astro's markdown renderer adds IDs to headings automatically, but MDX or custom components might not. I generate a fallback slug just in case.

```typescript
headings.forEach((h) => {
	if (!h.id) {
		h.id = (h.textContent ?? '')
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '')
	}
})
```

**3. Build the links.** For each heading, create an anchor, assign the right class for H2 vs H3, and append it to the nav. The click handler smooth-scrolls to the target rather than letting the browser jump.

```typescript
headings.forEach((h) => {
	const a = document.createElement('a')
	a.href = `#${h.id}`
	a.textContent = h.textContent ?? ''
	a.className = `toc-link ${h.tagName === 'H3' ? 'toc-h3' : 'toc-h2'}`
	a.addEventListener('click', (e) => {
		e.preventDefault()
		document
			.getElementById(h.id)
			?.scrollIntoView({ behavior: 'smooth', block: 'start' })
	})
	toc.appendChild(a)
})
```

**4. Track the active section.** This is where it gets interesting.

## Why IntersectionObserver, Not a Scroll Listener

The naive approach is to listen to the `scroll` event and check which heading is nearest the top of the viewport on every tick. That fires hundreds of times per second. Even with throttling, you are doing DOM measurements on a hot path.

`IntersectionObserver` inverts the model. Instead of polling the scroll position, you declare interest in specific elements and the browser tells you when they cross a threshold, asynchronously, off the main thread.

```typescript
const observer = new IntersectionObserver(
	(entries) => {
		const visible = entries
			.filter((e) => e.isIntersecting)
			.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

		if (visible.length > 0) setActive((visible[0].target as HTMLElement).id)
	},
	{ rootMargin: '0px 0px -70% 0px' },
)

headings.forEach((h) => observer.observe(h))
```

The `rootMargin: '0px 0px -70% 0px'` shrinks the effective viewport from the bottom by 70%. This means a heading only counts as "visible" when it is in the top 30% of the screen, which matches the intuition of "I am currently reading this section."

The callback receives all intersection changes in a batch, so I sort by `boundingClientRect.top` to find the topmost one and activate it.

No scroll listeners. No throttling. No `requestAnimationFrame`. The browser handles the scheduling.

## The Scroll Offset Fix

One side effect of a sticky header: clicking a TOC link scrolls the heading directly to the top of the viewport, behind the header. The fix is one CSS property:

```css
.prose h2,
.prose h3 {
	scroll-margin-top: 5.5rem;
}
```

`scroll-margin-top` is specifically designed for this. When the browser scrolls an element into view, whether via `scrollIntoView()`, a hash link, or a `:target` selector, it adds this margin on top. The element ends up 5.5rem below the top edge instead of flush with it.

## The Result

The whole thing is about 60 lines of JavaScript and no npm install. It degrades cleanly, if JS is off, the sidebar exists in the HTML but stays empty, and the post is entirely readable without it. On narrow screens, it is hidden and the post layout is unchanged.

The most interesting part of the implementation was the decision not to throttle. `IntersectionObserver` is not a scroll listener with better manners, it is a fundamentally different primitive. The browser is in charge of firing it, which means it never competes with the user's scroll for main thread time.

That is the kind of constraint I like. Not "do the fast version of the bad approach." Do the approach where the problem does not exist.
