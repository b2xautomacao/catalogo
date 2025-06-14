
import React from 'react';
import ResponsiveAppLayout from './ResponsiveAppLayout';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{
    href?: string;
    label: string;
    current?: boolean;
  }>;
}

const AppLayout: React.FC<AppLayoutProps> = (props) => {
  return <ResponsiveAppLayout {...props} />;
};

export default AppLayout;
