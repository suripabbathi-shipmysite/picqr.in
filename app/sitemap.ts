export default function sitemap() {
  return [
    { url: 'https://picqr.in', lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: 'https://picqr.in/signup', lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: 'https://picqr.in/login', lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: 'https://picqr.in/pricing', lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
  ];
}