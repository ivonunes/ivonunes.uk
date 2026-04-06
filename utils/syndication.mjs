import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import matter from 'gray-matter';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const site = require('../config/site.js');

const MAX_POSTS = Number(process.env.SYNDICATION_SCAN_LIMIT || 10);
const BEFORE_SHA = process.env.GITHUB_EVENT_BEFORE || '';
const HEAD_SHA = process.env.GITHUB_SHA || 'HEAD';

function runGit(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function inferPermalink(filePath, frontmatter = {}) {
  if (frontmatter.url) {
    return frontmatter.url;
  }

  const filename = filePath.split('/').pop().replace(/\.md$/, '');
  const [year, month, day, ...slugParts] = filename.split('-');
  return `/${year}/${month}/${day}/${slugParts.join('-')}/`;
}

function getChangedPostPaths() {
  if (BEFORE_SHA && !/^0+$/.test(BEFORE_SHA)) {
    try {
      const output = runGit(['diff', '--name-only', BEFORE_SHA, HEAD_SHA, '--', 'src/posts']);
      const changed = output.split('\n').map((value) => value.trim()).filter((value) => value.endsWith('.md'));
      if (changed.length) {
        return changed;
      }
    } catch {
      // Fall back to scanning recent posts if the diff fails.
    }
  }

  const output = runGit(['ls-files', 'src/posts']);
  return output.split('\n').map((value) => value.trim()).filter((value) => value.endsWith('.md')).sort().reverse().slice(0, MAX_POSTS);
}

async function waitForDeploy() {
  const url = `${site.url}/feed.xml`;
  for (let attempt = 1; attempt <= 18; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
      if (response.ok) {
        return;
      }
    } catch {
      // Ignore and retry.
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  throw new Error(`Timed out waiting for deployed site at ${url}`);
}

async function sendWebmention(source, target) {
  const response = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ source, target }).toString()
  });

  const location = response.headers.get('location');
  if (location) {
    return location;
  }

  const text = await response.text();
  try {
    const json = JSON.parse(text);
    return json.url || json.location || null;
  } catch {
    return text.startsWith('http') ? text.trim() : null;
  }
}

async function processPost(filePath) {
  const fileContent = await fs.readFile(filePath, 'utf8');
  const parsed = matter(fileContent);
  const targets = Array.isArray(parsed.data.syndicate_to) ? parsed.data.syndicate_to : [];
  const existing = Array.isArray(parsed.data.syndication) ? parsed.data.syndication : [];

  if (!targets.length || existing.length) {
    return null;
  }

  const sourceUrl = `${site.url}${inferPermalink(filePath, parsed.data)}`;
  const syndicatedUrls = [];

  for (const target of targets) {
    const syndicatedUrl = await sendWebmention(sourceUrl, target);
    if (syndicatedUrl) {
      syndicatedUrls.push(syndicatedUrl);
    }
  }

  if (!syndicatedUrls.length) {
    return null;
  }

  parsed.data.syndication = unique([...(parsed.data.syndication || []), ...syndicatedUrls]);
  parsed.data.lastmod = new Date().toISOString();
  await fs.writeFile(filePath, matter.stringify(parsed.content, parsed.data));
  return { filePath, syndicatedUrls };
}

async function main() {
  await waitForDeploy();

  const results = [];
  for (const filePath of getChangedPostPaths()) {
    const result = await processPost(filePath);
    if (result) {
      results.push(result);
    }
  }

  console.log(JSON.stringify({ processed: results.length, results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
