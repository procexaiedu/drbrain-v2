'use client';

import React, { useState } from 'react';
import {
  FunnelIcon,
  XMarkIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { LeadStatus, LEAD_STATUS_OPTIONS } from '../types';

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  isOpen: boolean;
  onClose: () => void;
}

export interface FilterState {
  searchTerm: string;
  status: LeadStatus | '';
  dateFrom: string;
  dateTo: string;
  origem: string;
  hasEmail: boolean | null;
  hasPhone: boolean | null;
}

const initialFilters: FilterState = {
  searchTerm: '',
  status: '',
  dateFrom: '',
  dateTo: '',
  origem: '',
  hasEmail: null,
  hasPhone: null
};

export default function AdvancedFilters({ onFiltersChange, isOpen, onClose }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Verificar se há filtros ativos
    const isActive = Object.entries(newFilters).some(([k, v]) => {
      if (k === 'hasEmail' || k === 'hasPhone') return v !== null;
      return v !== '' && v !== null;
    });
    setHasActiveFilters(isActive);
    
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    setFilters(initialFilters);
    setHasActiveFilters(false);
    onFiltersChange(initialFilters);
  };

  const getActiveFiltersCount = (): number => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'hasEmail' || key === 'hasPhone') return value !== null;
      return value !== '' && value !== null;
    }).length;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => onClose()}
        className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${
          hasActiveFilters 
            ? 'bg-indigo-50 text-indigo-700 border-indigo-300' 
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
        Filtros Avançados
        {hasActiveFilters && (
          <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {getActiveFiltersCount()}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Filtros Avançados</h3>
          {hasActiveFilters && (
            <span className="ml-3 inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {getActiveFiltersCount()} ativo{getActiveFiltersCount() > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Limpar todos
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Busca por texto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar por nome ou email
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Digite para buscar..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Filtro de status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status no funil
          </label>
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value as LeadStatus | '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Todos os status</option>
            {LEAD_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Origem do lead */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Origem do lead
          </label>
          <input
            type="text"
            placeholder="Ex: Site, Instagram, Indicação..."
            value={filters.origem}
            onChange={(e) => updateFilter('origem', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Data de criação - De */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Criado a partir de
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Data de criação - Até */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Criado até
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Filtros de contato */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Informações de contato
          </label>
          
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.hasEmail === true}
                onChange={(e) => updateFilter('hasEmail', e.target.checked ? true : null)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Possui email</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.hasPhone === true}
                onChange={(e) => updateFilter('hasPhone', e.target.checked ? true : null)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Possui telefone</span>
            </label>
          </div>
        </div>
      </div>

      {/* Resumo dos filtros ativos */}
      {hasActiveFilters && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Filtros ativos:</h4>
          <div className="flex flex-wrap gap-2">
            {filters.searchTerm && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Busca: &quot;{filters.searchTerm}&quot;
                <button
                  onClick={() => updateFilter('searchTerm', '')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:text-blue-600"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.status && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Status: {LEAD_STATUS_OPTIONS.find(opt => opt.value === filters.status)?.label}
                <button
                  onClick={() => updateFilter('status', '')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-400 hover:text-purple-600"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.origem && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Origem: {filters.origem}
                <button
                  onClick={() => updateFilter('origem', '')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:text-green-600"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {(filters.dateFrom || filters.dateTo) && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Período: {filters.dateFrom || '...'} até {filters.dateTo || '...'}
                <button
                  onClick={() => {
                    updateFilter('dateFrom', '');
                    updateFilter('dateTo', '');
                  }}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-yellow-400 hover:text-yellow-600"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.hasEmail === true && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Com email
                <button
                  onClick={() => updateFilter('hasEmail', null)}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:text-indigo-600"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.hasPhone === true && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Com telefone
                <button
                  onClick={() => updateFilter('hasPhone', null)}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:text-indigo-600"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 