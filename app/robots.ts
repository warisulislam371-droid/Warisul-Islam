export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/dashboard/',
        '/login/',
        '/api/private/',
      ],
    },
    sitemap: 'https://medbazarhelnex.shop/sitemap.xml',
  };
}
