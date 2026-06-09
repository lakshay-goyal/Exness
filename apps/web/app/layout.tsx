// import "@repo/ui/styles.css";
import './globals.css';
import type { Metadata } from 'next';
import type { ReactElement, ReactNode } from 'react';
import { Bricolage_Grotesque, Geist } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'CryptoCFD — Trade Crypto CFDs with Precision & Power',
  description:
    'Institutional-grade crypto CFD trading platform with event-driven architecture and real-time execution.',
};

export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${bricolage.variable} ${geist.className}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
