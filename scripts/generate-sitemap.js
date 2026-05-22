import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://titanapp.qzz.io';
const ROUTES = [
  '/', // App Dashboard
  '/home', // Marketing Landing
  '/features',
  '/ai-task-manager',
  '/expense-tracker',
  '/shared-expenses',
  '/life-timeline',
  '/install-titan',
  '/blog',
  '/welcome',
  '/privacy',
  '/terms',
  '/personal-life-os',
  '/split-expenses-app',
  '/what-is-titan',
  '/life-management-app',
];

// In a real scenario, you'd fetch blog slugs from your data source
const BLOG_SLUGS = [
  'the-future-of-personal-operating-systems',
  'why-offline-first-matters-for-productivity',
];

function generateSitemap() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${ROUTES.map(
    (route) => `
  <url>
    <loc>${BASE_URL}${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === '/home' ? '1.0' : route === '/' ? '0.9' : '0.8'}</priority>
  </url>`,
  ).join('')}
  ${BLOG_SLUGS.map(
    (slug) => `
  <url>
    <loc>${BASE_URL}/blog/${slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`,
  ).join('')}
</urlset>`;

  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml.trim());
  console.log('✅ sitemap.xml generated successfully in /public');
}

generateSitemap();
