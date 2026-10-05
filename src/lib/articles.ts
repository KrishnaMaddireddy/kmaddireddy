import { getCollection } from 'astro:content';

export async function getArticles() {
  const all = await getCollection('articles', ({ data }) => import.meta.env.DEV || !data.draft);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function readingTime(body = '') {
  return Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 230));
}
