import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { claTheme } from 'lib-seamlesscomponents-react';
import AuthCallback from '../../src/pages/AuthCallback';

export default {
  title: 'Pages/AuthCallback',
  component: AuthCallback,
  parameters: {
    docs: {
      description: {
        component:
          'AuthCallback component displays a loading state during the authentication redirect process. This page is shown when users are redirected back from the authentication provider.',
      },
    },
    layout: 'fullscreen',
  },
};

const Template = () => (
  <ThemeProvider theme={claTheme}>
    <AuthCallback />
  </ThemeProvider>
);

export const Default = Template.bind({});
