'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  CubeIcon,
  TagIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import {
  CubeIcon as CubeIconSolid,
  TagIcon as TagIconSolid,
  BuildingStorefrontIcon as BuildingStorefrontIconSolid
} from '@heroicons/react/24/solid';

import ProdutosSection from './components/ProdutosSection';
import ServicosSection from './components/ServicosSection';
import FornecedoresSection from './components/FornecedoresSection';

import { useProdutos } from './hooks/useProdutos';
import { useServicos } from './hooks/useServicos';
import { useFornecedores } from './hooks/useFornecedores';

type EstoqueTab = 'produtos' | 'servicos' | 'fornecedores';

export default function EstoquePage() {
  const { setPageTitle, setPageSubtitle, setBreadcrumbs } = useApp();
  const [activeTab, setActiveTab] = useState<EstoqueTab>('produtos');

  const { data: produtosData } = useProdutos('', 1, 1000);
  const { data: servicosData } = useServicos('', 1, 1000);
  const { data: fornecedoresData } = useFornecedores('', 1, 1000);

  useEffect(() => {
    setPageTitle('Estoque e Produtos');
    setPageSubtitle('Gestão de Produtos, Serviços e Fornecedores');
    setBreadcrumbs([]);
  }, [setPageTitle, setPageSubtitle, setBreadcrumbs]);

  const tabs = [
    {
      id: 'produtos' as const,
      name: 'Produtos',
      icon: CubeIcon,
      iconSolid: CubeIconSolid,
      description: 'Gerencie seus produtos e insumos',
      count: produtosData?.total || 0,
    },
    {
      id: 'servicos' as const,
      name: 'Serviços',
      icon: TagIcon,
      iconSolid: TagIconSolid,
      description: 'Gerencie seus serviços oferecidos',
      count: servicosData?.total || 0,
    },
    {
      id: 'fornecedores' as const,
      name: 'Fornecedores',
      icon: BuildingStorefrontIcon,
      iconSolid: BuildingStorefrontIconSolid,
      description: 'Gerencie seus fornecedores',
      count: fornecedoresData?.total || 0,
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
                <div className="p-2 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl">
                  <CubeIcon className="h-6 w-6 text-white" />
                </div>
                <span>Estoque e Produtos</span>
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Controle seus produtos, serviços e fornecedores de forma eficiente
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
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent
                      className={`flex-shrink-0 -ml-0.5 mr-3 h-5 w-5 transition-colors duration-200 ${
                        isActive
                          ? 'text-green-500'
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    <span>{tab.name}</span>
                    <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium transition-colors duration-200 ${
                      isActive
                        ? 'bg-green-100 text-green-600'
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
        {activeTab === 'produtos' && <ProdutosSection />}
        {activeTab === 'servicos' && <ServicosSection />}
        {activeTab === 'fornecedores' && <FornecedoresSection />}
      </div>
    </div>
  );
}