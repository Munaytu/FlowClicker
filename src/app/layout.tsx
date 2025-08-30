import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL("https://flow-clicker.vercel.app/"),
  title: {
    default: "FlowClicker - The Addictive Crypto Clicker Game",
    template: "%s | FlowClicker",
  },
  description:
    "Join FlowClicker, the simple and addictive crypto clicker game. Click to earn tokens, compete on a global scale, and claim your rewards.",
  keywords: [
    "FlowClicker",
    "crypto game",
    "clicker game",
    "blockchain game",
    "earn crypto",
    "play to earn",
  ],
  openGraph: {
    title: "FlowClicker - The Addictive Crypto Clicker Game",
    description:
      "Click to earn tokens, compete on a global scale, and claim your rewards in FlowClicker.",
    url: "https://flow-clicker.vercel.app/",
    siteName: "FlowClicker",
    images: [
      {
        url: "/og-image.png", // Must be an absolute URL
        width: 1200,
        height: 630,
        alt: "FlowClicker Game",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlowClicker - The Addictive Crypto Clicker Game",
    description:
      "Click to earn tokens, compete on a global scale, and claim your rewards in FlowClicker.",
    images: ["/og-image.png"], // Must be an absolute URL
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-body antialiased`}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
