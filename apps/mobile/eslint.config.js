import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNative from 'eslint-plugin-react-native';
import stylisticJs from '@stylistic/eslint-plugin-js';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';

export default [
  js.configs.recommended,
  // Configuration for TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2023,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json'
      },
      globals: {
        __dirname: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        RequestInit: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      react,
      'react-hooks': reactHooks,
      'react-native': reactNative,
      '@stylistic/js': stylisticJs,
      'no-relative-import-paths': noRelativeImportPaths
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/jsx-indent': ['error', 2],
      'react/jsx-indent-props': ['error', 'first'],
      '@stylistic/js/quote-props': ['error', 'consistent-as-needed'],
      '@stylistic/js/jsx-quotes': ['error', 'prefer-single'],
      'linebreak-style': ['error', 'unix'],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' }
      ],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } }
      ],
      'no-relative-import-paths/no-relative-import-paths': [
        'warn',
        { allowSameFolder: false, rootDir: 'src', prefix: '~' }
      ],
      'react-native/no-unused-styles': 'warn',
      'react-native/split-platform-components': 'off',
      'react-native/no-inline-styles': 'off',
      'react-native/no-color-literals': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off'
    },
    settings: { react: { version: 'detect' } }
  },
  // Configuration for JavaScript config files
  {
    files: ['babel.config.js', 'metro.config.js', 'tailwind.config.js', 'prettier.config.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: {
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
        setInterval: 'readonly',
        setTimeout: 'readonly',
        clearInterval: 'readonly',
        clearTimeout: 'readonly'
      }
    },
    plugins: { '@stylistic/js': stylisticJs },
    rules: {
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      '@stylistic/js/quote-props': ['error', 'consistent-as-needed']
    }
  }
];
