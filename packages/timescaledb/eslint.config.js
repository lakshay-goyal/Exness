import { config as baseConfig } from '@repo/eslint-config/base';

/**
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  ...baseConfig,
  {
    rules: {
      // pg library returns any types, disable strict type checking for this package
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/init-declarations': 'off',
      '@typescript-eslint/array-type': 'off',
      'prefer-destructuring': 'off',
    },
  },
];
