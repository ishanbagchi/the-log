---
title: 'The Scheduler API: Prioritizing Work on the Main Thread'
description: 'setTimeout(fn, 0) is a lie. Learn how the native Scheduler API and scheduler.postTask() give you real, priority-aware control over what the browser does and when, and why that distinction matters in high-performance applications.'
pubDate: 2026-03-19
tags: ['javascript', 'performance', 'architecture', 'craft']
---

Every performance problem in the browser eventually traces back to the same crime: something blocked the main thread for too long.

The user clicked a button. The browser wanted to run the click handler, repaint the changed pixel, and move on. But before it could, your application decided this was a great time to parse a 4 MB JSON payload, diff a 3,000-node virtual DOM, and synchronously compute analytics. The animation dropped frames. The button felt broken. The user noticed.

We have spent years routing around this problem. Debouncing, throttling, Web Workers, `requestIdleCallback`, virtualizing long lists — all of them are, at their core, strategies to stop doing too much on the main thread at once.

The Scheduler API takes a different angle. It doesn't tell you to do less work. It lets you tell the browser which work matters _right now_ and which can wait — and it actually enforces that.

## Why The Old Solutions Fall Short

Before reaching for anything new, it's worth being honest about the tools that already exist.

### `setTimeout(fn, 0)` — The Classic Lie

The canonical trick for "yielding to the browser" is wrapping work in a `setTimeout` with a zero-delay:

```javascript
setTimeout(() => {
	doExpensiveWork()
}, 0)
```

This defers `doExpensiveWork` until after the current synchronous call stack clears, which buys the browser a slot to repaint. It works, in the same way a Band-Aid works on a broken leg. The problem is that `setTimeout` callbacks are scheduled into a single, undifferentiated queue. Your deferred analytics code and your deferred critical rendering code are both "just callbacks." There is no concept of importance.

There's also the historical floor: browsers clamp `setTimeout` delays to a minimum of **4ms** after five nested calls, meaning you can't even rely on the zero-delay to mean "as soon as possible."

### `requestIdleCallback` — The Right Idea, Wrong API

`requestIdleCallback` was a genuine step forward. It lets you schedule low-priority work for browser idle periods:

```javascript
requestIdleCallback((deadline) => {
	while (deadline.timeRemaining() > 0 && tasks.length > 0) {
		tasks.shift()()
	}
})
```

You get a `deadline` object, you check how much time is left in the idle period, and you process work until it runs out. This prevents your background work from stealing time from user interactions.

But it has two cardinal limitations:

1. **No priority system.** `requestIdleCallback` is a binary: it's either "idle work" or "not idle work." There's no way to say "run this before _that_ idle task, because it matters more."
2. **Unreliable under load.** When the main thread is busy, idle periods shrink or disappear entirely. Critical deferred work might literally never run during a heavy interaction-driven session.

### `requestAnimationFrame` — The Wrong Abstraction

`requestAnimationFrame` is for animation. Specifically, it fires before each paint, giving you a reliable hook for writing to the DOM without causing layout thrash. Developers sometimes abuse it as a general "next-tick" mechanism.

```javascript
// This works but it's wrong.
// rAF is not meant for non-visual work.
requestAnimationFrame(() => {
	processBatchOfNonVisualData()
})
```

Using `rAF` for non-rendering work wastes the 16ms animation budget on things that have nothing to do with the frame. It can actually _cause_ jank by forcing non-visual computation into a time slot that was supposed to be reserved for drawing.

---

The common failure mode is the same across all three: **no shared, priority-aware queue**. Each of these APIs is its own island. The browser has no way to reason about relative importance across them.

That's the gap the Scheduler API is filling.

## The Scheduler API

The Scheduler API provides a first-class, priority-aware task queue built directly into the browser. Its primary interface is `scheduler.postTask()`.

```javascript
scheduler.postTask(() => {
	doSomeWork()
})
```

