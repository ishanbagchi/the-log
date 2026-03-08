---
title: 'Breaking Free from the Render Cycle: Event-Driven Frontend Architecture'
description: 'React state is powerful, but in complex dashboards it can become a bottleneck. Learn how to use the native CustomEvent API to build a type-safe client-side pub/sub event bus that decouples components and eliminates unnecessary re-renders.'
pubDate: 2026-02-22
tags: ['react', 'architecture', 'performance', 'typescript']
---

React encourages a very specific mental model: data flows **top-down**.

Parents pass props to children, state is lifted to common ancestors, and the UI updates predictably when that state changes. This works beautifully for most applications.

But large dashboards expose a limitation.

React assumes data flows like a **tree**.  
Real-world dashboards behave more like a **network**.

Independent widgets need to communicate with each other without necessarily sharing a direct parent-child relationship. When the "React way" forces you to lift state near the root just so two distant components can talk, the render cycle can quickly become expensive.

Imagine a dashboard with:

- 12 charts
- 3 large data tables
- 8 filter controls
- multiple sidebar widgets

A single filter change lifts state near the root.

Even if only two charts care about that filter, React still needs to walk through the component tree during reconciliation. The render cost grows with the size of the tree, not with the number of components that actually care about the change.

The result is a large **render blast radius** triggered by a tiny interaction.

This is where an **Event-Driven Architecture** can help.

Instead of forcing all communication through React state, components can broadcast events and subscribe to the ones they care about.

The browser already provides a perfect mechanism for this.

## The Native Solution: `CustomEvent`

The DOM has had an event system for decades. We can leverage the native `CustomEvent` API to implement a lightweight client-side **pub/sub event bus**.

In simple terms:

React state is like passing a note through a classroom row by row.

Events are like making an announcement over a speaker.  
Only the people who care will react.

This approach decouples components while keeping the UI responsive.

### 1. Building a Type-Safe Event Bus

We start by defining an event map in TypeScript. This ensures that both publishers and subscribers agree on the structure of the event payload.

```typescript
// eventBus.ts

type EventMap = {
	FILTER_CHANGED: { category: string; value: string[] }
	WIDGET_EXPANDED: { widgetId: string }
	DATA_REFRESH_REQUESTED: void
}

export const EventBus = {
	dispatch<K extends keyof EventMap>(event: K, detail?: EventMap[K]) {
		const customEvent = new CustomEvent(event, { detail })
		window.dispatchEvent(customEvent)
	},

	subscribe<K extends keyof EventMap>(
		event: K,
		callback: (data: EventMap[K]) => void,
	) {
		const handler = (e: Event) => callback((e as CustomEvent).detail)

		window.addEventListener(event, handler)

		return () => window.removeEventListener(event, handler)
	},
}
```

This gives us two powerful guarantees:

1. **Decoupled communication** between components
2. **Type safety**, preventing mismatched event payloads

If someone dispatches an incorrect payload, TypeScript will catch it before runtime.

### 2. Broadcasting an Event (Publisher)

A filter component deep inside a sidebar can broadcast an update without knowing which components depend on it.

```tsx
// SidebarFilter.tsx

import { EventBus } from './eventBus'

export function SidebarFilter() {
  const handleSelection = (category: string, value: string[]) => {
    EventBus.dispatch('FILTER_CHANGED', { category, value })
  }

  return (
    // filter UI
  )
}
```

This action triggers **no React re-renders** by itself.
It simply emits a browser event.

### 3. Subscribing to the Event (Consumer)

A chart widget somewhere else on the page can subscribe to that event and update its own local state.

```tsx
// RevenueChartWidget.tsx

import { useEffect, useState } from 'react'
import { EventBus } from './eventBus'

export function RevenueChartWidget() {
  const [filters, setFilters] = useState<string[]>([])

  useEffect(() => {
    const unsubscribe = EventBus.subscribe('FILTER_CHANGED', (data) => {
      if (data.category === 'revenue') {
        setFilters(data.value)
      }
    })

    return () => unsubscribe()
  }, [])

  return (
    // chart UI that re-renders only when needed
  )
}
```

The key idea here is isolation.

Only the component that subscribes to the event updates.
The rest of the dashboard remains untouched.

Instead of a root-level state update triggering a wide render pass, only interested components react.

## When This Pattern Works Well

Event-driven communication is not meant to replace React state entirely. React state is still the best tool when data directly drives UI structure.

However, events shine in specific scenarios:

### Independent Dashboard Widgets

When multiple charts or widgets need to react to global filters without re-rendering the surrounding layout.

### Toast Notifications

A deep API utility can emit an event like `SHOW_TOAST_SUCCESS` without passing callback functions through multiple component layers.

### Cross-Framework Communication

If you're building micro-frontends, DOM events become a universal communication layer.

A React component can dispatch an event.
A Vue component can subscribe.
A plain JavaScript module can react.

The browser itself becomes the integration layer.

## Tradeoffs to Consider

Event-driven systems introduce flexibility, but they also introduce complexity.

### Harder Debugging

With React props and state, data flow is explicit.

Events introduce indirect communication:

Component A emits an event
Component B reacts
Component C updates later

Tracing that chain can be less obvious.

### Event Overuse

If every interaction becomes an event, the system can quickly resemble a message broker.

Too many events can create hidden coupling between parts of the application.

Like any architectural pattern, moderation matters.

## The Takeaway

Frameworks like React help us **render UI** efficiently.

But architecture is really about **how information moves through the system**.

Sometimes the cleanest solution is not more state, more context, or another store library. Sometimes the browser already provides the simplest tool.

By leveraging native DOM events, you can reduce coupling between components, limit unnecessary renders, and build dashboards that remain responsive even under heavy interaction.

React manages rendering.

Events manage communication.

Understanding when to use each is what separates component coding from frontend architecture.
