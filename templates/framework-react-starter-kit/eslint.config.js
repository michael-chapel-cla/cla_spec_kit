import globals from 'globals';
import reactRefresh from 'eslint-plugin-react-refresh';
import { reactConfig } from 'framework-eslint-config/react';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist',
      '**/*.test.tsx', // Exclude all .test.tsx files
      '**/*.test.ts', // (optional) Exclude .test.ts files too
      'test/**/*',
      '**/*.config.ts',
      '**/*.workspace.ts',
      '**/setupTests.ts',
      '**/*.setup.ts',
    ],
  },
  {
    extends: [reactConfig],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      '@stylistic/linebreak-style': 'off',
      'react/react-in-jsx-scope': 'off',

      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  }
);
