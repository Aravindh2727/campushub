import React from 'react';
import { cn } from '../../lib/utils';

export function NeonButton({ className, children, variant = 'primary', ...props }) {
  return (
    <button
      className={cn(
        variant === 'primary' ? 'glass-button-primary' : 'glass-button',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
