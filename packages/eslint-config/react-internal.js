import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginReact from 'eslint-plugin-react';
import globals from 'globals';
import { config as baseConfig } from './base.js';

/**
 * A strict ESLint configuration for React libraries.
 * Enforces consistent component structure and function patterns.
 *
 * @type {import("eslint").Linter.Config[]} */
export const config = [
  ...baseConfig,
  pluginReact.configs.flat.recommended,
  {
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
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
      // Enforce consistent usage of destructuring assignment of props, state, and context
      'react/prefer-read-only-props': 'off',
      // Enforce props alphabetical sorting (optional, helps with organization)
      'react/jsx-sort-props': [
        'off',
        {
          callbacksLast: true,
          shorthandFirst: true,
          noSortAlphabetically: false,
          reservedFirst: true,
        },
      ],
      // Enforce default props on functional components
      'react/require-default-props': 'off', // Using TypeScript instead
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
      // Prevent direct mutation of this.state
      'react/no-direct-mutation-state': 'error',
      // Prevent usage of findDOMNode
      'react/no-find-dom-node': 'error',
      // Prevent usage of isMounted
      'react/no-is-mounted': 'error',
      // Prevent multiple component definitions per file
      'react/no-multi-comp': ['error', { ignoreStateless: false }],
      // Prevent usage of shouldComponentUpdate when extending React.PureComponent
      'react/no-redundant-should-component-update': 'error',
      // Prevent usage of setState in componentWillUpdate
      'react/no-will-update-set-state': 'error',
      // Enforce ES5 or ES6 class for returning value in render
      'react/require-render-return': 'error',
      // Enforce stateless React Components to be written as a pure function
      'react/prefer-stateless-function': ['error', { ignorePureComponents: true }],
      // Prevent unused prop type definitions
      'react/no-unused-prop-types': 'error',
      // Enforce consistent usage of fragment shorthand
      'react/jsx-fragments': ['error', 'syntax'],
      // Enforce event handler naming conventions
      'react/jsx-handler-names': [
        'warn',
        {
          eventHandlerPrefix: 'handle',
          eventHandlerPropPrefix: 'on',
          checkLocalVariables: true,
          checkInlineFunction: true,
        },
      ],
      // No .bind() in JSX props
      'react/jsx-no-bind': [
        'error',
        {
          ignoreDOMComponents: false,
          ignoreRefs: false,
          allowArrowFunctions: true,
          allowFunctions: false,
          allowBind: false,
        },
      ],
      // Prevent duplicate props in JSX
      'react/jsx-no-duplicate-props': ['error', { ignoreCase: true }],
      // Prevent usage of unwrapped JSX strings
      'react/jsx-no-literals': 'off',
      // Prevent usage of unsafe target='_blank'
      'react/jsx-no-target-blank': 'error',
      // Disallow undeclared variables in JSX
      'react/jsx-no-undef': 'error',
      // One expression per line in JSX
      'react/jsx-one-expression-per-line': 'off',
      // Enforce PascalCase for user-defined JSX components
      'react/jsx-pascal-case': ['error', { allowAllCaps: true, ignore: [] }],
      // Enforce props indentation
      'react/jsx-props-no-multi-spaces': 'error',
      // Prevent missing parentheses around multiline JSX
      'react/jsx-wrap-multilines': [
        'error',
        {
          declaration: 'parens-new-line',
          assignment: 'parens-new-line',
          return: 'parens-new-line',
          arrow: 'parens-new-line',
          condition: 'parens-new-line',
          logical: 'parens-new-line',
          prop: 'parens-new-line',
        },
      ],
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
