import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { NextConfig } from 'next';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../');

const nextConfig: NextConfig = {
  // Self-contained server output: the Docker runtime ships server.js + only the
  // traced node_modules (~200 MB) instead of the whole hoisted monorepo.
  // outputFileTracingRoot points at the repo root so tracing follows the
  // workspace (@repo/*) symlinks.
  output: 'standalone',
  outputFileTracingRoot: repoRoot,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
