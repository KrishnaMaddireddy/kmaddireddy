// Usage: npm run new -- "My article title"
import { writeFileSync, existsSync } from 'node:fs';

const title = process.argv.slice(2).join(' ').trim();
if (!title) {
  console.error('Add a title: npm run new -- "My article title"');
  process.exit(1);
}
const slug = title.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const file = `src/content/articles/${slug}.md`;
if (existsSync(file)) {
  console.error(`${file} already exists. Pick a different title.`);
  process.exit(1);
}
const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  file,
  `---\ntitle: ${JSON.stringify(title)}\ndescription: ""\ndate: ${today}\ntags: []\ndraft: true\n---\n\nStart writing here.\n`,
);
console.log(`Created ${file}. Set draft: false when it's ready to publish.`);
