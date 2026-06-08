"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Navbar } from "@/components/Navbar";
import { GuestRoute } from "@/components/GuestRoute";
import { backendRequestHeaders, getBackendUrl } from "@/lib/backend-api";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${getBackendUrl()}/api/v1/auth/login`,
        {
          email: email,
        },
        {
          headers: backendRequestHeaders,
        },
      );
      setIsSubmitted(true);
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <GuestRoute>
        <div className="bg-background min-h-screen">
          <Navbar showNavLinks={false} />
          <div className="flex min-h-screen items-center justify-center px-4 pt-16">
            <div className="w-full max-w-md">
              <div className="text-center">
                <div className="bg-primary mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
                  <svg
                    className="text-primary-foreground h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h1 className="mb-4 text-3xl font-bold">Check Your Email</h1>
                <p className="text-muted-foreground mb-8">
                  We've sent a trading account setup link to{" "}
                  <strong>{email}</strong>. Click the link in the email to
                  complete your registration and start trading.
                </p>
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail("");
                    }}
                    className="border-border hover:bg-accent w-full rounded-lg border px-6 py-3 font-medium transition-colors"
                  >
                    Use Different Email
                  </button>
                  <Link
                    href="/"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 block w-full rounded-lg px-6 py-3 text-center font-medium transition-colors"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GuestRoute>
    );
  }

  return (
    <GuestRoute>
      <div className="bg-background min-h-screen">
        <Navbar showNavLinks={false} />

        <div className="flex min-h-screen items-center justify-center px-4 pt-16">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <h1 className="mb-4 text-4xl font-bold">Start Trading Today</h1>
              <p className="text-muted-foreground text-xl">
                Enter your email to get started with crypto CFD trading
              </p>
            </div>

            <div className="bg-card border-border rounded-2xl border p-8 shadow-lg">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background border-input focus:ring-ring w-full rounded-lg border px-4 py-3 transition-colors focus:border-transparent focus:outline-none focus:ring-2"
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={!email || isLoading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center rounded-lg px-6 py-3 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="-ml-1 mr-3 h-5 w-5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    "Get Started"
                  )}
                </button>
              </form>

              <div className="border-border mt-6 border-t pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4 text-sm">
                    By continuing, you agree to our Terms of Service and Privacy
                    Policy
                  </p>
                  <div className="text-muted-foreground flex items-center justify-center space-x-4 text-xs">
                    <span>✓ No hidden fees</span>
                    <span>✓ Bank-grade security</span>
                    <span>✓ 24/7 support</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 space-y-4">
              <h3 className="mb-6 text-center text-lg font-semibold">
                Why Choose CryptoCFD?
              </h3>

              <div className="grid gap-4">
                <div className="bg-accent/20 border-border flex items-start space-x-3 rounded-lg border p-4">
                  <div className="bg-primary mt-0.5 flex h-6 w-6 items-center justify-center rounded-full">
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
                    <h4 className="font-semibold">High Leverage Trading</h4>
                    <p className="text-muted-foreground text-sm">
                      Trade with up to 1:100 leverage on major cryptocurrencies
                    </p>
                  </div>
                </div>

                <div className="bg-accent/20 border-border flex items-start space-x-3 rounded-lg border p-4">
                  <div className="bg-primary mt-0.5 flex h-6 w-6 items-center justify-center rounded-full">
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
                    <h4 className="font-semibold">Instant Execution</h4>
                    <p className="text-muted-foreground text-sm">
                      Lightning-fast order execution with 0.01s latency
                    </p>
                  </div>
                </div>

                <div className="bg-accent/20 border-border flex items-start space-x-3 rounded-lg border p-4">
                  <div className="bg-primary mt-0.5 flex h-6 w-6 items-center justify-center rounded-full">
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
                    <h4 className="font-semibold">Regulated & Secure</h4>
                    <p className="text-muted-foreground text-sm">
                      FCA, CySEC regulated with $100M insurance coverage
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted mt-8 rounded-lg p-4">
              <p className="text-muted-foreground text-xs">
                <strong>Risk Warning:</strong> CFDs are complex instruments and
                come with a high risk of losing money rapidly due to leverage.
                76% of retail investor accounts lose money when trading CFDs.
                You should consider whether you understand how CFDs work and
                whether you can afford to take the high risk of losing your
                money.
              </p>
            </div>
          </div>
        </div>
      </div>
    </GuestRoute>
  );
};

export default Login;
