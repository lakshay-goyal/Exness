import { config as reactConfig } from '@repo/eslint-config/react-internal';

/** @type {import("eslint").Linter.Config[]} */
export default [
  // Ignore native mobile export folders
  {
    ignores: [
      'ios/**',
      'android/**',
      'board/**',
      '.expo/**',
      'web-build/**',
      'expo-env.d.ts',
      '.kotlin/**',
    ],
  },
  ...reactConfig,
];
