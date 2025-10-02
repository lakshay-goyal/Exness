import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Page(){
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 text-foreground font-bricolage">
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border/50 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold tracking-tight">CryptoCFD</h1>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
                <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">How it Works</a>
                <a href="#markets" className="text-sm font-medium hover:text-primary transition-colors">Markets</a>
                <a href="#security" className="text-sm font-medium hover:text-primary transition-colors">Security</a>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/login">Get Started</Link>
              </Button>
            </div>

            <div className="md:hidden">
              <Button 
                variant="ghost" 
                size="sm"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </div>
          </div>
        </div>

      </nav>

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-fade-in">
            <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-[0.9] tracking-tight">
              Trade Crypto CFDs with
              <span className="block bg-gradient-to-r from-foreground via-primary to-muted-foreground bg-clip-text text-transparent mt-2">
                Precision & Power
              </span>
            </h1>
          </div>
          <div className="animate-slide-up">
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed font-medium">
              Access the world's largest cryptocurrency markets through CFDs. Trade on price differences 
              without owning the underlying assets. Leverage up to 1:100 with institutional-grade execution.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-scale-in">
            <Button size="lg" className="px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" asChild>
              <Link href="/login">Start Trading Now</Link>
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-6 text-lg font-semibold border-2 hover:bg-accent/50 transition-all duration-300">
              Watch Demo
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-12 border-t border-border/50">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">$2.4B+</div>
              <div className="text-muted-foreground font-medium mt-2">Daily Volume</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">50K+</div>
              <div className="text-muted-foreground font-medium mt-2">Active Traders</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">100+</div>
              <div className="text-muted-foreground font-medium mt-2">Crypto Pairs</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">0.01s</div>
              <div className="text-muted-foreground font-medium mt-2">Execution Speed</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-accent/5 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-8 tracking-tight">Advanced Trading Features</h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto font-medium leading-relaxed">
              Professional-grade tools and features designed for serious crypto traders
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-2xl transition-all duration-500 border-border/50 hover:border-primary/20 bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <CardTitle className="text-2xl font-bold">High Leverage</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Trade with up to 1:100 leverage on major cryptocurrencies. Amplify your positions while managing risk with our advanced tools.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 border-border/50 hover:border-primary/20 bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl font-bold">Instant Execution</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Lightning-fast order execution with sub-millisecond latency. Never miss a trading opportunity in volatile markets.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 border-border/50 hover:border-primary/20 bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl font-bold">Advanced Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Comprehensive market analysis, real-time charts, and AI-powered insights to make informed trading decisions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 border-border/50 hover:border-primary/20 bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl font-bold">Risk Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Sophisticated risk management tools including stop-loss, take-profit, and position sizing calculators.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 border-border/50 hover:border-primary/20 bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <CardTitle className="text-2xl font-bold">No Hidden Fees</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Transparent pricing with competitive spreads. No hidden fees, no surprises. What you see is what you pay.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 border-border/50 hover:border-primary/20 bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75c0-5.385-4.365-9.75-9.75-9.75z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl font-bold">24/7 Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Round-the-clock customer support from trading experts. Get help when you need it, markets never sleep.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">How CFD Trading Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Simple steps to start trading cryptocurrency CFDs and profit from market movements
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 items-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-2xl font-semibold mb-4">Choose Your Asset</h3>
              <p className="text-muted-foreground">
                Select from 100+ cryptocurrency pairs including Bitcoin, Ethereum, and emerging altcoins.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-2xl font-semibold mb-4">Predict Direction</h3>
              <p className="text-muted-foreground">
                Go long if you think the price will rise, or go short if you expect it to fall. No need to own the crypto.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-2xl font-semibold mb-4">Profit from Difference</h3>
              <p className="text-muted-foreground">
                Your profit or loss is determined by the difference between opening and closing prices.
              </p>
            </div>
          </div>

          <div className="mt-16 p-8 bg-accent/20 rounded-2xl border border-border">
            <h3 className="text-2xl font-bold mb-4 text-center">CFD vs Direct Crypto Purchase</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-3 text-foreground">CFD Trading</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• No need to own the underlying crypto</li>
                  <li>• Trade with leverage up to 1:100</li>
                  <li>• Profit from both rising and falling markets</li>
                  <li>• No wallet management required</li>
                  <li>• Regulated and secure trading environment</li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-3 text-foreground">Direct Purchase</h4>
                <ul className="space-y-2 text-muted-foreground">
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

      <section id="markets" className="py-20 px-4 sm:px-6 lg:px-8 bg-accent/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Available Markets</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Trade the most popular cryptocurrencies with competitive spreads and deep liquidity
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Bitcoin', symbol: 'BTC', price: '$43,250', change: '+2.45%', positive: true },
              { name: 'Ethereum', symbol: 'ETH', price: '$2,680', change: '+1.82%', positive: true },
              { name: 'Cardano', symbol: 'ADA', price: '$0.48', change: '-0.95%', positive: false },
              { name: 'Solana', symbol: 'SOL', price: '$98.50', change: '+4.21%', positive: true },
              { name: 'Polkadot', symbol: 'DOT', price: '$7.85', change: '+1.55%', positive: true },
              { name: 'Chainlink', symbol: 'LINK', price: '$15.40', change: '-2.10%', positive: false },
              { name: 'Litecoin', symbol: 'LTC', price: '$72.30', change: '+0.75%', positive: true },
              { name: 'Avalanche', symbol: 'AVAX', price: '$38.90', change: '+3.15%', positive: true },
            ].map((crypto, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/20 bg-gradient-to-br from-card to-card/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <CardTitle className="text-lg font-bold">{crypto.name}</CardTitle>
                      <CardDescription className="text-sm">{crypto.symbol}</CardDescription>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <span className="text-sm font-bold text-primary">{crypto.symbol.charAt(0)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{crypto.price}</div>
                    <Badge variant={crypto.positive ? "default" : "destructive"} className="mt-1">
                      {crypto.change}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <Link href="/login">View All Markets</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="security" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8">Bank-Grade Security</h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Your funds and data are protected by military-grade encryption and multi-layer security protocols. 
                We're regulated by top-tier financial authorities worldwide.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mt-1">
                    <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">256-bit SSL Encryption</h3>
                    <p className="text-muted-foreground">All data transmission is encrypted using the same technology banks use.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mt-1">
                    <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Segregated Accounts</h3>
                    <p className="text-muted-foreground">Client funds are kept separate from company funds in tier-1 banks.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mt-1">
                    <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Regulatory Compliance</h3>
                    <p className="text-muted-foreground">Licensed and regulated by FCA, CySEC, and ASIC.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-accent/20 to-accent/5 p-8 rounded-2xl border border-border">
              <div className="text-center">
                <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4">$100M Insurance Coverage</h3>
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

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Ready to Start Trading?
          </h2>
          <p className="text-xl mb-12 opacity-90">
            Join thousands of traders who trust CryptoCFD for their cryptocurrency trading needs. 
            Start with a demo account or go live in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button size="lg" className="px-8 py-6 text-lg font-semibold bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
              <Link href="/login">Open Live Account</Link>
            </Button>
            <Button variant="ghost" size="lg" className="px-8 py-6 text-lg font-semibold border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
              Try Demo Account
            </Button>
          </div>
        </div>
      </section>

      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-accent/20 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-6">CryptoCFD</h3>
              <p className="text-muted-foreground mb-4">
                The world's leading platform for cryptocurrency CFD trading.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-sm">T</span>
                </div>
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-sm">F</span>
                </div>
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-sm">L</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Trading</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Bitcoin CFDs</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Ethereum CFDs</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Altcoin CFDs</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Trading Platform</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Regulation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Live Chat</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Trading Education</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © 2024 CryptoCFD. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Terms of Service</a>
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Risk Disclosure</a>
            </div>
          </div>

          <div className="mt-8 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
            <p className="font-semibold mb-2">Risk Warning:</p>
            <p>
              CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. 
              76% of retail investor accounts lose money when trading CFDs. You should consider whether you 
              understand how CFDs work and whether you can afford to take the high risk of losing your money.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};