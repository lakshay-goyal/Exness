import { config as baseConfig } from './packages/eslint-config/base.js';

/** @type {import("eslint").Linter.Config[]} */
export default [
  // Global ignores - consolidated from all .gitignore files in the codebase
  {
    ignores: [
      // Dependencies
      '**/node_modules/**',
      '**/.pnp/**',
      '**/.pnp.js',

      // Build outputs
      '**/dist/**',
      '**/.next/**',
      '**/build/**',
      '**/out/**',
      '**/.swc/**',
      '**/.turbo/**',
      '**/*.tsbuildinfo',

      // Mobile/Expo native exports (iOS, Android, Board folders)
      '**/ios/**',
      '**/android/**',
      '**/board/**',
      '**/.expo/**',
      '**/web-build/**',
      '**/expo-env.d.ts',
      '**/.kotlin/**',
      '**/.metro-health-check*',

      // Native mobile files
      '**/*.orig.*',
      '**/*.jks',
      '**/*.p8',
      '**/*.p12',
      '**/*.key',
      '**/*.mobileprovision',

      // Generated files
      '**/.vercel/**',
      '**/*.pem',
      '**/.env*',
      '**/.env.*.local',

      // Logs
      '**/*.log*',
      '**/npm-debug.log*',
      '**/yarn-debug.log*',
      '**/yarn-error.log*',

      // Coverage
      '**/coverage/**',
      '**/*.lcov',

      // Cache
      '**/.eslintcache',
      '**/.cache',

      // IDE
      '**/.idea/**',
      '**/.cursor/**',
      '**/.DS_Store',

      // Misc
      '**/app-example/**',
      '**/*.tgz',

      // Prisma generated
      '**/generated/prisma/**',

      // Snap-shotting output
      '**/out/**',
      '**/*.tgz',
    ],
  },
  ...baseConfig,
];
