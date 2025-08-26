import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  // Base URLs
  const baseUrl = 'https://almacenajes-minidepositos.com';
  
  // Static pages
  const staticPages = [
    '',
    '/en',
    '/blog',
    '/en/blog',
  ];
  
  const blogArticles = [
    {
      slug: 'como-elegir-tamano-perfecto-minideposito',
      date: '2024-03-15',
      lang: 'es'
    },
    {
      slug: 'consejos-seguridad-almacenar-documentos-importantes',
      date: '2024-03-10',
      lang: 'es'
    },
    {
      slug: 'organizar-mudanza-mini-deposito-temporal',
      date: '2024-03-05',
      lang: 'es'
    },
    {
      slug: 'ventajas-minidepositos-vs-bodega-tradicional',
      date: '2024-02-28',
      lang: 'es'
    },
    {
      slug: 'preparar-objetos-almacenamiento-largo-plazo',
      date: '2024-02-20',
      lang: 'es'
    },
    // English versions
    {
      slug: 'how-to-choose-perfect-size-mini-storage-unit',
      date: '2024-03-15',
      lang: 'en'
    },
    {
      slug: 'security-tips-storing-important-documents',
      date: '2024-03-10',
      lang: 'en'
    },
    {
      slug: 'organize-move-using-temporary-mini-storage',
      date: '2024-03-05',
      lang: 'en'
    },
    {
      slug: 'advantages-mini-storage-vs-traditional-warehouse',
      date: '2024-02-28',
      lang: 'en'
    },
    {
      slug: 'prepare-items-long-term-storage',
      date: '2024-02-20',
      lang: 'en'
    }
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages.map(page => `
  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('')}
  
  ${blogArticles.map(article => `
  <url>
    <loc>${baseUrl}${article.lang === 'en' ? '/en' : ''}/blog/${article.slug}</loc>
    <lastmod>${article.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    }
  });
};
