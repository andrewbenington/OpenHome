import stylistic from '@stylistic/eslint-plugin'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import reactEslint from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unusedImports from 'eslint-plugin-unused-imports'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['src/core/tauri/spectaCommands.ts'] },
  prettierRecommended,
  {
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
      '@typescript-eslint/no-misused-promises': 'warn',
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
      '@typescript-eslint/restrict-template-expressions': 'off',

      // TODO: revert all below to errors
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-implied-eval': 'off',
      '@typescript-eslint/prefer-as-const': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/only-throw-error': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  }
)
