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
    default: "FlowClicker - The Ultimate Crypto Clicker Game",
    template: `%s | FlowClicker`,
  },
  description: "Click to earn $FLOW tokens in the most exciting crypto clicker game on the web. Compete with players worldwide, claim your tokens on the blockchain, and become a crypto tycoon.",
  keywords: ["crypto", "clicker", "game", "blockchain", "token", "earn", "play-to-earn", "FlowClicker", "Sonic", "Mainnet"],
  openGraph: {
    title: "FlowClicker - The Ultimate Crypto Clicker Game",
    description: "Click, earn, and claim your crypto fortune!",
    url: "https://flow-clicker.vercel.app/",
    siteName: "FlowClicker",
    images: [
      {
        url: "/og-image.png", // Make sure to create this image
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlowClicker - The Ultimate Crypto Clicker Game",
    description: "Join the clicker revolution! Earn real $FLOW tokens on the Sonic Mainnet.",
    images: ["/og-image.png"], // Make sure to create this image
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
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