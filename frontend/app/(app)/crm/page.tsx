'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  UserPlusIcon,
  UsersIcon,
  DocumentIcon,
  PhoneIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { 
  UsersIcon as UsersIconSolid,
  UserPlusIcon as UserPlusIconSolid,
  ChartBarIcon as ChartBarIconSolid
} from '@heroicons/react/24/solid';
import LeadsSection from './components/LeadsSection';
import PacientesSection from './components/PacientesSection';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { useLeads } from './hooks/useLeads';
import { usePacientes } from './hooks/usePacientes';

type CrmTab = 'leads' | 'pacientes' | 'analytics';

export default function CrmPage() {
  const { setPageTitle, setPageSubtitle, setBreadcrumbs } = useApp();
  const [activeTab, setActiveTab] = useState<CrmTab>('leads');

  // Dados para o dashboard analytics
  const { data: leadsData } = useLeads('', undefined, 1, 1000);
  const { data: pacientesData } = usePacientes('', undefined, 1, 1000);

  // Configurar título da página
  useEffect(() => {
    setPageTitle('Pacientes (CRM)');
    setPageSubtitle('Gestão de Leads e Pacientes');
    setBreadcrumbs([]);
  }, [setPageTitle, setPageSubtitle, setBreadcrumbs]);

  const tabs = [
    {
      id: 'leads' as const,
      name: 'Leads',
      icon: UserPlusIcon,
      iconSolid: UserPlusIconSolid,
      description: 'Gerencie seus prospects',
      count: leadsData?.data?.length || 0,
    },
    {
      id: 'pacientes' as const,
      name: 'Pacientes',
      icon: UsersIcon,
      iconSolid: UsersIconSolid,
      description: 'Gerencie seus pacientes',
      count: pacientesData?.data?.length || 0,
    },
    {
      id: 'analytics' as const,
      name: 'Analytics',
      icon: ChartBarIcon,
      iconSolid: ChartBarIconSolid,
      description: 'Dashboard e métricas',
      count: 0,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com navegação de abas */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
                  <UsersIcon className="h-6 w-6 text-white" />
                </div>
                <span>Pacientes (CRM)</span>
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Gerencie todo o ciclo de vida de seus contatos, desde leads até pacientes ativos
              </p>
            </div>
          </div>

          {/* Navegação de abas */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => {
                const IconComponent = activeTab === tab.id ? tab.iconSolid : tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent
                      className={`flex-shrink-0 -ml-0.5 mr-3 h-5 w-5 transition-colors duration-200 ${
                        isActive
                          ? 'text-indigo-500'
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    <span>{tab.name}</span>
                    <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium transition-colors duration-200 ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Conteúdo das abas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'leads' && <LeadsSection />}
        {activeTab === 'pacientes' && <PacientesSection />}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard 
            leads={leadsData?.data || []} 
            pacientes={pacientesData?.data || []} 
          />
        )}
      </div>
    </div>
  );
} 