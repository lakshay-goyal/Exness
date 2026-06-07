import type { ReactElement } from "react";

const SERVICES = [
  "Backend API",
  "Engine",
  "Price Poller",
  "WebSocket Server",
  "DB Storage",
  "Batch Upload",
  "Snapshotting",
];

const PACKAGES = [
  "@repo/trading-core",
  "@repo/types",
  "@repo/api-client",
  "@repo/config",
  "@repo/db",
  "@repo/timescaledb",
  "@repo/ui",
];

export default function Page(): ReactElement {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-8 py-12">
      <section>
        <p className="text-sm font-semibold uppercase text-muted-foreground">
          Turboramper docs
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Trading platform architecture
        </h1>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground">
          Source map for the Turboramper services, shared packages, and data
          flow. The runtime behavior remains split across focused workers and
          package-owned types.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-5">
          <h2 className="text-lg font-semibold">Apps</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {SERVICES.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border p-5">
          <h2 className="text-lg font-semibold">Packages</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {PACKAGES.map((pkg) => (
              <li key={pkg}>
                <code>{pkg}</code>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