At its most basic level, this looks identical to `setTimeout(fn, 0)`. The difference is what's happening underneath. The task is registered with a **userspace scheduler** that understands priority levels, can abort tasks before they run, can have their priority changed after they're queued, and integrates correctly with the browser's own event loop priorities.

> **Browser support:** Chromium-based browsers have shipped the Scheduler API since Chrome 94. Firefox has it behind a flag. Safari does not support it yet. For production use today, you will need either feature detection with a graceful fallback (covered below) or the [WICG scheduler polyfill](https://github.com/nicolo-ribaudo/tc39-proposal-scheduler-polyfill). The API is stable and the cross-browser gap is narrowing.

## Priority Levels

Every task submitted to `scheduler.postTask()` has a priority. There are exactly three, and they map directly to the browser's own internal task prioritization:

| Priority | Value             | Roughly Equivalent To         |
| -------- | ----------------- | ----------------------------- |
| Highest  | `'user-blocking'` | Mouse/keyboard input handlers |
| Default  | `'user-visible'`  | `setTimeout(fn, 0)`           |
| Lowest   | `'background'`    | `requestIdleCallback`         |

```javascript
// High priority — treat this like user input
scheduler.postTask(() => updateCriticalUI(), { priority: 'user-blocking' })

// Default priority — non-urgent but visible work
scheduler.postTask(() => renderSecondaryContent(), { priority: 'user-visible' })

// Low priority — this can wait until the browser is truly idle
scheduler.postTask(() => sendAnalyticsEvent(), { priority: 'background' })
```

The browser enforces this ordering. A `'background'` task will not preempt a `'user-blocking'` one. If a high-priority task arrives while a lower-priority one is still queued, the high-priority work goes first.

That sounds like a table-stakes guarantee. But it's the first time the platform has given us an actual mechanism to express it.

### Choosing the Right Priority

**`user-blocking`** should be reserved for work whose absence is directly visible to the user as a broken interaction. Rendering the direct result of a click. Updating a focused form field. If the user has to wait for this and the wait is noticeable, use `user-blocking`.

**`user-visible`** (the default) is for work that needs to happen soon, but can tolerate a single frame of delay. Data transformations that drive a chart update. Lazy populating a dropdown. Most of your "important but not critical" deferred work lives here.

**`background`** is for work the user will never directly observe in the immediate moment. Telemetry, prefetching, warming caches, building search indexes, syncing non-visible state. If it's fine to run in idle time, it belongs here.

## `scheduler.postTask()` Returns a Promise

`scheduler.postTask()` returns a `Promise` that resolves with whatever your callback returns. That changes the ergonomics a lot.

```javascript
const result = await scheduler.postTask(
	() => {
		return computeExpensiveValue(largeDataset)
	},
	{ priority: 'background' },
)

console.log(result) // The computed value, available when the task completes
```

This means you can chain deferred work naturally, without deeply nested callbacks or manual coordination. You get the async/await model with the browser's scheduler underneath.

```javascript
async function buildReportData(raw) {
	// Step 1: Parse — this is CPU heavy, keep it off the critical path
	const parsed = await scheduler.postTask(() => parseRawData(raw), {
		priority: 'background',
	})

	// Step 2: Aggregate — still background, can run after parse
	const aggregated = await scheduler.postTask(
		() => aggregateByDimension(parsed),
		{ priority: 'background' },
	)

	// Step 3: Render the result — now it's visible work
	await scheduler.postTask(() => renderReport(aggregated), {
		priority: 'user-visible',
	})
}
```

Each step yields back to the browser between phases. User interactions that happen while the background processing is in flight still get priority. The report data will appear when the browser gets around to it, but it won't block a scroll or a click.

## Aborting Tasks with `TaskController`

Deferred work is sometimes invalidated before it runs. A user navigates away. A filter changes before the previous filter's result has been computed. A component unmounts.

`postTask` was designed for this. You pass a `signal` derived from a `TaskController`, and you call `.abort()` when the work is no longer needed:

```javascript
const controller = new TaskController({ priority: 'background' })

scheduler.postTask(() => buildLargeIndex(data), {
	signal: controller.signal,
})

// Later: the user's action has made this work irrelevant
controller.abort()
```

When `.abort()` is called, the promise returned by `postTask` rejects with an `AbortError`. You handle it the same way you would handle a cancelled `fetch`:

```javascript
try {
	await scheduler.postTask(() => buildLargeIndex(data), {
		signal: controller.signal,
	})
} catch (err) {
	if (err.name === 'AbortError') {
		// Task was cancelled. This is expected, not an error.
		return
	}
	throw err
}
```

This isn't just a nice-to-have. Without explicit cancellation you can end up with a stale-result race condition — an invalidated background task finishing _after_ a newer one and overwriting fresh data with stale results. It's the kind of bug that only appears under load and is miserable to track down.

## Changing Priority Dynamically

`TaskController` gives you another capability that other scheduling primitives simply don't have: you can change the priority of a queued task after it's been submitted.

```javascript
const controller = new TaskController({ priority: 'background' })

scheduler.postTask(() => preprocessSearchIndex(documents), {
	signal: controller.signal,
})

// User opens the search box — this work is now urgent
controller.setPriority('user-visible')
```

Think about what this means. The task was sitting quietly in the background doing preprocessing. The user opens search — now that work is suddenly relevant to something imminent. You don't cancel it and resubmit. You promote it in place.

The reverse works too. A task you thought mattered becomes irrelevant mid-flight. Demote it. Free up the headroom. The API was designed to support this kind of dynamic context, and it shows.

## Delaying Tasks

`postTask` also accepts a `delay` option, which is a minimum delay in milliseconds before the task is eligible to run:

```javascript
scheduler.postTask(() => prefetchNextPageData(), {
	priority: 'background',
	delay: 2000, // Don't even consider this for 2 seconds
})
```

This is subtly different from `setTimeout`. With `setTimeout`, the callback fires after the delay, full stop. With `postTask`, the `delay` sets a floor on _when the task becomes eligible_, but the actual execution still respects the priority queue. A `user-blocking` task that arrives after the delay would still preempt this `background` task.

It's a minimum delay, not a scheduled time.

## A Practical Pattern: The Task Queue with Chunking

One of the most effective patterns with the Scheduler API is breaking a large synchronous loop into scheduled chunks. The naive version blocks the main thread for the duration of the loop:

```javascript
// ❌ This processes 10,000 items synchronously.
// Nothing else can run until it's done.
function processAll(items) {
	for (const item of items) {
		processItem(item)
	}
}
```

The `scheduler.yield()` proposal (part of the same spec) is the cleanest answer here, but until it ships everywhere, you can approximate it with `postTask`:

```javascript
async function processInChunks(items, chunkSize = 50) {
	const chunks = []
	for (let i = 0; i < items.length; i += chunkSize) {
		chunks.push(items.slice(i, i + chunkSize))
	}

	for (const chunk of chunks) {
		await scheduler.postTask(
			() => {
				for (const item of chunk) {
					processItem(item)
				}
			},
			{ priority: 'background' },
		)
	}
}
```

Each chunk is a separate background task. Between chunks, the browser handles input, runs higher-priority work, and repaints. The total wall-clock time for all the processing is slightly longer than the synchronous version. But the **interaction latency** — how long the user waits for a response after clicking — drops. That's the trade-off worth making, and with `postTask` you can actually express it cleanly.

## Composing with React

If you're in a React codebase, this integrates cleanly with `useEffect`. The pattern is nearly identical to how you'd cancel a `fetch` inside an effect — a controller, a signal, and cleanup on return:

```typescript
function useBackgroundProcessor<T>(data: T[], processor: (item: T) => void) {
	useEffect(() => {
		const controller = new TaskController({ priority: 'background' })
		let cancelled = false

		async function run() {
			const chunkSize = 100
			for (let i = 0; i < data.length; i += chunkSize) {
				if (cancelled) break

				const chunk = data.slice(i, i + chunkSize)

				try {
					await scheduler.postTask(
						() => {
							chunk.forEach(processor)
						},
						{ priority: 'background', signal: controller.signal },
					)
				} catch (err) {
					if ((err as Error).name === 'AbortError') return
					throw err
				}
			}
		}

		run()

		return () => {
			cancelled = true
			controller.abort()
		}
	}, [data, processor])
}
```

The `useEffect` cleanup cancels in-flight tasks and prevents the processor from starting new chunks after unmount. If your component remounts before the previous run finishes, you get a fresh controller and a clean slate.

## How This Relates to React's Concurrent Mode

React 18 introduced concurrent rendering — the ability to interrupt and resume render work, deprioritize updates, and yield to more urgent interactions. React's internal scheduler is a userspace implementation of basically this same concept: priority lanes, preemption, interruptible work.

So — are they redundant? No. The scope is different.

React's scheduler only knows about React's own render work. The browser Scheduler API handles any JavaScript task you give it, React or not. Background data processing, analytics pipelines, search indexing — none of that passes through React's scheduler, but it can all go through `scheduler.postTask`.

They don't step on each other. React handles its own rendering priority internally. You reach for `scheduler.postTask` for everything happening outside the render pipeline.

## Feature Detection and Fallbacks

For production use, you need a fallback strategy for browsers that haven't shipped the API yet. The simplest approach is feature-detecting at callsites:

```javascript
function scheduleTask(callback, options = {}) {
	if ('scheduler' in globalThis && 'postTask' in scheduler) {
		return scheduler.postTask(callback, options)
	}

	// Graceful degradation.
	// Background tasks become setTimeout; blocking tasks run synchronously.
	const { priority = 'user-visible', delay = 0 } = options
	if (priority === 'user-blocking') {
		return Promise.resolve(callback())
	}
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			try {
				resolve(callback())
			} catch (e) {
				reject(e)
			}
		}, delay)
	})
}
```

This is not a perfect polyfill — `setTimeout` doesn't respect the same priority ordering — but it's a reasonable approximation that degrades to the existing behavior rather than throwing. For a stricter cross-browser implementation, the [WICG Polyfill](https://github.com/nicolo-ribaudo/tc39-proposal-scheduler-polyfill) is the reference implementation maintained alongside the spec.

## When Not to Reach For This

A few places I've seen this misused — and at least one of them was in my own code.

**Don't reach for it when work genuinely needs to be synchronous.** If a click must produce an immediate, perceptible result, yielding to the event loop is the wrong move. You'll introduce a visible delay where there was none. Update the DOM synchronously, _then_ defer any secondary work that can wait.

**It's not a substitute for a Web Worker.** This one trips people up. Moving CPU-heavy work — image processing, parsing, cryptography — to a `background` task defers _when_ it runs, but when it does run, it still blocks the main thread. A task that takes 200ms and is scheduled as `background` will still drop frames when it fires. Off-thread is categorically different from low-priority.

**Don't over-chunk.** `postTask` has overhead. Splitting 10,000 items into 10,000 individual tasks costs more in coordination than it saves in responsiveness. 50–100 items per chunk, targeting the 4–8ms range per task, is a reasonable starting point. Measure your actual processing time — don't guess.

## The Takeaway

The main thread isn't going anywhere. Web Workers are useful but they don't touch the DOM, and most UI work happens where the DOM lives. That's not changing.

What we've always lacked is a way to be _precise_ about what matters when. `setTimeout(fn, 0)` is a blunt instrument — it says "run this eventually." The Scheduler API gives you the ability to say "run this before that, but after those, and here's how to reach me if things change."

That's not an incremental improvement. It's a different abstraction for expressing intent.

The browser support situation means you'll need a fallback for now. But the API is stable, Chromium has shipped it for years, and the rest of the ecosystem is catching up. It's worth understanding before you need it — because when you do need it, you'll really need it.
