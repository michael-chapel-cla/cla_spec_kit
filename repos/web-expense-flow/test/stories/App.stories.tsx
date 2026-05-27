import React from 'react';
import { initializeApp, LibContext } from 'framework-react-core';

await initializeApp({configFilePath: '/static-config.json'});
const { App } = await import('../../src/App');

export default {
  title: 'App/Main',
  component: App,
  parameters: {
    docs: {
      description: {
        component:
          'App is the entry point of the application.',
      },
    },
  },
};

const Template = () => (
  <LibContext provideRouter={false}>
    <App />
  </LibContext>
);

export const Default = Template.bind({});
