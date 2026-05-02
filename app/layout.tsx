import type { Metadata, Viewport } from 'next';
import { Nunito, Lora, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import './styles/cozy-room.css';
import BottomNav from '@/components/BottomNav';
import PeriodBody from '@/components/PeriodBody';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  weight: ['400', '500', '600', '700'],
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  weight: ['400', '600'],
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'Psych Hub',
  description: 'Your personal psychology learning and reflection space',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Psych Hub',
  },
  icons: {
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#7A9A6E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${nunito.variable} ${lora.variable} ${cormorant.variable}`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="font-sans bg-cream min-h-screen mode-night">
        <PeriodBody>
          <main className="max-w-lg mx-auto pb-24">
            {children}
          </main>
          <BottomNav />
        </PeriodBody>
      </body>
    </html>
  );
}
