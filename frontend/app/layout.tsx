import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Voice AI Agent - Industry-Agnostic AI Solutions',
  description: 'Transform your business with intelligent voice AI agents. Lead qualification, appointment booking, and 24/7 customer support across any industry.',
  keywords: 'voice AI, AI agent, appointment booking, lead qualification, customer support, automation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
