import Link from 'next/link';
import type { ReactElement } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { ArchitectureSection } from '@/components/landing/ArchitectureSection';
import { InfrastructureSection } from '@/components/landing/InfrastructureSection';
import { ApiOverviewSection } from '@/components/landing/ApiOverviewSection';
import { getDocsUrl } from '@/lib/docs-url';

export default function Page(): ReactElement {
  const docsUrl = getDocsUrl();

  return (
    <div className="from-background via-background to-accent/10 text-foreground min-h-screen bg-gradient-to-br">
      <Navbar />

      <HeroSection />
      <ArchitectureSection />
      <InfrastructureSection />

      <ApiOverviewSection />




      <section className="bg-primary text-primary-foreground px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display mb-8 text-4xl font-bold md:text-5xl">
            Ready to Start Trading?
          </h2>
          <p className="mb-12 text-xl opacity-90">
            Join thousands of traders who trust CryptoCFD for their cryptocurrency trading needs.
            Start with a demo account or go live in minutes.
          </p>
          <div className="flex flex-col justify-center gap-6 sm:flex-row">
            <Button
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 px-8 py-6 text-lg font-semibold"
              asChild
            >
              <Link href="/login">Open Live Account</Link>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 border-2 px-8 py-6 text-lg font-semibold"
              asChild
            >
              <a href={docsUrl} target="_blank" rel="noopener noreferrer">
                View Documentation
              </a>
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-accent/20 border-border border-t px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="font-display mb-6 text-2xl font-bold">CryptoCFD</h3>
              <p className="text-muted-foreground mb-4">
                The world&apos;s leading platform for cryptocurrency CFD trading.
              </p>
              <div className="flex space-x-4">
                <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-full">
                  <span className="text-primary-foreground text-sm">T</span>
                </div>
                <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-full">
                  <span className="text-primary-foreground text-sm">F</span>
                </div>
                <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-full">
                  <span className="text-primary-foreground text-sm">L</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-4 text-lg font-semibold">Trading</h4>
              <ul className="text-muted-foreground space-y-2">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Bitcoin CFDs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Ethereum CFDs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Altcoin CFDs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Trading Platform
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-lg font-semibold">Company</h4>
              <ul className="text-muted-foreground space-y-2">
                <li>
                  <a href="#architecture" className="hover:text-foreground transition-colors">
                    Architecture
                  </a>
                </li>
                <li>
                  <a href="#developers" className="hover:text-foreground transition-colors">
                    API Documentation
                  </a>
                </li>
                <li>
                  <a
                    href={docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    Documentation
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-lg font-semibold">Support</h4>
              <ul className="text-muted-foreground space-y-2">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Live Chat
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Trading Education
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-border mt-12 flex flex-col items-center justify-between border-t pt-8 md:flex-row">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} CryptoCFD. All rights reserved.
            </p>
            <div className="mt-4 flex space-x-6 md:mt-0">
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Risk Disclosure
              </a>
            </div>
          </div>

          <div className="bg-muted text-muted-foreground mt-8 rounded-lg p-4 text-sm">
            <p className="mb-2 font-semibold">Risk Warning:</p>
            <p>
              CFDs are complex instruments and come with a high risk of losing money rapidly due to
              leverage. 76% of retail investor accounts lose money when trading CFDs. You should
              consider whether you understand how CFDs work and whether you can afford to take the
              high risk of losing your money.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
