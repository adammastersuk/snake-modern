import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Snake Modern',
    short_name: 'Snake',
    description: 'Premium themed deterministic snake with replay sharing.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#09090b',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
    ]
  };
}
