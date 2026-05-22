/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import './App.css';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { claDarkTheme, claTheme } from 'lib-seamlesscomponents-react';
import router from './router';

const THEMES = {
  light: claTheme,
  dark: claDarkTheme,
};

export function App() {
  const theme = THEMES.light; // or THEMES.dark for dark mode

  return (
    <ThemeProvider theme={theme}>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
