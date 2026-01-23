'use client';

// Import components to trigger registration
import { initializeComponents } from '@object-ui/components';
import { ComponentRegistry } from '@object-ui/core';
import { useEffect } from 'react';

export function ObjectUIProvider({ children }: { children: React.ReactNode }) {
  // Explicitly call init to ensure components are registered
  useEffect(() => {
    initializeComponents();
    
    // Wait a bit for plugins to register, then log
    setTimeout(() => {
      const componentTypes = ComponentRegistry.getAllTypes();
      console.log('[ObjectUIProvider] Registered components:', componentTypes);
    }, 100);
  }, []);
  
  return <>{children}</>;
}
