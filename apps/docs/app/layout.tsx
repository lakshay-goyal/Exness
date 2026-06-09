import '@repo/ui/globals.css';
import './globals.css';
import type { Metadata } from 'next';
import type { ReactElement, ReactNode } from 'react';
import { Geist } from 'next/font/google';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Exness Platform Docs',
  description: 'Technical Architecture & Interactive API Explorer for the Exness Trading Core.',
};

export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <html lang="en">
      <body className={geist.className}>{children}</body>
    </html>
  );
}
