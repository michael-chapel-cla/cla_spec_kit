// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const storybookConfig: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(js|jsx|ts|tsx)',
    '../test/stories/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/experimental-addon-test',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
  },
  viteFinal: (viteConfig) => {
    // Handle module resolution issues
    const updatedConfig = { ...viteConfig };
    updatedConfig.resolve = updatedConfig.resolve || {};
    updatedConfig.resolve.alias = {
      ...updatedConfig.resolve.alias,
      '@': '/opt/cla/src',
    };

    // Optimize dependencies to prevent resolution warnings
    updatedConfig.optimizeDeps = updatedConfig.optimizeDeps || {};
    updatedConfig.optimizeDeps.include = [
      ...(updatedConfig.optimizeDeps.include || []),
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
      'framework-react-core',
      'react',
      'react-dom',
    ];

    // Force pre-bundling to avoid package.json resolution issues
    updatedConfig.optimizeDeps.force = true;

    // Handle ESM/CommonJS compatibility
    updatedConfig.define = {
      ...updatedConfig.define,
      global: 'globalThis',
    };

    // Handle dependency resolution
    updatedConfig.resolve.dedupe = [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/icons-material',
    ];

    return updatedConfig;
  },
};

export default storybookConfig;
