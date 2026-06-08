'use client';

import type { ReactElement } from 'react';
import { Button } from '@repo/ui/components/button';
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Separator } from '@repo/ui/components/separator';

export default function LandingPage(): ReactElement {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Navbar */}
      <header className="bg-background/70 sticky top-0 z-50 flex items-center justify-between border-b px-8 py-4 backdrop-blur-md">
        <h1 className="text-2xl font-bold">BetterAuth</h1>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <a href="#features" className="hover:text-primary transition-colors">
            Features
          </a>
          <a href="#pricing" className="hover:text-primary transition-colors">
            Pricing
          </a>
          <a href="#contact" className="hover:text-primary transition-colors">
            Contact
          </a>
        </nav>
        <Button>No user added yet</Button>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-8 py-24 text-center">
        <h2 className="mb-6 text-4xl font-extrabold leading-tight md:text-6xl">
          Simplify Authentication for Your Apps
        </h2>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          BetterAuth makes login simple, secure, and scalable. Integrate passwordless and OAuth
          effortlessly.
        </p>
        <div className="flex gap-3">
          <Button size="lg">Start for Free</Button>
          <Button size="lg" variant="outline">
            View Docs
          </Button>
        </div>
      </section>

      <Separator className="my-8" />

      {/* Features Section */}
      <section
        id="features"
        className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-8 py-16 md:grid-cols-3"
      >
        {[
          {
            title: 'Passwordless Login',
            desc: 'Let users log in with just their email — no password required.',
          },
          {
            title: 'OAuth Integration',
            desc: 'Connect Google, GitHub, and more in a few clicks.',
          },
          {
            title: 'Secure Tokens',
            desc: 'JWT-based authentication ensures end-to-end security.',
          },
        ].map((feature) => (
          <Card key={feature.title} className="border shadow-sm">
            <CardHeader>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">{feature.desc}</CardContent>
          </Card>
        ))}
      </section>

      <Separator className="my-8" />

      {/* CTA Section */}
      <section id="contact" className="bg-muted/30 px-8 py-20 text-center">
        <h3 className="mb-4 text-3xl font-bold">Stay Updated</h3>
        <p className="text-muted-foreground mb-6">Join our newsletter to get the latest updates.</p>
        <form className="mx-auto flex max-w-md flex-col items-center justify-center gap-3 sm:flex-row">
          <Input placeholder="Enter your email" type="email" />
          <Button type="submit">Subscribe</Button>
        </form>
      </section>

      {/* Footer */}
      <footer className="text-muted-foreground border-t py-6 text-center text-sm">
        © {new Date().getFullYear()} BetterAuth. All rights reserved.
      </footer>
    </main>
  );
}
