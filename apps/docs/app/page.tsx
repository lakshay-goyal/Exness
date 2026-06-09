'use client';

import React from 'react';
import { ApiReferenceReact } from '@scalar/api-reference-react';
import { openapiSpec } from './openapiSpec';
import '@scalar/api-reference-react/style.css';

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500/30 selection:text-amber-200">
      {/* Upper Brand Bar */}
      <div className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center font-black text-slate-950 text-lg">E</div>
            <div>
              <span className="text-lg font-bold tracking-wider text-white">EXNESS</span>
              <span className="ml-2 text-xs font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">DOCS</span>
            </div>
          </div>
          <a
            href={process.env.NEXT_PUBLIC_FRONTEND_URL ?? 'http://localhost:3001'}
            className="text-sm text-slate-400 hover:text-white transition-colors border border-slate-800 hover:border-slate-600 rounded-lg px-4 py-2"
          >
            ← Back to CryptoCFD
          </a>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-6 py-12 space-y-20">
        {/* Architecture Section */}
        <div className="space-y-16">
          {/* Header */}
          <div className="max-w-4xl">
            <span className="text-amber-500 text-xs font-bold uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">Core Infrastructure</span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Application Architecture Evolution
            </h1>
            <p className="mt-4 text-lg text-slate-400 leading-relaxed">
              Exness is a highly responsive, institutional-grade cryptocurrency leveraged trading platform. 
              Below is a full retrospective outlining our architectural migration from an agile, single-instance architecture (v0) 
              to a scalable, microservices-driven, low-latency execution framework (v1).
            </p>
          </div>

          {/* Architecture Evolution Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Version 0 Box */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6 space-y-6 hover:border-slate-800 transition duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 rounded-full bg-rose-500"></span>
                  <h2 className="text-xl font-bold text-white">Legacy Architecture (Version 0)</h2>
                </div>
                <span className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-0.5 rounded-full font-semibold">Not Scalable</span>
              </div>
              
              <p className="text-sm text-slate-400">
                Our initial implementation was built as a single, centralized monolithic server. 
                All critical components (web framework, HTTP routing, real-time matching, order books, and position margins) 
                were kept completely <strong>in memory</strong> inside a single Node.js thread.
              </p>

              {/* Render the legacy image */}
              <div className="overflow-hidden rounded-xl border border-slate-900 bg-slate-950 p-2 relative group cursor-zoom-in">
                <img 
                  src="/v0-architecture.png" 
                  alt="Legacy Monolithic Architecture (v0)" 
                  className="w-full object-contain rounded-lg max-h-[350px] opacity-80 group-hover:opacity-100 transition duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end justify-center p-3">
                  <span className="text-xs text-slate-400 bg-slate-900/90 px-3 py-1 rounded-md border border-slate-800">Version 0: Monolithic Flow</span>
                </div>
              </div>

              <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-900/60">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Major Version 0 Bottlenecks:</h3>
                <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4">
                  <li><strong className="text-rose-400">State Volatility:</strong> Because matching state and ledger were inside server memory, restarting or crashing the process resulted in 100% loss of active order books and balances.</li>
                  <li><strong className="text-rose-400">Unscalable Matching:</strong> Single-threaded CPU execution meant complex balance calculations and limit margin matches blocked the HTTP thread, resulting in high latency spikes under trade spikes.</li>
                  <li><strong className="text-rose-400">Inefficient DB Writes:</strong> Writing every raw tick directly into a traditional PostgreSQL instance created heavy write lock bounds, causing massive CPU bottlenecks.</li>
                </ul>
              </div>
            </div>

            {/* Version 1 Box */}
            <div className="rounded-2xl border border-amber-500/20 bg-slate-900/60 p-6 space-y-6 hover:border-amber-500/30 transition duration-300 shadow-xl shadow-amber-500/2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h2 className="text-xl font-bold text-white">Distributed Architecture (Version 1)</h2>
                </div>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-0.5 rounded-full font-semibold">Active Production</span>
              </div>

              <p className="text-sm text-slate-400">
                The active system decouples state and scaling vectors into an event-driven core. 
                The **Matching Engine** is extracted into an independent microservice (**Engine**), communicated through 
                ultra-high-speed **Redis Streams** for thread-safe asynchronous order dispatching.
              </p>

              {/* Render the newer image */}
              <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-2 relative group cursor-zoom-in">
                <img 
                  src="/v1-architecture.png" 
                  alt="Active Microservices Architecture (v1)" 
                  className="w-full object-contain rounded-lg max-h-[350px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end justify-center p-3">
                  <span className="text-xs text-amber-400 bg-slate-900/90 px-3 py-1 rounded-md border border-slate-800/80">Version 1: Event-Driven Topology</span>
                </div>
              </div>

              <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/60">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-semibold text-amber-500">Version 1 Architectural Upgrades:</h3>
                <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4">
                  <li><strong className="text-amber-400/90">Decoupled Trading Engine:</strong> The Backend handles API requests and mounts user tokens, while the dedicated Engine microservice processes limits and liquidations in isolated processes with maximum safety.</li>
                  <li><strong className="text-amber-400/90">Redis Stream Broker:</strong> Redis streams act as message brokers. The Backend streams order events onto `stream:exness` and polls `stream:exnessReceive`. This creates an asynchronous, robust thread model capable of handling thousands of requests concurrently.</li>
                  <li><strong className="text-amber-400/90">TimescaleDB Integration:</strong> Rather than querying simple Postgres models, high-frequency candlesticks are aggregate-chunked and written directly to a TimescaleDB hypertable for optimized, sub-millisecond query indices.</li>
                  <li><strong className="text-amber-400/90">Asynchronous Worker Queues:</strong> Non-critical paths like SMS/Email notifications, transaction journaling, and ledger snapshots are outsourced to background queue workers, eliminating API thread blocking.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Deep-Dive Technical Sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900/30 p-6 rounded-xl border border-slate-900">
              <div className="h-10 w-10 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20 text-amber-500 text-lg font-bold mb-4">01</div>
            <h3 className="text-lg font-bold text-white">Engine Decoupling</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Moving the order-matching engine to a separate microservice ensures the Backend is entirely stateless. 
                The API gateway can horizontally auto-scale behind standard routing loads, keeping the platform immune to HTTP floods.
            </p>
          </div>

          <div className="bg-slate-900/30 p-6 rounded-xl border border-slate-900">
            <div className="h-10 w-10 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20 text-amber-500 text-lg font-bold mb-4">02</div>
            <h3 className="text-lg font-bold text-white">TimescaleDB Hypertable</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Market candles require specialized time-series indexes. TimescaleDB hypertables handle automatic 
              data partitioning on temporal indexes, allowing the platform to store and query millions of candles at negligible cost.
            </p>
          </div>

          <div className="bg-slate-900/30 p-6 rounded-xl border border-slate-900">
            <div className="h-10 w-10 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20 text-amber-500 text-lg font-bold mb-4">03</div>
            <h3 className="text-lg font-bold text-white">State Snapshotting</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              For maximum safety against reboots, the Engine creates hourly encrypted snapshots of active user balances and order inventories. 
              Upon cold restart, the Engine re-loads the latest snapshot, bringing recovery time under 500 milliseconds.
            </p>
          </div>
        </div>
        </div>

        {/* API Explorer Section */}
        <div className="space-y-8">
          <div>
            <span className="text-amber-500 text-xs font-bold uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 font-mono">API Reference</span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white">Interactive API Explorer</h1>
            <p className="mt-2 text-slate-400 max-w-3xl">
              Explore, test, and integrate with the Exness backend services directly from our interactive documentation. Powered by Scalar.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-900 bg-slate-950 overflow-hidden shadow-2xl">
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

      {/* Footer */}
      <footer className="border-t border-slate-900 mt-20 bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-amber-500 flex items-center justify-center font-bold text-slate-950 text-sm">E</div>
            <p className="text-xs text-slate-500">
              &copy; {new Date().getFullYear()} Exness Trading Platform. All rights reserved. Registered virtual asset platform.
            </p>
          </div>
          <div className="flex space-x-6 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-300 transition">Terms of Service</a>
            <a href="#" className="hover:text-slate-300 transition">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition">System Status</a>
          </div>
        </div>
      </footer>
    </main>
  );
}