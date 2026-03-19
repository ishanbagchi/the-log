#!/usr/bin/env node

/**
 * Usage: node scripts/new-post.mjs "My Post Title"
 *        node scripts/new-post.mjs "My Post Title" --mdx
 */

import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, '../src/content/blog');

const args = process.argv.slice(2);
const useMdx = args.includes('--mdx');
const titleArg = args
  .filter((a) => !a.startsWith('--'))
  .join(' ')
  .trim();

if (!titleArg) {
  console.error('Usage: node scripts/new-post.mjs "My Post Title" [--mdx]');
  process.exit(1);
}

const slug = titleArg
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .trim()
  .replace(/\s+/g, '-');

const ext = useMdx ? 'mdx' : 'md';
const dir = join(CONTENT_DIR, slug);
const file = join(dir, `index.${ext}`);

if (existsSync(file)) {
  console.error(`Post already exists: ${file}`);
  process.exit(1);
}

const today = (() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
})();

const frontmatter = `---
title: '${titleArg}'
description: ''
pubDate: ${today}
tags: []
draft: true
---

`;

mkdirSync(dir, { recursive: true });
writeFileSync(file, frontmatter, 'utf-8');

console.log(`Created: src/content/blog/${slug}/index.${ext}`);
