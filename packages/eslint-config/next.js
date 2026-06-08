import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginReact from 'eslint-plugin-react';
import globals from 'globals';
import pluginNext from '@next/eslint-plugin-next';
import { config as baseConfig } from './base.js';

/**
 * A strict ESLint configuration for Next.js applications.
 * Enforces consistent component structure and Next.js best practices.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const nextJsConfig = [
  ...baseConfig,
  {
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.serviceworker,
      },
    },
  },
  {
    plugins: {
      '@next/next': pluginNext,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs['core-web-vitals'].rules,
      // Next.js specific strict rules
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-img-element': 'warn',
      '@next/next/no-sync-scripts': 'error',
      '@next/next/no-unwanted-polyfillio': 'error',
      '@next/next/google-font-display': 'error',
      '@next/next/no-before-interactive-script-outside-document': 'error',
      '@next/next/no-css-tags': 'error',
      '@next/next/no-head-element': 'error',
      '@next/next/no-page-custom-font': 'error',
      '@next/next/no-styled-jsx-in-document': 'error',
      '@next/next/no-typos': 'error',
      '@next/next/inline-script-id': 'error',
    },
  },
  {
    plugins: {
      'react-hooks': pluginReactHooks,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      // React scope no longer necessary with new JSX transform.
      'react/react-in-jsx-scope': 'off',
      // Enforce function components as arrow functions for consistency
      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'arrow-function',
          unnamedComponents: 'arrow-function',
        },
      ],
      // No unused prop types
      'react/no-unused-prop-types': 'error',
      // No unused state
      'react/no-unused-state': 'error',
      // Prefer destructuring assignments
      'react/destructuring-assignment': ['error', 'always'],
      // Prevent missing displayName in a React component definition
      'react/display-name': 'error',
      // Prevent using button without type attribute
      'react/button-has-type': 'error',
      // Prevent passing of children as props
      'react/no-children-prop': 'error',
      // Prevent problem with children and props.dangerouslySetInnerHTML
      'react/no-danger-with-children': 'error',
      // Prevent usage of deprecated methods
      'react/no-deprecated': 'error',
      // Prevent multiple component definitions per file
      'react/no-multi-comp': ['error', { ignoreStateless: false }],
      // Prevent unused prop type definitions
      'react/no-unused-prop-types': 'error',
      // Enforce consistent usage of fragment shorthand
      'react/jsx-fragments': ['error', 'syntax'],
      // Prevent duplicate props in JSX
      'react/jsx-no-duplicate-props': ['error', { ignoreCase: true }],
      // Disallow undeclared variables in JSX
      'react/jsx-no-undef': 'error',
      // Enforce PascalCase for user-defined JSX components
      'react/jsx-pascal-case': ['error', { allowAllCaps: true, ignore: [] }],
      // Enforce props indentation
      'react/jsx-props-no-multi-spaces': 'error',
      // No useless fragments
      'react/jsx-no-useless-fragment': ['error', { allowExpressions: true }],
      // Enforce self-closing style
      'react/self-closing-comp': [
        'error',
        {
          component: true,
          html: true,
        },
      ],
      // Enforce style prop value being an object
      'react/style-prop-object': 'error',
      // Void DOM elements should not have children
      'react/void-dom-elements-no-children': 'error',
      // React hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
];
