import React from 'react';
import { cn } from '../../lib/utils';

export function GlassCard({ className, children, ...props }) {
  return (
    <div 
      className={cn("glass-card p-6", className)} 
      {...props}
    >
      {children}
    </div>
  );
}
