import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock setup before imports
beforeAll(() => {
  // Mock MUI components
  vi.mock('@mui/material', () => ({
    Box: ({ children, ...props }: any) => (
      <div data-testid="box" {...props}>
        {children}
      </div>
    ),
    CircularProgress: () => <div data-testid="loading-spinner">Loading...</div>,
    Typography: ({ children, variant, component, ...props }: any) => (
      <div data-testid={`typography-${variant}`} {...props}>
        {children}
      </div>
    ),
  }));
});

describe('AuthCallback Component', () => {
  it('renders without crashing', async () => {
    const { default: AuthCallback } = await import('../../src/pages/AuthCallback');
    render(<AuthCallback />);
    expect(screen.getByTestId('box')).toBeInTheDocument();
  });

  it('displays the "Completing Login" message', async () => {
    const { default: AuthCallback } = await import('../../src/pages/AuthCallback');
    render(<AuthCallback />);
    expect(screen.getByText('Completing Login')).toBeInTheDocument();
  });

  it('displays a loading spinner', async () => {
    const { default: AuthCallback } = await import('../../src/pages/AuthCallback');
    render(<AuthCallback />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
