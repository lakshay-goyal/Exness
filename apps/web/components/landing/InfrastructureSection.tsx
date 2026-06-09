import type { ReactElement } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const deepDives = [
  {
    number: '01',
    title: 'Engine Decoupling',
    description:
      'Moving the order-matching engine to a separate microservice ensures the Backend is entirely stateless. The API gateway can horizontally auto-scale behind standard routing loads, keeping the platform immune to HTTP floods.',
  },
  {
    number: '02',
    title: 'TimescaleDB Hypertable',
    description:
      'Market candles require specialized time-series indexes. TimescaleDB hypertables handle automatic data partitioning on temporal indexes, allowing the platform to store and query millions of candles at negligible cost.',
  },
  {
    number: '03',
    title: 'State Snapshotting',
    description:
      'For maximum safety against reboots, the Engine creates hourly encrypted snapshots of active user balances and order inventories. Upon cold restart, the Engine re-loads the latest snapshot, bringing recovery time under 500 milliseconds.',
  },
] as const;

export function InfrastructureSection(): ReactElement {
  return (
    <section
      id="infrastructure"
      className="from-accent/5 to-background bg-gradient-to-b px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="font-display mb-6 text-4xl font-bold tracking-tight md:text-5xl">
            Platform Infrastructure
          </h2>
          <p className="text-muted-foreground mx-auto max-w-3xl text-lg leading-relaxed">
            Deep-dive into the technical foundations that power CryptoCFD&apos;s low-latency,
            production-grade trading experience.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {deepDives.map((item) => (
            <Card
              key={item.number}
              className="border-border/50 hover:border-primary/20 from-card to-card/50 bg-gradient-to-br transition-all duration-300 hover:shadow-xl"
            >
              <CardHeader>
                <div className="bg-primary/10 border-primary/20 text-primary mb-4 flex h-10 w-10 items-center justify-center rounded-lg border text-lg font-bold">
                  {item.number}
                </div>
                <CardTitle className="text-lg font-bold">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
