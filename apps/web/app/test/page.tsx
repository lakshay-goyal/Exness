"use client";

import { Button } from "@repo/ui/components/button";
import { Card, CardHeader, CardTitle, CardContent } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Separator } from "@repo/ui/components/separator";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Navbar */}
      <header className="flex items-center justify-between px-8 py-4 border-b bg-background/70 backdrop-blur-md sticky top-0 z-50">
        <h1 className="text-2xl font-bold">BetterAuth</h1>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
          <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
        </nav>
        <Button>No user added yet</Button>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-24 px-8">
        <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
          Simplify Authentication for Your Apps
        </h2>
        <p className="max-w-2xl text-muted-foreground mb-8">
          BetterAuth makes login simple, secure, and scalable. Integrate passwordless and OAuth effortlessly.
        </p>
        <div className="flex gap-3">
          <Button size="lg">Start for Free</Button>
          <Button size="lg" variant="outline">View Docs</Button>
        </div>
      </section>

      <Separator className="my-8" />

      {/* Features Section */}
      <section id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8 py-16 max-w-6xl mx-auto">
        {[
          {
            title: "Passwordless Login",
            desc: "Let users log in with just their email — no password required.",
          },
          {
            title: "OAuth Integration",
            desc: "Connect Google, GitHub, and more in a few clicks.",
          },
          {
            title: "Secure Tokens",
            desc: "JWT-based authentication ensures end-to-end security.",
          },
        ].map((feature) => (
          <Card key={feature.title} className="shadow-sm border">
            <CardHeader>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              {feature.desc}
            </CardContent>
          </Card>
        ))}
      </section>

      <Separator className="my-8" />

      {/* CTA Section */}
      <section id="contact" className="text-center py-20 px-8 bg-muted/30">
        <h3 className="text-3xl font-bold mb-4">Stay Updated</h3>
        <p className="text-muted-foreground mb-6">
          Join our newsletter to get the latest updates.
        </p>
        <form className="flex flex-col sm:flex-row justify-center items-center gap-3 max-w-md mx-auto">
          <Input placeholder="Enter your email" type="email" />
          <Button type="submit">Subscribe</Button>
        </form>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} BetterAuth. All rights reserved.
      </footer>
    </main>
  );
}
