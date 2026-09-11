import stylistic from '@stylistic/eslint-plugin'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import reactEslint from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unusedImports from 'eslint-plugin-unused-imports'
import tseslint from 'typescript-eslint'

export default tseslint.config(prettierRecommended, {
  files: ['src/**/*.{js,mjs,cjs,ts,mts,jsx,tsx}'],
  extends: [tseslint.configs.recommendedTypeChecked],
  plugins: {
    '@stylistic': stylistic,
    'unused-imports': unusedImports,
    'react-refresh': reactRefresh,
    'react-hooks': reactHooks,
    react: reactEslint,
  },
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  rules: {
    'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'warn',
    'unused-imports/no-unused-vars': [
      'warn',
      { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
    ],
    'no-console': ['warn', { allow: ['debug', 'info', 'warn', 'error', 'assert'] }],
    eqeqeq: 'error',
    '@stylistic/padding-line-between-statements': [
      'error',
      {
        blankLine: 'any',
        prev: ['const', 'let', 'var'],
        next: ['const', 'let', 'var'],
      },
      { blankLine: 'always', prev: '*', next: ['interface'] },
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
})
