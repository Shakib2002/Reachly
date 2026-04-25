import { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/crm/', '/outreach/', '/analytics/', '/settings/', '/api/'] },
    sitemap: 'https://reachly.app/sitemap.xml',
  };
}
