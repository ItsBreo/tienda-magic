import * as React from 'react';
import { SidebarInset } from '@/components/ui/sidebar';

interface AppContentProps extends React.ComponentProps<'main'> {
  variant?: 'header' | 'sidebar';
}

export function AppContent({
  variant = 'header',
  children,
  className,
  ...props
}: AppContentProps) {
  if (variant === 'sidebar') {
    // eslint-disable-next-line react/jsx-props-no-spreading
    return <SidebarInset className={className} {...props}>{children}</SidebarInset>;
  }

  return (
    <main
      className={`mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-4 rounded-xl ${className || ''}`}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    >
      {children}
    </main>
  );
}
