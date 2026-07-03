import stylistic from '@stylistic/eslint-plugin'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import parserTs from '@typescript-eslint/parser'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import reactEslint from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unusedImports from 'eslint-plugin-unused-imports'

export default [
  prettierRecommended,
  {
    plugins: {
      '@stylistic': stylistic,
      '@stylistic/ts': stylistic,
      '@typescript-eslint': typescriptEslint,
      'unused-imports': unusedImports,
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
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['debug', 'info', 'warn', 'error', 'assert'] }],
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
      'no-restricted-syntax': [
        'warn',
        {
          message:
            'useValueChanged should only be used for debugging purposes. Remove this call before committing your code.',
          selector: 'CallExpression[callee.name="useValueChanged"]',
        },
      ],
    },
  },
]
