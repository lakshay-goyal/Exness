import Link from 'next/link';
import type { ReactElement } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';

export default function Page(): ReactElement {
  return (
    <div className="from-background via-background to-accent/10 text-foreground font-bricolage min-h-screen bg-gradient-to-br">
      <Navbar />

      <section className="overflow-hidden px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <div className="animate-fade-in">
            <h1 className="mb-8 text-6xl font-bold leading-[0.9] tracking-tight md:text-8xl">
              Trade Crypto CFDs with
              <span className="from-foreground via-primary to-muted-foreground mt-2 block bg-gradient-to-r bg-clip-text text-transparent">
                Precision & Power
              </span>
            </h1>
          </div>
          <div className="animate-slide-up">
            <p className="text-muted-foreground mx-auto mb-12 max-w-4xl text-xl font-medium leading-relaxed md:text-2xl">
              Access the world's largest cryptocurrency markets through CFDs. Trade on price
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
            >
              Watch Demo
            </Button>
          </div>

          <div className="border-border/50 mt-20 grid grid-cols-2 gap-8 border-t pt-12 md:grid-cols-4">
            <div className="text-center">
              <div className="from-primary to-foreground bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
                $2.4B+
              </div>
              <div className="text-muted-foreground mt-2 font-medium">Daily Volume</div>
            </div>
            <div className="text-center">
              <div className="from-primary to-foreground bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
                50K+
              </div>
              <div className="text-muted-foreground mt-2 font-medium">Active Traders</div>
            </div>
            <div className="text-center">
              <div className="from-primary to-foreground bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
                100+
              </div>
              <div className="text-muted-foreground mt-2 font-medium">Crypto Pairs</div>
            </div>
            <div className="text-center">
              <div className="from-primary to-foreground bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
                0.01s
              </div>
              <div className="text-muted-foreground mt-2 font-medium">Execution Speed</div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="from-accent/5 to-background bg-gradient-to-b px-4 py-24 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 text-center">
            <h2 className="mb-8 text-5xl font-bold tracking-tight md:text-6xl">
              Advanced Trading Features
            </h2>
            <p className="text-muted-foreground mx-auto max-w-4xl text-xl font-medium leading-relaxed">
              Professional-grade tools and features designed for serious crypto traders
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-border/50 hover:border-primary/20 from-card to-card/50 group bg-gradient-to-br transition-all duration-500 hover:shadow-2xl">
              <CardHeader>
                <div className="from-primary to-primary/60 mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br transition-transform duration-300 group-hover:scale-110">
                  <svg
                    className="text-primary-foreground h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <CardTitle className="text-2xl font-bold">High Leverage</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Trade with up to 1:100 leverage on major cryptocurrencies. Amplify your positions
                  while managing risk with our advanced tools.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/20 from-card to-card/50 group bg-gradient-to-br transition-all duration-500 hover:shadow-2xl">
              <CardHeader>
                <div className="from-primary to-primary/60 mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br transition-transform duration-300 group-hover:scale-110">
                  <svg
                    className="text-primary-foreground h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <CardTitle className="text-2xl font-bold">Instant Execution</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Lightning-fast order execution with sub-millisecond latency. Never miss a trading
                  opportunity in volatile markets.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/20 from-card to-card/50 group bg-gradient-to-br transition-all duration-500 hover:shadow-2xl">
              <CardHeader>
                <div className="from-primary to-primary/60 mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br transition-transform duration-300 group-hover:scale-110">
                  <svg
                    className="text-primary-foreground h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <CardTitle className="text-2xl font-bold">Advanced Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Comprehensive market analysis, real-time charts, and AI-powered insights to make
                  informed trading decisions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/20 from-card to-card/50 group bg-gradient-to-br transition-all duration-500 hover:shadow-2xl">
              <CardHeader>
                <div className="from-primary to-primary/60 mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br transition-transform duration-300 group-hover:scale-110">
                  <svg
                    className="text-primary-foreground h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <CardTitle className="text-2xl font-bold">Risk Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Sophisticated risk management tools including stop-loss, take-profit, and position
                  sizing calculators.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/20 from-card to-card/50 group bg-gradient-to-br transition-all duration-500 hover:shadow-2xl">
              <CardHeader>
                <div className="from-primary to-primary/60 mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br transition-transform duration-300 group-hover:scale-110">
                  <svg
                    className="text-primary-foreground h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <CardTitle className="text-2xl font-bold">No Hidden Fees</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Transparent pricing with competitive spreads. No hidden fees, no surprises. What
                  you see is what you pay.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/20 from-card to-card/50 group bg-gradient-to-br transition-all duration-500 hover:shadow-2xl">
              <CardHeader>
                <div className="from-primary to-primary/60 mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br transition-transform duration-300 group-hover:scale-110">
                  <svg
                    className="text-primary-foreground h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75c0-5.385-4.365-9.75-9.75-9.75z"
                    />
                  </svg>
                </div>
                <CardTitle className="text-2xl font-bold">24/7 Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Round-the-clock customer support from trading experts. Get help when you need it,
                  markets never sleep.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-4xl font-bold md:text-5xl">How CFD Trading Works</h2>
            <p className="text-muted-foreground mx-auto max-w-3xl text-xl">
              Simple steps to start trading cryptocurrency CFDs and profit from market movements
            </p>
          </div>

          <div className="grid items-center gap-12 md:grid-cols-3">
            <div className="text-center">
              <div className="bg-primary text-primary-foreground mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold">
                1
              </div>
              <h3 className="mb-4 text-2xl font-semibold">Choose Your Asset</h3>
              <p className="text-muted-foreground">
                Select from 100+ cryptocurrency pairs including Bitcoin, Ethereum, and emerging
                altcoins.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary text-primary-foreground mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold">
                2
              </div>
              <h3 className="mb-4 text-2xl font-semibold">Predict Direction</h3>
              <p className="text-muted-foreground">
                Go long if you think the price will rise, or go short if you expect it to fall. No
                need to own the crypto.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary text-primary-foreground mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold">
                3
              </div>
              <h3 className="mb-4 text-2xl font-semibold">Profit from Difference</h3>
              <p className="text-muted-foreground">
                Your profit or loss is determined by the difference between opening and closing
                prices.
              </p>
            </div>
          </div>

          <div className="bg-accent/20 border-border mt-16 rounded-2xl border p-8">
            <h3 className="mb-4 text-center text-2xl font-bold">CFD vs Direct Crypto Purchase</h3>
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h4 className="text-foreground mb-3 text-lg font-semibold">CFD Trading</h4>
                <ul className="text-muted-foreground space-y-2">
                  <li>• No need to own the underlying crypto</li>
                  <li>• Trade with leverage up to 1:100</li>
                  <li>• Profit from both rising and falling markets</li>
                  <li>• No wallet management required</li>
                  <li>• Regulated and secure trading environment</li>
                </ul>
              </div>
              <div>
                <h4 className="text-foreground mb-3 text-lg font-semibold">Direct Purchase</h4>
                <ul className="text-muted-foreground space-y-2">
                  <li>• You own the actual cryptocurrency</li>
                  <li>• No leverage available</li>
                  <li>• Only profit when prices rise</li>
                  <li>• Requires secure wallet management</li>
                  <li>• Subject to exchange security risks</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="markets" className="bg-accent/20 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-4xl font-bold md:text-5xl">Available Markets</h2>
            <p className="text-muted-foreground mx-auto max-w-3xl text-xl">
              Trade the most popular cryptocurrencies with competitive spreads and deep liquidity
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: 'Bitcoin',
                symbol: 'BTC',
                price: '$43,250',
                change: '+2.45%',
                positive: true,
              },
              {
                name: 'Ethereum',
                symbol: 'ETH',
                price: '$2,680',
                change: '+1.82%',
                positive: true,
              },
              {
                name: 'Cardano',
                symbol: 'ADA',
                price: '$0.48',
                change: '-0.95%',
                positive: false,
              },
              {
                name: 'Solana',
                symbol: 'SOL',
                price: '$98.50',
                change: '+4.21%',
                positive: true,
              },
              {
                name: 'Polkadot',
                symbol: 'DOT',
                price: '$7.85',
                change: '+1.55%',
                positive: true,
              },
              {
                name: 'Chainlink',
                symbol: 'LINK',
                price: '$15.40',
                change: '-2.10%',
                positive: false,
              },
              {
                name: 'Litecoin',
                symbol: 'LTC',
                price: '$72.30',
                change: '+0.75%',
                positive: true,
              },
              {
                name: 'Avalanche',
                symbol: 'AVAX',
                price: '$38.90',
                change: '+3.15%',
                positive: true,
              },
            ].map((crypto, index) => (
              <Card
                key={index}
                className="border-border/50 hover:border-primary/20 from-card to-card/50 group bg-gradient-to-br transition-all duration-300 hover:shadow-xl"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold">{crypto.name}</CardTitle>
                      <CardDescription className="text-sm">{crypto.symbol}</CardDescription>
                    </div>
                    <div className="from-primary/10 to-primary/5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br transition-transform duration-300 group-hover:scale-110">
                      <span className="text-primary text-sm font-bold">
                        {crypto.symbol.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{crypto.price}</div>
                    <Badge variant={crypto.positive ? 'default' : 'destructive'} className="mt-1">
                      {crypto.change}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" asChild>
              <Link href="/login">View All Markets</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="security" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <h2 className="mb-8 text-4xl font-bold md:text-5xl">Bank-Grade Security</h2>
              <p className="text-muted-foreground mb-8 text-xl leading-relaxed">
                Your funds and data are protected by military-grade encryption and multi-layer
                security protocols. We're regulated by top-tier financial authorities worldwide.
              </p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary mt-1 flex h-6 w-6 items-center justify-center rounded-full">
                    <svg
                      className="text-primary-foreground h-3 w-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">256-bit SSL Encryption</h3>
                    <p className="text-muted-foreground">
                      All data transmission is encrypted using the same technology banks use.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-primary mt-1 flex h-6 w-6 items-center justify-center rounded-full">
                    <svg
                      className="text-primary-foreground h-3 w-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Segregated Accounts</h3>
                    <p className="text-muted-foreground">
                      Client funds are kept separate from company funds in tier-1 banks.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-primary mt-1 flex h-6 w-6 items-center justify-center rounded-full">
                    <svg
                      className="text-primary-foreground h-3 w-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Regulatory Compliance</h3>
                    <p className="text-muted-foreground">
                      Licensed and regulated by FCA, CySEC, and ASIC.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="from-accent/20 to-accent/5 border-border rounded-2xl border bg-gradient-to-br p-8">
              <div className="text-center">
                <div className="bg-primary mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full">
                  <svg
                    className="text-primary-foreground h-12 w-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="mb-4 text-2xl font-bold">$100M Insurance Coverage</h3>
                <p className="text-muted-foreground mb-6">
                  All client funds are insured up to $100M through Lloyd's of London.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-semibold">99.9%</div>
                    <div className="text-muted-foreground">Uptime</div>
                  </div>
                  <div>
                    <div className="font-semibold">0.01s</div>
                    <div className="text-muted-foreground">Latency</div>
                  </div>
                  <div>
                    <div className="font-semibold">24/7</div>
                    <div className="text-muted-foreground">Monitoring</div>
                  </div>
                  <div>
                    <div className="font-semibold">SOC 2</div>
                    <div className="text-muted-foreground">Certified</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-8 text-4xl font-bold md:text-5xl">Ready to Start Trading?</h2>
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
            >
              Try Demo Account
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-accent/20 border-border border-t px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-6 text-2xl font-bold">CryptoCFD</h3>
              <p className="text-muted-foreground mb-4">
                The world's leading platform for cryptocurrency CFD trading.
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
                  <a href="#" className="hover:text-foreground transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Regulation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Security
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Careers
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
            <p className="text-muted-foreground text-sm">© 2024 CryptoCFD. All rights reserved.</p>
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
