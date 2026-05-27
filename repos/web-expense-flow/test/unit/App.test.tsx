/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock setup before imports
beforeAll(() => {
  // Mock CSS files
  vi.mock('../../src/App.css', () => ({}));
  vi.mock('bootstrap/dist/css/bootstrap.min.css', () => ({}));

  // Mock lib-seamlesscomponents-react to avoid ESM/CJS issues
  vi.mock('lib-seamlesscomponents-react', () => ({
    claTheme: {},
    claDarkTheme: {},
  }));

  // Mock MUI ThemeProvider with valid component
  vi.mock('@mui/material/styles', () => ({
    ThemeProvider: ({ children }: any) => (
      <div data-testid="theme-provider">{children}</div>
    ),
  }));

  // Mock router module
  vi.mock('../../src/router', () => ({
    default: { routes: [] },
  }));

  // Mock React Router components
  vi.mock('react-router-dom', () => ({
    RouterProvider: () => <div data-testid="router-provider" />,
  }));

  // Mock framework-react-core routes
  vi.mock('framework-react-core/routes', () => ({
    requireAuth: () => () => null,
  }));

  // Mock Home page with valid component
  vi.mock('../../src/pages/Home', () => ({
    default: () => <div data-testid="home-page">Home Page</div>,
  }));

  // Mock AuthCallback page
  vi.mock('../../src/pages/AuthCallback', () => ({
    default: () => <div data-testid="auth-callback-page">Auth Callback</div>,
  }));
});

describe('App Component', () => {
  it('renders without crashing', async () => {
    const { default: App } = await import('../../src/App');
    render(<App />);
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
  });

  it('renders the main content with router', async () => {
    const { default: App } = await import('../../src/App');
    render(<App />);
    expect(screen.getByTestId('router-provider')).toBeInTheDocument();
  });
});
