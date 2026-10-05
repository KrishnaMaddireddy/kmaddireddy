// Fetches public repositories at build time. If GitHub can't be reached,
// the section falls back to profile links instead of failing the build.
export interface Repo {
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  pushedAt: string;
  owner: string;
}

const headers: Record<string, string> = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'kmaddireddy.com',
};
if (import.meta.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${import.meta.env.GITHUB_TOKEN}`;

async function list(path: string): Promise<Repo[]> {
  try {
    const res = await fetch(`https://api.github.com/${path}?per_page=100&sort=pushed&type=public`, { headers });
    if (!res.ok) return [];
    const data = (await res.json()) as any[];
    return data
      .filter((r) => !r.fork && !r.archived && !r.private && r.name !== '.github')
      .map((r) => ({
        name: r.name,
        fullName: r.full_name,
        url: r.html_url,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        pushedAt: r.pushed_at,
        owner: r.owner.login,
      }));
  } catch {
    return [];
  }
}

export async function getRepos(logins: string[], limit = 6): Promise<Repo[]> {
  // users/{login}/repos works for both people and organizations.
  const all = (await Promise.all(logins.map((l) => list(`users/${l}/repos`)))).flat();
  return all.sort((a, b) => b.stars - a.stars || b.pushedAt.localeCompare(a.pushedAt)).slice(0, limit);
}
