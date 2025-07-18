'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  CreditCardIcon,
  BanknotesIcon,
  ReceiptPercentIcon
} from '@heroicons/react/24/outline';
import {
  CreditCardIcon as CreditCardIconSolid,
  BanknotesIcon as BanknotesIconSolid,
  ReceiptPercentIcon as ReceiptPercentIconSolid
} from '@heroicons/react/24/solid';

import CobrancasSection from './components/CobrancasSection';
import TransacoesSection from './components/TransacoesSection';
import AssinaturasSection from './components/AssinaturasSection';

import { useCobrancas } from './hooks/useCobrancas';
import { useTransacoes } from './hooks/useTransacoes';
import { useAssinaturas } from './hooks/useAssinaturas';

type FinanceiroTab = 'cobrancas' | 'transacoes' | 'assinaturas';

export default function FinanceiroPage() {
  const { setPageTitle, setPageSubtitle, setBreadcrumbs } = useApp();
  const [activeTab, setActiveTab] = useState<FinanceiroTab>('cobrancas');

  const { data: cobrancasData } = useCobrancas('', 'PENDENTE', 1, 1000);
  const { data: transacoesData } = useTransacoes('', 'RECEITA', 1, 1000);
  const { data: assinaturasData } = useAssinaturas('', 'ATIVA', 1, 1000);

  useEffect(() => {
    setPageTitle('Financeiro');
    setPageSubtitle('Gestão de Cobranças, Transações e Assinaturas');
    setBreadcrumbs([]);
  }, [setPageTitle, setPageSubtitle, setBreadcrumbs]);

  const tabs = [
    {
      id: 'cobrancas' as const,
      name: 'Cobranças',
      icon: CreditCardIcon,
      iconSolid: CreditCardIconSolid,
      description: 'Gerencie suas cobranças e pagamentos',
      count: cobrancasData?.total || 0,
    },
    {
      id: 'transacoes' as const,
      name: 'Transações',
      icon: BanknotesIcon,
      iconSolid: BanknotesIconSolid,
      description: 'Controle suas receitas e despesas',
      count: transacoesData?.total || 0,
    },
    {
      id: 'assinaturas' as const,
      name: 'Assinaturas',
      icon: ReceiptPercentIcon,
      iconSolid: ReceiptPercentIconSolid,
      description: 'Gerencie serviços recorrentes',
      count: assinaturasData?.total || 0,
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
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl">
                  <BanknotesIcon className="h-6 w-6 text-white" />
                </div>
                <span>Financeiro</span>
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Gerencie suas finanças, cobranças e assinaturas de forma integrada
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
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent
                      className={`flex-shrink-0 -ml-0.5 mr-3 h-5 w-5 transition-colors duration-200 ${
                        isActive
                          ? 'text-blue-500'
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    <span>{tab.name}</span>
                    <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-100 text-blue-600'
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
        {activeTab === 'cobrancas' && <CobrancasSection />}
        {activeTab === 'transacoes' && <TransacoesSection />}
        {activeTab === 'assinaturas' && <AssinaturasSection />}
      </div>
    </div>
  );
}