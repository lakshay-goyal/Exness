import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import turboPlugin from 'eslint-plugin-turbo';
import tseslint from 'typescript-eslint';

/**
 * A strict shared ESLint configuration for the repository.
 * Enforces:
 * - Consistent function structure
 * - No unused variables/functions
 * - Strict type safety
 * - Code organization
 *
 * @type {import("eslint").Linter.Config[]}
 * **/
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.strictTypeChecked.map((cfg) => ({
    ...cfg,
    files: ['**/*.ts', '**/*.tsx'],
  })),
  ...tseslint.configs.stylisticTypeChecked.map((cfg) => ({
    ...cfg,
    files: ['**/*.ts', '**/*.tsx'],
  })),
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      'turbo/no-undeclared-env-vars': 'error',
    },
  },
  {
    ignores: ['dist/**', '.next/**', 'node_modules/**', 'build/**', 'out/**'],
  },
  // JavaScript/TypeScript files - Function structure and consistency
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    rules: {
      // ========== FUNCTION STRUCTURE ==========
      // Enforce consistent function style - arrow functions preferred
      'func-style': ['error', 'expression', { allowArrowFunctions: true }],
      // Arrow function body style - concise when possible
      'arrow-body-style': ['error', 'as-needed', { requireReturnForObjectLiteral: false }],
      // Prefer arrow callbacks for consistency
      'prefer-arrow-callback': ['error', { allowNamedFunctions: false, allowUnboundThis: false }],
      // Require return statements in callbacks
      'array-callback-return': ['error', { allowImplicit: false, checkForEach: false }],
      // Enforce consistent return values
      'consistent-return': 'error',
      // Require default cases in switch statements
      'default-case': 'error',
      // Enforce default parameters last
      'default-param-last': 'error',
      // Enforce dot notation where possible
      'dot-notation': 'error',
      // Require === and !==
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      // No alert, confirm, prompt
      'no-alert': 'error',
      // No caller/callee
      'no-caller': 'error',
      // No console in production code (keep for debugging)
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      // No debugger in production
      'no-debugger': 'error',
      // No duplicate imports
      'no-duplicate-imports': 'error',
      // No else return
      'no-else-return': 'error',
      // Empty functions should be explicit
      'no-empty-function': 'error',
      // No eval
      'no-eval': 'error',
      // No extending native prototypes
      'no-extend-native': 'error',
      // No fallthrough in switch
      'no-fallthrough': 'error',
      // No floating decimals
      'no-floating-decimal': 'error',
      // No implicit coercion
      'no-implicit-coercion': 'error',
      // No implied eval
      'no-implied-eval': 'error',
      // No iterator
      'no-iterator': 'error',
      // No labels
      'no-labels': 'error',
      // No lone blocks
      'no-lone-blocks': 'error',
      // No nested ternary (hard to read)
      'no-nested-ternary': 'error',
      // No new Function
      'no-new-func': 'error',
      // No new Object
      'no-new-object': 'error',
      // No new require
      'no-new-require': 'error',
      // No new wrappers
      'no-new-wrappers': 'error',
      // No octal escape
      'no-octal-escape': 'error',
      // No param reassign
      'no-param-reassign': ['error', { props: true, ignorePropertyModificationsFor: ['acc', 'ctx', 'req', 'res', 'state'] }],
      // No plus plus in for loop afterthoughts (allow for now)
      'no-plusplus': 'off',
      // No proto
      'no-proto': 'error',
      // No restricted properties
      'no-restricted-properties': 'error',
      // No return await (redundant)
      'no-return-await': 'error',
      // No script url
      'no-script-url': 'error',
      // No self compare
      'no-self-compare': 'error',
      // No sequences
      'no-sequences': 'error',
      // No unnecessary .bind()
      'no-extra-bind': 'error',
      // No unnecessary labels
      'no-extra-label': 'error',
      // No void
      'no-void': 'error',
      // No with
      'no-with': 'error',
      // Require radix for parseInt
      'radix': 'error',
      // Require await in async functions
      'require-await': 'off', // Using @typescript-eslint/require-await instead
      // Require unicode regexps
      'require-unicode-regexp': 'off',
      // Wrap iife
      'wrap-iife': ['error', 'outside'],
      // Yoda style - no yoda
      'yoda': 'error',

      // ========== VARIABLES ==========
      // No delete vars
      'no-delete-var': 'error',
      // No global assign
      'no-global-assign': 'error',
      // No shadow
      'no-shadow': 'off', // Using TypeScript version

      // ========== CODE COMPLEXITY ==========
      // Max nested callbacks
      'max-nested-callbacks': ['error', 4],
      // Max params - prefer destructuring
      'max-params': ['warn', 4],
      // No var
      'no-var': 'error',
      // Prefer const
      'prefer-const': ['error', { destructuring: 'all', ignoreReadBeforeAssign: false }],
      // Prefer spread
      'prefer-spread': 'error',
      // Prefer template literals
      'prefer-template': 'error',
      // Prefer destructuring
      'prefer-destructuring': ['error', { array: true, object: true }, { enforceForRenamedProperties: false }],

      // ========== IMPORT/EXPORT ORGANIZATION ==========
      // No duplicate exports
      'no-duplicate-imports': 'off', // Using @typescript-eslint/no-duplicate-imports
      // Sort imports
      'sort-imports': ['warn', { ignoreCase: true, ignoreDeclarationSort: true, ignoreMemberSort: false }],
    },
  },
  // TypeScript specific - Strict type safety and unused detection
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      // ========== UNUSED VARIABLES/FUNCTIONS ==========
      // Strict unused vars - catches all unused variables, functions, and classes
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      // No unused expressions
      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          allowShortCircuit: false,
          allowTernary: false,
          allowTaggedTemplates: false,
        },
      ],

      // ========== TYPE SAFETY ==========
      // No explicit any - forces proper typing
      '@typescript-eslint/no-explicit-any': 'error',
      // No unsafe assignment
      '@typescript-eslint/no-unsafe-assignment': 'error',
      // No unsafe member access
      '@typescript-eslint/no-unsafe-member-access': 'error',
      // No unsafe call
      '@typescript-eslint/no-unsafe-call': 'error',
      // No unsafe return
      '@typescript-eslint/no-unsafe-return': 'error',
      // No unsafe argument
      '@typescript-eslint/no-unsafe-argument': 'error',
      // No unsafe declaration merging
      '@typescript-eslint/no-unsafe-declaration-merging': 'error',
      // No unsafe enum comparison
      '@typescript-eslint/no-unsafe-enum-comparison': 'error',
      // No unsafe function type
      '@typescript-eslint/no-unsafe-function-type': 'error',
      // No unsafe unneeded optional chain
      '@typescript-eslint/no-unnecessary-condition': 'error',
      // No floating promises - must be handled
      '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: false, ignoreIIFE: false }],
      // No misused promises
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            arguments: true,
            attributes: true,
            properties: true,
            returns: true,
          },
          checksConditionals: true,
        },
      ],
      // Await only thenable values
      '@typescript-eslint/await-thenable': 'error',
      // Require await in async functions
      '@typescript-eslint/require-await': 'error',
      // No non-null assertions (unsafe)
      '@typescript-eslint/no-non-null-assertion': 'error',
      // No non-null assertion in optional chain
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
      // No unnecessary type arguments
      '@typescript-eslint/no-unnecessary-type-arguments': 'error',
      // No unnecessary type assertion
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      // No unnecessary type constraint
      '@typescript-eslint/no-unnecessary-type-constraint': 'error',
      // No unnecessary parameter property assignment
      '@typescript-eslint/no-unnecessary-parameter-property-assignment': 'error',
      // No unnecessary qualifier
      '@typescript-eslint/no-unnecessary-qualifier': 'error',
      // No unnecessary template expression
      '@typescript-eslint/no-unnecessary-template-expression': 'error',
      // No base to string
      '@typescript-eslint/no-base-to-string': 'error',
      // No duplicate enum values
      '@typescript-eslint/no-duplicate-enum-values': 'error',
      // No duplicate type constituents
      '@typescript-eslint/no-duplicate-type-constituents': 'error',
      // No dynamic delete
      '@typescript-eslint/no-dynamic-delete': 'error',
      // No empty object type
      '@typescript-eslint/no-empty-object-type': 'error',
      // Require explicit return types on functions
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
          allowConciseArrowFunctionExpressionsStartingWithVoid: false,
          allowFunctionsWithoutTypeParameters: false,
        },
      ],
      // Require explicit return types on module boundaries
      '@typescript-eslint/explicit-module-boundary-types': [
        'error',
        {
          allowArgumentsExplicitlyTypedAsAny: false,
          allowDirectConstAssertionInArrowFunctions: true,
          allowedNames: [],
          allowHigherOrderFunctions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      // Restrict template expressions
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowNumber: true,
          allowBoolean: true,
          allowAny: false,
          allowNullish: false,
          allowRegExp: false,
        },
      ],
      // Restrict plus operands
      '@typescript-eslint/restrict-plus-operands': [
        'error',
        {
          allowAny: false,
          allowBoolean: false,
          allowNullish: false,
          allowNumberAndString: false,
          allowRegExp: false,
          skipCompoundAssignments: false,
        },
      ],
      // Restrict addition operands
      '@typescript-eslint/restrict-plus-operands': 'error',
      // Require array sort compare
      '@typescript-eslint/require-array-sort-compare': ['error', { allowStringArrays: true }],
      // Promise function async
      '@typescript-eslint/promise-function-async': 'error',
      // Prefer ts-expect-error over ts-ignore
      '@typescript-eslint/prefer-ts-expect-error': 'error',
      // Prefer string starts-ends-with
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      // Prefer return this type
      '@typescript-eslint/prefer-return-this-type': 'error',
      // Prefer reduce type parameter
      '@typescript-eslint/prefer-reduce-type-parameter': 'error',
      // Prefer read only parameter types
      '@typescript-eslint/prefer-readonly-parameter-types': 'off', // Too strict for now
      // Prefer read only
      '@typescript-eslint/prefer-readonly': 'error',
      // Prefer promise reject errors
      '@typescript-eslint/prefer-promise-reject-errors': 'error',
      // Prefer optional chain
      '@typescript-eslint/prefer-optional-chain': 'error',
      // Prefer nullish coalescing
      '@typescript-eslint/prefer-nullish-coalescing': [
        'error',
        {
          allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false,
          ignoreConditionalTests: false,
          ignoreMixedLogicalExpressions: false,
          ignorePrimitives: { bigint: false, boolean: false, number: false, string: false },
        },
      ],
      // Prefer for of
      '@typescript-eslint/prefer-for-of': 'error',
      // Prefer find
      '@typescript-eslint/prefer-find': 'error',
      // Prefer enum initializers
      '@typescript-eslint/prefer-enum-initializers': 'error',
      // Prefer destructuring
      '@typescript-eslint/prefer-destructuring': [
        'error',
        { array: true, object: true },
        { enforceForRenamedProperties: false },
      ],
      // Prefer default type parameter
      '@typescript-eslint/prefer-default-type-parameter': 'error',
      // Prefer as const
      '@typescript-eslint/prefer-as-const': 'error',
      // Only throw error
      '@typescript-eslint/only-throw-error': 'error',
      // No use before define
      '@typescript-eslint/no-use-before-define': [
        'error',
        {
          functions: false,
          classes: true,
          variables: true,
          allowNamedExports: false,
          enums: true,
          typedefs: true,
          ignoreTypeReferences: true,
        },
      ],
      // No useless empty export
      '@typescript-eslint/no-useless-empty-export': 'error',
      // No var requires
      '@typescript-eslint/no-var-requires': 'error',
      // No this alias
      '@typescript-eslint/no-this-alias': ['error', { allowDestructuring: true }],
      // No shadow
      '@typescript-eslint/no-shadow': [
        'error',
        {
          builtinGlobals: true,
          hoist: 'all',
          allow: [],
          ignoreOnInitialization: false,
          ignoreFunctionTypeParameterNameValueShadow: false,
          ignoreTypeValueShadow: false,
        },
      ],
      // No redundant type constitutents
      '@typescript-eslint/no-redundant-type-constituents': 'error',
      // No require imports
      '@typescript-eslint/no-require-imports': 'error',
      // No unnecessary constructor
      '@typescript-eslint/no-unnecessary-constructor': 'error',
      // No array delete
      '@typescript-eslint/no-array-delete': 'error',
      // Switch exhaustiveness check
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        {
          allowDefaultCaseForExhaustiveSwitch: false,
          considerDefaultExhaustiveForUnions: false,
          requireDefaultForNonUnion: true,
        },
      ],
      // Strict boolean expressions
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false,
          allowNullableBoolean: false,
          allowNullableString: false,
          allowNullableNumber: false,
          allowNullableEnum: false,
          allowSafe: false,
          allowAny: false,
          allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false,
        },
      ],
      // Unbound method
      '@typescript-eslint/unbound-method': ['error', { ignoreStatic: false }],
      // Throw only error
      '@typescript-eslint/only-throw-error': 'error',
      // No confusing void expression
      '@typescript-eslint/no-confusing-void-expression': [
        'error',
        { ignoreArrowShorthand: false, ignoreVoidOperator: false },
      ],
      // No deprecated
      '@typescript-eslint/no-deprecated': 'warn',
      // No import type side effects
      '@typescript-eslint/no-import-type-side-effects': 'error',
      // No empty function
      '@typescript-eslint/no-empty-function': ['error', { allow: [] }],
      // No extraneous class
      '@typescript-eslint/no-extraneous-class': [
        'error',
        {
          allowConstructorOnly: false,
          allowEmpty: false,
          allowStaticOnly: false,
          allowWithDecorator: false,
        },
      ],
      // No invalid void type
      '@typescript-eslint/no-invalid-void-type': 'error',
      // No mean magic numbers
      '@typescript-eslint/no-magic-numbers': 'off', // Too strict for most codebases
      // No misuse of new
      '@typescript-eslint/no-misused-new': 'error',
      // No namespace
      '@typescript-eslint/no-namespace': ['error', { allowDeclarations: false, allowDefinitionFiles: false }],
      // No this literal
      '@typescript-eslint/no-restricted-types': [
        'error',
        {
          types: {
            object: {
              message: 'Use {} instead',
              fixWith: '{}',
            },
            Object: {
              message: 'Avoid using the `Object` type. Did you mean `object`?',
            },
            Function: {
              message: 'Avoid using the `Function` type. Prefer a specific function type.',
            },
          },
        },
      ],
      // No wrapping in non-null assertion
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
      // Consistent type assertions
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        {
          assertionStyle: 'as',
          objectLiteralTypeAssertions: 'allow',
        },
      ],
      // Consistent type definitions (prefer interface over type for objects)
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      // Consistent type exports
      '@typescript-eslint/consistent-type-exports': [
        'error',
        { fixMixedExportsWithInlineTypeSpecifier: true },
      ],
      // Consistent type imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
          disallowTypeAnnotations: true,
        },
      ],
      // Class methods use this
      'class-methods-use-this': 'off',
      '@typescript-eslint/class-methods-use-this': [
        'error',
        {
          enforceForClassFields: true,
          exceptMethods: [],
        },
      ],
      // Default param last
      'default-param-last': 'off',
      '@typescript-eslint/default-param-last': 'error',
      // Dot notation
      'dot-notation': 'off',
      '@typescript-eslint/dot-notation': 'error',
      // Init declarations
      'init-declarations': 'off',
      '@typescript-eslint/init-declarations': ['error', 'always'],
      // Max params
      'max-params': 'off',
      '@typescript-eslint/max-params': ['warn', { max: 4 }],
      // Method signature style
      '@typescript-eslint/method-signature-style': ['error', 'property'],
      // Naming convention
      '@typescript-eslint/naming-convention': [
        'error',
        // Interfaces should be PascalCase with I prefix optional
        {
          selector: 'interface',
          format: ['PascalCase'],
        },
        // Type aliases should be PascalCase
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
        // Enums should be PascalCase
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
        // Enum members should be UPPER_CASE
        {
          selector: 'enumMember',
          format: ['UPPER_CASE'],
        },
        // Functions should be camelCase
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
        // Variables should be camelCase or UPPER_CASE for constants
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'forbid',
        },
        // Parameters should be camelCase
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        // Properties should be camelCase
        {
          selector: 'property',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        // Methods should be camelCase
        {
          selector: 'method',
          format: ['camelCase'],
        },
        // Classes should be PascalCase
        {
          selector: 'class',
          format: ['PascalCase'],
        },
      ],
      // No duplicate class members
      'no-dupe-class-members': 'off',
      '@typescript-eslint/no-dupe-class-members': 'error',
      // No duplicate imports
      'no-duplicate-imports': 'off',
      '@typescript-eslint/no-duplicate-imports': 'error',
      // No empty static block
      'no-empty-static-block': 'off',
      '@typescript-eslint/no-empty-static-block': 'error',
      // No import side effects (for type imports)
      '@typescript-eslint/no-import-type-side-effects': 'error',
      // No invalid this
      'no-invalid-this': 'off',
      '@typescript-eslint/no-invalid-this': 'error',
      // No loop func
      'no-loop-func': 'off',
      '@typescript-eslint/no-loop-func': 'error',
      // No loss of precision
      'no-loss-of-precision': 'off',
      '@typescript-eslint/no-loss-of-precision': 'error',
      // No magic numbers
      'no-magic-numbers': 'off',
      // No redeclare
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': ['error', { builtinGlobals: true }],
      // No restrict imports
      '@typescript-eslint/no-restricted-imports': 'off',
      // No throw literal
      'no-throw-literal': 'off',
      '@typescript-eslint/no-throw-literal': 'error',
      // No unused private class members
      'no-unused-private-class-members': 'off',
      '@typescript-eslint/no-unused-private-class-members': 'error',
    },
  },
];
