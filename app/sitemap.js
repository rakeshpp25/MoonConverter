export default async function sitemap() {
  const baseUrl = 'https://moonconverter.com'; // 

  // 1. Core Static Landing Routes (Only real accessible pages!)
  const staticRoutes = [
    '',
    '/feedback',
    '/about', 
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly',
    priority: 1.0,
  }));

  // 2. Comprehensive Format Conversion Matrix
  const formatPairs = [
    // PNG Outbound
    'png-to-jpg', 'png-to-webp', 'png-to-avif', 'png-to-ico', 'png-to-gif', 'png-to-bmp', 'png-to-pdf',
    
    // JPG / JPEG Outbound
    'jpg-to-png', 'jpg-to-webp', 'jpg-to-avif', 'jpg-to-ico', 'jpg-to-gif', 'jpg-to-bmp', 'jpg-to-pdf',
    'jpeg-to-png', 'jpeg-to-webp', 'jpeg-to-avif', 'jpeg-to-ico', 'jpeg-to-gif', 'jpeg-to-bmp', 'jpeg-to-pdf',
    
    // WebP Outbound
    'webp-to-png', 'webp-to-jpg', 'webp-to-avif', 'webp-to-ico', 'webp-to-gif', 'webp-to-bmp', 'webp-to-pdf',
    
    // AVIF Outbound
    'avif-to-png', 'avif-to-jpg', 'avif-to-webp', 'avif-to-ico', 'avif-to-gif', 'avif-to-bmp', 'avif-to-pdf',
    
    // ICO Outbound
    'ico-to-png', 'ico-to-jpg', 'ico-to-webp',
    
    // GIF Outbound
    'gif-to-png', 'gif-to-jpg', 'gif-to-webp', 'gif-to-pdf',
    
    // BMP Outbound
    'bmp-to-png', 'bmp-to-jpg', 'bmp-to-webp',

    // 📄 PDF Inbound Routes
    'pdf-to-jpg', 'pdf-to-png', 'pdf-to-webp'
  ];

  // 3. Map Matrix into clean dynamic crawler targets matching your slug setup
  const dynamicRoutes = formatPairs.map((pair) => ({
    url: `${baseUrl}/convert/${pair}.html`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...dynamicRoutes];
}