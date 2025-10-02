"use client";

import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/login`, {
        email: email
      });
      console.log('Login successful:', response.data);
      // Assuming response.data contains a token field
      login(response.data.token);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4">Check Your Email</h1>
            <p className="text-muted-foreground mb-8">
              We've sent a trading account setup link to <strong>{email}</strong>. 
              Click the link in the email to complete your registration and start trading.
            </p>
            <div className="space-y-4">
              <button 
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
                className="w-full px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
              >
                Use Different Email
              </button>
              <Link 
                href="/"
                className="block w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium text-center hover:bg-primary/90 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold">
              CryptoCFD
            </Link>
            <Link 
              href="/" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Start Trading Today</h1>
            <p className="text-xl text-muted-foreground">
              Enter your email to get started with crypto CFD trading
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!email || isLoading}
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  'Get Started'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
                <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
                  <span>✓ No hidden fees</span>
                  <span>✓ Bank-grade security</span>
                  <span>✓ 24/7 support</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 space-y-4">
            <h3 className="text-lg font-semibold text-center mb-6">Why Choose CryptoCFD?</h3>
            
            <div className="grid gap-4">
              <div className="flex items-start space-x-3 p-4 bg-accent/20 rounded-lg border border-border">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold">High Leverage Trading</h4>
                  <p className="text-sm text-muted-foreground">Trade with up to 1:100 leverage on major cryptocurrencies</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-accent/20 rounded-lg border border-border">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold">Instant Execution</h4>
                  <p className="text-sm text-muted-foreground">Lightning-fast order execution with 0.01s latency</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-accent/20 rounded-lg border border-border">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold">Regulated & Secure</h4>
                  <p className="text-sm text-muted-foreground">FCA, CySEC regulated with $100M insurance coverage</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Risk Warning:</strong> CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. 
              76% of retail investor accounts lose money when trading CFDs. You should consider whether you understand how CFDs work 
              and whether you can afford to take the high risk of losing your money.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;