import type { ReactElement } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const apiCategories = [
  {
    title: 'Authentication',
    count: '7 endpoints',
    description: 'Login, email verification, mobile session tokens, and PIN management.',
    endpoints: ['POST /auth/login', 'GET /auth/verify', 'POST /auth/mobile/pin'],
  },
  {
    title: 'Market Data',
    count: '5 endpoints',
    description: 'Supported assets, live prices, candlestick data, and aggregate refresh.',
    endpoints: ['GET /supportedAssets', 'GET /candles'],
  },
  {
    title: 'User Profile',
    count: '1 endpoint',
    description: 'Authenticated balance retrieval for trading dashboard.',
    endpoints: ['GET /balance'],
  },
  {
    title: 'Trading Operations',
    count: '6 operations',
    description: 'Create, open, close orders and closed order history.',
    endpoints: ['POST /trade/create', 'GET /trade/open', 'POST /trade/close'],
  },
] as const;

export function ApiOverviewSection(): ReactElement {
  return (
    <section id="developers" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="max-w-3xl">
          <Badge variant="outline" className="mb-4 font-mono text-xs font-semibold uppercase tracking-widest">
            API Reference
          </Badge>
          <h2 className="font-display mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            Developer API Reference
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Explore, test, and integrate with CryptoCFD backend services. Our full interactive API
            explorer with live endpoint testing is available on the documentation site.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {apiCategories.map((category) => (
            <Card
              key={category.title}
              className="border-border/50 hover:border-primary/20 from-card to-card/50 bg-gradient-to-br transition-all duration-300 hover:shadow-lg"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg font-bold">{category.title}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {category.count}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {category.description}
                </p>
                <div className="space-y-1">
                  {category.endpoints.map((endpoint) => (
                    <code
                      key={endpoint}
                      className="text-muted-foreground bg-muted block rounded px-2 py-1 font-mono text-xs"
                    >
                      {endpoint}
                    </code>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" className="px-8 py-6 text-lg font-semibold" asChild>
            <a href="#api-reference">Explore Full API Documentation</a>
          </Button>
          <Button variant="outline" size="lg" className="border-2 px-8 py-6 text-lg font-semibold" asChild>
            <a href="#architecture">View Architecture Details</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
