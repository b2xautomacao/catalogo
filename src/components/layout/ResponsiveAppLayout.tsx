import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNavigation from './MobileNavigation';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import Footer from './Footer';

interface ResponsiveAppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{
    href?: string;
    label: string;
    current?: boolean;
  }>;
}

const ResponsiveAppLayout: React.FC<ResponsiveAppLayoutProps> = ({ 
  children, 
  title, 
  subtitle, 
  breadcrumbs 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header with Mobile Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          <div className="flex items-center gap-4">
            <MobileNavigation />
            <div>
              <h1 className="text-lg md:text-xl font-semibold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-600 hidden sm:block">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 pt-16 md:pl-64 flex flex-col">
        <div className="p-4 md:p-6 flex-1">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="mb-4 md:mb-6">
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((breadcrumb, index) => (
                    <React.Fragment key={index}>
                      <BreadcrumbItem>
                        {breadcrumb.current ? (
                          <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={breadcrumb.href || '#'}>
                            {breadcrumb.label}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          )}
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default ResponsiveAppLayout;
