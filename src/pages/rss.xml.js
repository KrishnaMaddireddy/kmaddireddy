import rss from '@astrojs/rss';
import profile from '../data/profile.json';
import { getArticles } from '../lib/articles';

export async function GET(context) {
  const articles = await getArticles();
  return rss({
    title: `${profile.name} — Articles`,
    description: 'Writing on data platforms, analytics and AI products.',
    site: context.site,
    items: articles.map((a) => ({
      title: a.data.title,
      description: a.data.description,
      pubDate: a.data.date,
      categories: a.data.tags,
      link: `/articles/${a.id}/`,
    })),
  });
}
