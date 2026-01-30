/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { createLazyPlugin } from '../LazyPluginLoader';

describe('createLazyPlugin', () => {
  it('should create a lazy-loaded component', async () => {
    const TestComponent = () => <div>Test Component</div>;
    
    const LazyComponent = createLazyPlugin(
      () => Promise.resolve({ default: TestComponent })
    );
    
    render(<LazyComponent />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });
  });

  it('should show custom fallback while loading', async () => {
    const TestComponent = () => <div>Test Component</div>;
    
    const LazyComponent = createLazyPlugin(
      () => new Promise<{ default: React.ComponentType }>((resolve) => {
        setTimeout(() => resolve({ default: TestComponent }), 100);
      }),
      { fallback: <div>Loading...</div> }
    );
    
    render(<LazyComponent />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });
  });

  it('should pass props to the lazy component', async () => {
    interface TestProps {
      message: string;
    }
    
    const TestComponent = ({ message }: TestProps) => <div>{message}</div>;
    
    const LazyComponent = createLazyPlugin<TestProps>(
      () => Promise.resolve({ default: TestComponent })
    );
    
    render(<LazyComponent message="Hello World" />);
    
    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
  });

  it('should handle loading errors gracefully', async () => {
    // Mock console.error to avoid noise in test output
    const originalError = console.error;
    console.error = vi.fn();

    const LazyComponent = createLazyPlugin<any>(
      () => Promise.reject(new Error('Load error'))
    );
    
    expect(() => render(<LazyComponent />)).not.toThrow();
    
    // Restore console.error
    console.error = originalError;
  });
});
