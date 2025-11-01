"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  showNavLinks?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ showNavLinks = true }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getUserDisplayName = () => {
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border/50 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold tracking-tight">
              CryptoCFD
            </Link>
          </div>
          
          {showNavLinks && (
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
                  Features
                </a>
                <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
                  How it Works
                </a>
                <a href="#markets" className="text-sm font-medium hover:text-primary transition-colors">
                  Markets
                </a>
                <a href="#security" className="text-sm font-medium hover:text-primary transition-colors">
                  Security
                </a>
              </div>
            </div>
          )}

          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-muted-foreground">
                    Welcome,
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {getUserDisplayName()}
                  </span>
                </div>
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
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            {showNavLinks && (
              <div className="flex flex-col space-y-4 mb-4">
                <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
                  Features
                </a>
                <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
                  How it Works
                </a>
                <a href="#markets" className="text-sm font-medium hover:text-primary transition-colors">
                  Markets
                </a>
                <a href="#security" className="text-sm font-medium hover:text-primary transition-colors">
                  Security
                </a>
              </div>
            )}
            <div className="flex flex-col space-y-3">
              {isAuthenticated ? (
                <>
                  <div className="text-sm text-muted-foreground">
                    Welcome, <span className="font-medium text-foreground">{getUserDisplayName()}</span>
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

