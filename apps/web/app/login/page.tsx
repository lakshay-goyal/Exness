'use client';

import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { GuestRoute } from '@/components/GuestRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { backendRequestHeaders, getBackendUrl } from '@/lib/backend-api';

function LoginBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="from-background via-background to-accent/10 absolute inset-0 bg-gradient-to-br" />
      <div className="login-bg-shimmer bg-[radial-gradient(circle_at_50%_50%,var(--foreground)_0%,transparent_70%)] absolute inset-0 opacity-[0.03]" />
      <div className="login-bg-orb bg-primary/8 absolute -left-24 top-1/4 h-72 w-72 rounded-full blur-3xl" />
      <div className="login-bg-orb-delayed bg-foreground/5 absolute -right-20 bottom-1/4 h-80 w-80 rounded-full blur-3xl" />
      <div className="login-bg-orb bg-accent/40 absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]" />
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
    </div>
  );
}

function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="from-background via-background to-accent/10 text-foreground relative min-h-screen overflow-hidden bg-gradient-to-br">
      <LoginBackground />
      <Navbar showNavLinks={false} />
      <div className="relative flex min-h-screen items-center justify-center px-4 py-24">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    try {
      await axios.post(
        `${getBackendUrl()}/api/v1/auth/login`,
        { email },
        { headers: backendRequestHeaders },
      );
      setIsSubmitted(true);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <GuestRoute>
        <LoginShell>
          <div className="border-border/50 bg-card/80 animate-in fade-in zoom-in-95 relative rounded-2xl border p-8 shadow-2xl backdrop-blur-md duration-500">
            <div className="text-center">
              <div className="bg-primary mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full shadow-lg">
                <Mail className="text-primary-foreground h-7 w-7" />
              </div>
              <h1 className="font-display mb-3 text-3xl font-bold tracking-tight">
                Check Your Email
              </h1>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                We sent a sign-in link to{' '}
                <span className="text-foreground font-medium">{email}</span>. Click the link to
                access your trading account.
              </p>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                  }}
                >
                  Use Different Email
                </Button>
                <Button className="w-full" asChild>
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </div>
          </div>
        </LoginShell>
      </GuestRoute>
    );
  }

  return (
    <GuestRoute>
      <LoginShell>
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>
          <h1 className="font-display mb-3 text-4xl font-bold tracking-tight md:text-5xl">
            Welcome Back
          </h1>
          <p className="text-muted-foreground text-lg">
            Sign in with your email to continue trading
          </p>
        </div>

        <div className="border-border/50 bg-card/80 animate-in fade-in slide-in-from-bottom-4 relative rounded-2xl border p-8 shadow-2xl backdrop-blur-md duration-700">
          <div className="from-primary/5 pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r via-transparent to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 px-4 text-base"
                placeholder="you@example.com"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={!email || isLoading}
              className="h-12 w-full text-base font-semibold shadow-lg transition-all duration-300 hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Sending link...
                </>
              ) : (
                'Continue with Email'
              )}
            </Button>
          </form>
        </div>
      </LoginShell>
    </GuestRoute>
  );
};

export default Login;
