import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Snake Modern',
  description: 'Modern + Retro deterministic snake with replay system'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
