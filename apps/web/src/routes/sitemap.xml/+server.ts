export const prerender = true;

export async function GET() {
  const domain = 'https://bovett.se';
  const pages = ['', 'kalp', 'kunskap', 'privacy', 'app', 'onboarding', 'finance-planning'];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages
    .map((page) => {
      return `
  <url>
    <loc>${domain}/${page}</loc>
    <changefreq>${page === '' || page === 'kunskap' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${page === '' ? '1.0' : page === 'app' ? '0.9' : '0.8'}</priority>
  </url>`;
    })
    .join('')}
</urlset>`.trim();

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml'
    }
  });
}
