module.exports = {
  extends: ['erb', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    createDefaultProgram: true,
  },
  settings: {
    'import/resolver': {
      // See https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-575727774 for line below
      node: {},
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'prettier/prettier': ['error', { printWidth: 80, tabWidth: 2 }],
  },
  rules: {
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    'import/prefer-default-export': 'off',
    'no-bitwise': 'off',
    'no-plusplus': 'off',
    'class-methods-use-this': 'off',
    'default-case': 'off',
    'operator-assignment': 'off',
    'prefer-destructuring': 'off',
    'no-underscore-dangle': 'off',
    'one-var': 'off',
    'no-shadow': 'off',
    'react/function-component-definition': 'off',
    'react/jsx-filename-extension': 'off',
    'react/react-in-jsx-scope': 'off',
    'max-classes-per-file': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'import/no-extraneous-dependencies': 'off',
    'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
    radix: 'off',
    'react/button-has-type': 'off',
    'react/require-default-props': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'promise/catch-or-return': 'off',
  },
};
