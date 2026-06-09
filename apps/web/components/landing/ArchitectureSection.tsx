import Image from 'next/image';
import type { ReactElement } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ArchitectureSection(): ReactElement {
  return (
    <section id="architecture" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-16">
        <div className="max-w-4xl">
          <Badge variant="outline" className="mb-4 text-xs font-semibold uppercase tracking-widest">
            Core Infrastructure
          </Badge>
          <h2 className="font-display mb-6 text-4xl font-bold tracking-tight md:text-5xl">
            Application Architecture Evolution
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            CryptoCFD is a highly responsive, institutional-grade cryptocurrency leveraged trading
            platform. Below is a full retrospective outlining our architectural migration from an
            agile, single-instance architecture (v0) to a scalable, microservices-driven,
            low-latency execution framework (v1).
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
          <Card className="border-border/50 from-card to-card/50 bg-gradient-to-br">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="bg-destructive h-3 w-3 rounded-full" />
                  <CardTitle className="text-xl font-bold">Legacy Architecture (Version 0)</CardTitle>
                </div>
                <Badge variant="destructive" className="text-xs">
                  Not Scalable
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Our initial implementation was built as a single, centralized monolithic server.
                All critical components (web framework, HTTP routing, real-time matching, order
                books, and position margins) were kept completely in memory inside a single Node.js
                thread.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-border bg-muted/30 group relative overflow-hidden rounded-xl border p-2">
                <Image
                  src="/v0-architecture.png"
                  alt="Legacy Monolithic Architecture (v0)"
                  width={800}
                  height={350}
                  className="max-h-[350px] w-full rounded-lg object-contain opacity-90 transition duration-300 group-hover:opacity-100"
                />
                <div className="from-background/80 pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t via-transparent to-transparent p-3">
                  <span className="text-muted-foreground bg-background/90 border-border rounded-md border px-3 py-1 text-xs">
                    Version 0: Monolithic Flow
                  </span>
                </div>
              </div>

              <div className="bg-muted/50 border-border/60 rounded-xl border p-4">
                <h3 className="text-muted-foreground mb-3 text-xs font-bold uppercase tracking-wider">
                  Major Version 0 Bottlenecks
                </h3>
                <ul className="text-muted-foreground space-y-2 text-sm">
                  <li>
                    <strong className="text-foreground">State Volatility:</strong> Because matching
                    state and ledger were inside server memory, restarting or crashing the process
                    resulted in 100% loss of active order books and balances.
                  </li>
                  <li>
                    <strong className="text-foreground">Unscalable Matching:</strong>{' '}
                    Single-threaded CPU execution meant complex balance calculations and limit margin
                    matches blocked the HTTP thread, resulting in high latency spikes under trade
                    spikes.
                  </li>
                  <li>
                    <strong className="text-foreground">Inefficient DB Writes:</strong> Writing every
                    raw tick directly into a traditional PostgreSQL instance created heavy write lock
                    bounds, causing massive CPU bottlenecks.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 from-card to-card/50 hover:border-primary/30 bg-gradient-to-br shadow-lg transition duration-300">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="bg-primary h-3 w-3 animate-pulse rounded-full" />
                  <CardTitle className="text-xl font-bold">
                    Distributed Architecture (Version 1)
                  </CardTitle>
                </div>
                <Badge className="text-xs">Active Production</Badge>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The active system decouples state and scaling vectors into an event-driven core. The
                Matching Engine is extracted into an independent microservice (Engine), communicated
                through ultra-high-speed Redis Streams for thread-safe asynchronous order
                dispatching.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-border bg-muted/30 group relative overflow-hidden rounded-xl border p-2">
                <Image
                  src="/v1-architecture.png"
                  alt="Active Microservices Architecture (v1)"
                  width={800}
                  height={350}
                  className="max-h-[350px] w-full rounded-lg object-contain"
                />
                <div className="from-background/80 pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t via-transparent to-transparent p-3">
                  <span className="text-foreground bg-background/90 border-border rounded-md border px-3 py-1 text-xs">
                    Version 1: Event-Driven Topology
                  </span>
                </div>
              </div>

              <div className="bg-muted/50 border-border/60 rounded-xl border p-4">
                <h3 className="text-foreground mb-3 text-xs font-bold uppercase tracking-wider">
                  Version 1 Architectural Upgrades
                </h3>
                <ul className="text-muted-foreground space-y-2 text-sm">
                  <li>
                    <strong className="text-foreground">Decoupled Trading Engine:</strong> The
                    Backend handles API requests and mounts user tokens, while the dedicated Engine
                    microservice processes limits and liquidations in isolated processes with maximum
                    safety.
                  </li>
                  <li>
                    <strong className="text-foreground">Redis Stream Broker:</strong> Redis streams
                    act as message brokers. The Backend streams order events onto{' '}
                    <code className="text-foreground bg-muted rounded px-1 text-xs">
                      stream:exness
                    </code>{' '}
                    and polls{' '}
                    <code className="text-foreground bg-muted rounded px-1 text-xs">
                      stream:exnessReceive
                    </code>
                    . This creates an asynchronous, robust thread model capable of handling
                    thousands of requests concurrently.
                  </li>
                  <li>
                    <strong className="text-foreground">TimescaleDB Integration:</strong> Rather than
                    querying simple Postgres models, high-frequency candlesticks are
                    aggregate-chunked and written directly to a TimescaleDB hypertable for optimized,
                    sub-millisecond query indices.
                  </li>
                  <li>
                    <strong className="text-foreground">Asynchronous Worker Queues:</strong>{' '}
                    Non-critical paths like SMS/Email notifications, transaction journaling, and
                    ledger snapshots are outsourced to background queue workers, eliminating API
                    thread blocking.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
