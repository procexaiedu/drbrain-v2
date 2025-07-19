'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

export default function Header() {
  const { pageTitle, pageSubtitle, breadcrumbs } = useApp();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex flex-col space-y-2">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <Link 
              href="/dashboard" 
              className="flex items-center hover:text-gray-700 transition-colors duration-200"
            >
              <HomeIcon className="h-4 w-4 mr-1" />
              <span>Home</span>
            </Link>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                {crumb.href ? (
                  <Link 
                    href={crumb.href}
                    className="hover:text-gray-700 transition-colors duration-200"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-gray-700 font-medium">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Título e Subtítulo */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {pageTitle}
            </h1>
            {pageSubtitle && (
              <p className="text-gray-600 mt-1 text-sm">
                {pageSubtitle}
              </p>
            )}
          </div>
          
          {/* Área para ações futuras (botões, dropdowns, etc.) */}
          <div className="flex items-center space-x-3">
            {/* Placeholder para ações futuras */}
          </div>
        </div>
      </div>
    </header>
  );
} 