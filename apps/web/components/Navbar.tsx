'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wallet } from 'lucide-react';

interface NavbarProps {
  showNavLinks?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ showNavLinks = true }) => {
  const { balance, balanceLoading, fetchBalance, isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getUserDisplayName = () => {
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || Number.isNaN(value)) return '--';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <nav className="bg-background/90 border-border/50 fixed top-0 z-50 w-full border-b backdrop-blur-md transition-all duration-300">
      <div
        className={`mx-auto px-4 ${showNavLinks ? 'max-w-7xl sm:px-6 lg:px-8' : 'w-full sm:px-5'}`}
      >
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold tracking-tight sm:text-2xl">
              CryptoCFD
            </Link>
          </div>

          {showNavLinks && (
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a
                  href="#features"
                  className="hover:text-primary text-sm font-medium transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="hover:text-primary text-sm font-medium transition-colors"
                >
                  How it Works
                </a>
                <a
                  href="#markets"
                  className="hover:text-primary text-sm font-medium transition-colors"
                >
                  Markets
                </a>
                <a
                  href="#security"
                  className="hover:text-primary text-sm font-medium transition-colors"
                >
                  Security
                </a>
              </div>
            </div>
          )}

          <div className="hidden min-w-0 items-center gap-2 md:flex">
            {isAuthenticated ? (
              <>
                <div className="bg-background flex min-w-0 items-center overflow-hidden rounded-md border text-sm">
                  <div className="flex min-w-0 items-center gap-2 px-3 py-1.5">
                    <Wallet className="text-muted-foreground size-4 shrink-0" />
                    <span className="text-muted-foreground hidden lg:inline">Balance</span>
                    <span className="max-w-[9rem] truncate font-mono font-medium xl:max-w-[14rem]">
                      {balanceLoading ? 'Loading...' : formatCurrency(balance)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={fetchBalance}
                    disabled={balanceLoading}
                    size="icon"
                    className="size-8 rounded-none border-l"
                    aria-label="Refresh balance"
                  >
                    <RefreshCw className={`size-4 ${balanceLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <Button size="sm">Deposit</Button>
                <div className="bg-border mx-1 hidden h-6 w-px xl:block" />
                <span className="text-foreground hidden max-w-[11rem] truncate text-sm font-medium xl:inline">
                  {getUserDisplayName()}
                </span>
                <Button variant="outline" onClick={logout} size="sm">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/login">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-border border-t py-4 md:hidden">
            {showNavLinks && (
              <div className="mb-4 flex flex-col space-y-4">
                <a
                  href="#features"
                  className="hover:text-primary text-sm font-medium transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="hover:text-primary text-sm font-medium transition-colors"
                >
                  How it Works
                </a>
                <a
                  href="#markets"
                  className="hover:text-primary text-sm font-medium transition-colors"
                >
                  Markets
                </a>
                <a
                  href="#security"
                  className="hover:text-primary text-sm font-medium transition-colors"
                >
                  Security
                </a>
              </div>
            )}
            <div className="flex flex-col space-y-3">
              {isAuthenticated ? (
                <>
                  <div className="bg-background rounded-lg border p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2 text-sm">
                        <Wallet className="text-muted-foreground size-4" />
                        <span className="text-muted-foreground">Balance</span>
                        <span className="text-foreground truncate font-mono font-medium">
                          {balanceLoading ? 'Loading...' : formatCurrency(balance)}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchBalance}
                        disabled={balanceLoading}
                      >
                        <RefreshCw className={`size-4 ${balanceLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                    <Button className="w-full" size="sm">
                      Deposit
                    </Button>
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Welcome,{' '}
                    <span className="text-foreground font-medium">{getUserDisplayName()}</span>
                  </div>
                  <Button variant="outline" onClick={logout} className="w-full">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild className="w-full">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/login">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
