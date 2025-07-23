'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  pageTitle: string;
  setPageTitle: (title: string) => void;
  pageSubtitle?: string;
  setPageSubtitle: (subtitle: string) => void;
  breadcrumbs: { label: string; href?: string }[];
  setBreadcrumbs: (breadcrumbs: { label: string; href?: string }[]) => void;
  isFeedbackModalOpen: boolean;
  openFeedbackModal: () => void;
  closeFeedbackModal: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [pageTitle, setPageTitle] = useState('Dr.Brain');
  const [pageSubtitle, setPageSubtitle] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<{ label: string; href?: string }[]>([]);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const openFeedbackModal = () => setIsFeedbackModalOpen(true);
  const closeFeedbackModal = () => setIsFeedbackModalOpen(false);

  const value: AppContextType = {
    pageTitle,
    setPageTitle,
    pageSubtitle,
    setPageSubtitle,
    breadcrumbs,
    setBreadcrumbs,
    isFeedbackModalOpen,
    openFeedbackModal,
    closeFeedbackModal,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
} 