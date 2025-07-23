import Sidebar from './Sidebar';
import Header from './Header';
import React from 'react';
import { AppProvider } from '@/context/AppContext';
import FeedbackButton from '@/components/ui/FeedbackButton';
import FeedbackModal from '@/components/ui/FeedbackModal';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {children}
            </div>
          </div>
        </main>
        
        {/* Componentes globais */}
        <FeedbackButton />
        <FeedbackModal />
      </div>
    </AppProvider>
  );
} 