import './globals.css';
import type { Metadata, Viewport } from 'next';
import { PwaRegister } from '@/components/PwaRegister';

export const metadata: Metadata = {
  title: 'Snake Modern',
  description: 'Modern, Retro, Masters Build, and 3D deterministic snake with reliable leaderboard scoring',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Snake Modern'
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#09090b'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
