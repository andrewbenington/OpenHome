import stylistic from '@stylistic/eslint-plugin'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import parserTs from '@typescript-eslint/parser'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import reactEslint from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  prettierRecommended,
  {
    plugins: {
      '@stylistic': stylistic,
      '@stylistic/ts': stylistic,
      '@typescript-eslint': typescriptEslint,
      'react-refresh': reactRefresh,
      'react-hooks': reactHooks,
      react: reactEslint,
    },
    languageOptions: {
      parser: parserTs,
    },
    files: ['src/**/*.{js,mjs,cjs,ts,mts,jsx,tsx}'],
    rules: {
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
      eqeqeq: 'error',
      '@stylistic/ts/padding-line-between-statements': [
        'error',
        {
          blankLine: 'any',
          prev: ['const', 'let', 'var'],
          next: ['const', 'let', 'var'],
        },
        { blankLine: 'always', prev: '*', next: ['interface', 'type'] },
      ],
      '@stylistic/jsx-self-closing-comp': [
        'error',
        {
          component: true,
          html: true,
        },
      ],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react/jsx-key': 'error',
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],
    },
  },
]
