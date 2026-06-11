'use client';

import type { ReactElement } from 'react';
import Image from 'next/image';
import { ApiReferenceReact } from '@scalar/api-reference-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { openapiSpec } from '@/lib/openapi-spec';
import '@scalar/api-reference-react/style.css';

// Shown only to unauthenticated visitors: the full system architecture plus
// the interactive OpenAPI reference for every API exposed in the environment.
export function ApiReferenceSection(): ReactElement | null {
  const { isAuthenticated, loading } = useAuth();

  if (loading || isAuthenticated) {
    return null;
  }

  return (
    <section id="api-reference" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-16">
        <div className="space-y-8">
          <div className="max-w-3xl">
            <Badge
              variant="outline"
              className="mb-4 text-xs font-semibold uppercase tracking-widest"
            >
              System Architecture
            </Badge>
            <h2 className="font-display mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              How the Platform Fits Together
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Live market data streams from Binance, orders flow through the Backend API into the
              in-memory Engine via Redis streams, and dedicated services persist state to
              PostgreSQL and MongoDB.
            </p>
          </div>

          <div className="border-border bg-muted/30 overflow-hidden rounded-xl border p-2">
            <Image
              src="/ExnessArchitecture.png"
              alt="Exness system architecture"
              width={1600}
              height={900}
              className="w-full rounded-lg object-contain"
            />
          </div>
        </div>

        <div className="space-y-8">
          <div className="max-w-3xl">
            <Badge
              variant="outline"
              className="mb-4 font-mono text-xs font-semibold uppercase tracking-widest"
            >
              API Reference
            </Badge>
            <h2 className="font-display mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              Interactive API Explorer
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Every API exposed in this environment — explore, test, and integrate directly from
              the landing page. Powered by Scalar.
            </p>
          </div>

          <div className="border-border overflow-hidden rounded-2xl border shadow-2xl">
            <ApiReferenceReact
              configuration={{
                spec: {
                  content: openapiSpec as any,
                },
                theme: 'deepSpace',
                darkMode: true,
                forceDarkModeState: 'dark',
                showSidebar: true,
                hideDarkModeToggle: true,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
