---
title: 'The Principles of Clean Code: A Pragmatic Guide'
description: 'Clean code is not about aesthetics. It is about reducing the cognitive cost of change. A look at the principles that separate code that lasts from code that accumulates debt.'
pubDate: 2026-02-22
tags: ['craft', 'principles', 'architecture', 'react']
---

There is a difference between code that works and code that is good. The former satisfies requirements. The latter does so in a way that the next developer, almost certainly a future version of yourself, can understand, modify, and extend without dread.

Clean code is not an aesthetic preference. It is an economic one. Poorly structured code eventually costs more to maintain than it cost to write.

## 1. Clarity over Cleverness

The most important question to ask of any code is not "does this work?" but "will the next reader understand _why_ this works?"

```typescript
// ❌ Clever — but what does it mean?
const v = xs.reduce((a, x) => a | (1 << x), 0)

// ✅ Clear — intent is explicit
const bitmask = flags.reduce((acc, flagIndex) => acc | (1 << flagIndex), 0)
```

Variable names are free. Explanatory names cost nothing at runtime. If you have to spend 10 seconds "decoding" a line of code, the abstraction has failed. **Rename without mercy.**

## 2. The Single Responsibility Principle (SRP)

A function should do one thing. In modern frontend development, this is often violated by "Mega-Components" that handle API calls, data transformation, and UI rendering all at once.

```typescript
// ❌ Violates SRP: Fetches, transforms, and renders
const UserProfile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/user').then(res => res.json()).then(data => {
      const formatted = { ...data, fullName: `${data.first} ${data.last}` };
      setUser(formatted);
    });
  }, []);

  return <div>{user?.fullName}</div>;
};

// ✅ Adheres to SRP: UI is separated from logic
const UserProfile = () => {
  const { user, loading } = useUserAccount(); // Logic lives in a custom hook
  return <div>{user?.fullName}</div>;
};

```

## 3. Prefer Pure Functions

A pure function has no side effects and always returns the same output for the same input. These are the building blocks of a predictable system: they are trivially testable and composable.

- **Impure:** Reaches out to a global variable or updates a database.
- **Pure:** Takes `(input) => output`.

Push side effects (API calls, DOM updates) to the edges of your system. Keep the core logic pure.

## 4. The "Rule of Three" (AHA Programming)

Clean code enthusiasts often fall into the trap of **premature abstraction**. We see two similar blocks of code and immediately try to create a generic component.

**AHA (Avoid Hasty Abstractions)** suggests that you should prefer duplication over the wrong abstraction.

> _“Duplication is far cheaper than the wrong abstraction.” — Sandi Metz_

Wait until you see a pattern repeat at least **three times** before abstracting it. This ensures your abstraction is based on actual requirements, not a guess about the future.

## 5. Names are the Best Documentation

Every name is an opportunity to communicate intent. Comment when the _why_ cannot be expressed in code. But prefer code that speaks for itself.

```typescript
// ❌ Bad — the comment is compensating for a bad name
// delay in ms before retry
const d = 3000

// ✅ Good — no comment needed
const RETRY_DELAY_MS = 3000
```

## 6. The Boy Scout Rule

**Always leave the codebase a little cleaner than you found it.** This doesn’t mean a full architectural refactor every time you open a file. It means:

- Renaming one poorly named variable.
- Breaking one 50-line function into two 25-line functions.
- Deleting a piece of dead code.

Applied consistently by a team, this compounds into a codebase that improves with time rather than decaying.

## Complexity is the Enemy

Every line of code is a liability. Every branch is a cognitive burden. The goal is not to be smart; the goal is to make the problem easy. The simplest solution that is correct is almost always the right solution.

Write code for the person who will read it next. That person deserves your best thinking, expressed as simply as possible.
