/* eslint-disable import-x/no-extraneous-dependencies */
// @ts-check

import tseslint from 'typescript-eslint';
import { recommendedConfig } from 'framework-eslint-config';

export default tseslint.config(
  {
    ignores: ['node_modules', '**/node_modules/**', '**/*.js', '**/*.d.ts', 'dist/**/*'],
  },
  ...recommendedConfig,
  {
    rules: {
      '@stylistic/linebreak-style': 'off',
    },
  },
);
