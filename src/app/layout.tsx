import type { Metadata } from 'next';
import { Geist, Geist_Mono, Permanent_Marker } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const permanentMarker = Permanent_Marker({
  variable: '--font-permanent-marker',
  subsets: ['latin'],
  weight: '400',
});

export const metadata: Metadata = {
  title: 'CREVASSE — Sui Token Safety',
  description: 'Know if you can sell before you buy. Real on-chain live sell-testing on Sui.',
  keywords: ['Sui', 'Token Safety', 'Honeypot Checker', 'Sell-test', 'Move', 'Blockchain', 'Sui Ecosystem', 'Lofi the Yeti'],
  authors: [{ name: 'Crevasse Team' }],
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'CREVASSE — Sui Token Safety',
    description: 'Know if you can sell before you buy. Real on-chain live sell-testing on Sui.',
    url: 'https://crevasse.sui',
    siteName: 'Crevasse',
    images: [
      {
        url: '/icon.svg',
        width: 512,
        height: 512,
        alt: 'Crevasse Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CREVASSE — Sui Token Safety',
    description: 'Know if you can sell before you buy. Real on-chain live sell-testing on Sui.',
    images: ['/icon.svg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${permanentMarker.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-abyss text-whiteout bg-noise">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
