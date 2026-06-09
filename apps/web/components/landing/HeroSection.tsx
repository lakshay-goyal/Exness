import Link from 'next/link';
import type { ReactElement } from 'react';
import { Button } from '@/components/ui/button';

export function HeroSection(): ReactElement {
  return (
    <section className="overflow-hidden px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl text-center">
        <div className="animate-fade-in">
          <h1 className="font-display mb-8 text-6xl font-bold leading-[0.9] tracking-tight md:text-8xl">
            Trade Crypto CFDs with
            <span className="from-foreground via-primary to-muted-foreground mt-2 block bg-gradient-to-r bg-clip-text text-transparent">
              Precision & Power
            </span>
          </h1>
        </div>
        <div className="animate-slide-up">
          <p className="text-muted-foreground mx-auto mb-12 max-w-4xl text-xl font-medium leading-relaxed md:text-2xl">
            Access the world&apos;s largest cryptocurrency markets through CFDs. Trade on price
            differences without owning the underlying assets. Leverage up to 1:100 with
            institutional-grade execution.
          </p>
        </div>
        <div className="animate-scale-in flex flex-col items-center justify-center gap-6 sm:flex-row">
          <Button
            size="lg"
            className="transform px-8 py-6 text-lg font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
            asChild
          >
            <Link href="/login">Start Trading Now</Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="hover:bg-accent/50 border-2 px-8 py-6 text-lg font-semibold transition-all duration-300"
            asChild
          >
            <a href="#architecture">Watch Demo</a>
          </Button>
        </div>

        <div className="border-border/50 mt-20 grid grid-cols-2 gap-8 border-t pt-12 md:grid-cols-4">
          <div className="text-center">
            <div className="font-display from-primary to-foreground bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              $2.4B+
            </div>
            <div className="text-muted-foreground mt-2 font-medium">Daily Volume</div>
          </div>
          <div className="text-center">
            <div className="font-display from-primary to-foreground bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              50K+
            </div>
            <div className="text-muted-foreground mt-2 font-medium">Active Traders</div>
          </div>
          <div className="text-center">
            <div className="font-display from-primary to-foreground bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              100+
            </div>
            <div className="text-muted-foreground mt-2 font-medium">Crypto Pairs</div>
          </div>
          <div className="text-center">
            <div className="font-display from-primary to-foreground bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              0.01s
            </div>
            <div className="text-muted-foreground mt-2 font-medium">Execution Speed</div>
          </div>
        </div>
      </div>
    </section>
  );
}
