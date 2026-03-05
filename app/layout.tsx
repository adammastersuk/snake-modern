import './globals.css';
import type { Metadata } from 'next';
import { Inter, Press_Start_2P } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const retro = Press_Start_2P({ subsets: ['latin'], variable: '--font-retro', weight: '400' });

export const metadata: Metadata = {
  title: 'Snake Modern',
  description: 'Modern + Retro deterministic snake with replay system'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${retro.variable}`}>{children}</body>
    </html>
  );
}
