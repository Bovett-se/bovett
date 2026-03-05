import prettier from 'eslint-config-prettier';
import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default defineConfig(
  includeIgnoreFile(gitignorePath),
  {
    ignores: [
      'rename_colors.js',
      'test-*.cjs',
      'booli.html',
      'build/**',
      '.svelte-kit/**',
      'dist/**'
    ]
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  prettier,
  ...svelte.configs.prettier,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      // typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
      // see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
      'no-undef': 'off',

      // General JavaScript/TypeScript best practices
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-console': 'warn',
      'no-unused-vars': 'off', // Handled by TypeScript
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': ['error'],
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': ['error'],

      // Code quality and readability
      // Note: Style rules disabled - using Prettier for formatting
      // quotes: ['error', 'single'],
      // semi: ['error', 'always'],
      // indent: ['error', 2],
      // 'comma-dangle': ['error', 'never'],
      // 'object-curly-spacing': ['error', 'always'],
      // 'array-bracket-spacing': ['error', 'never'],

      // Import organization
      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
          allowSeparatedGroups: true
        }
      ]
    }
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: ts.parser,
        svelteConfig
      }
    },
    rules: {
      // Svelte-specific rules (minimal essential set)
      'svelte/valid-compile': 'error',
      'svelte/no-dom-manipulating': 'warn',
      'svelte/no-reactive-reassign': 'error',
      'svelte/no-navigation-without-resolve': 'off', // Disabled - external links don't need resolve

      // Basic formatting rules
      // 'svelte/indent': ['error', { indent: 2 }], // Disabled - using Prettier for formatting
      'svelte/html-self-closing': 'error',
      'svelte/mustache-spacing': 'error',
      'svelte/shorthand-attribute': ['error', { prefer: 'always' }]
    }
  }
);
