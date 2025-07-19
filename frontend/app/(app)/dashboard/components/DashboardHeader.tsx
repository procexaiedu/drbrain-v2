'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowPathIcon, 
  SignalIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { DashboardStats } from '../types';

interface DashboardHeaderProps {
  nomeMedico: string;
  lastUpdated?: Date;
  onRefresh?: () => void;
  isLoading?: boolean;
  stats?: DashboardStats;
}

export function DashboardHeader({ 
  nomeMedico, 
  lastUpdated, 
  onRefresh, 
  isLoading = false,
  stats 
}: DashboardHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSystemHealthColor = (health?: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSystemHealthIcon = (health?: string) => {
    switch (health) {
      case 'excellent':
      case 'good':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'warning':
      case 'critical':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      default:
        return <SignalIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-700 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Saudação e Informações Principais */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">
              Olá, Dr(a). {nomeMedico}! 👋
            </h1>
            <p className="text-blue-100 text-lg">
              Bem-vindo(a) de volta ao Dr.Brain
            </p>
            <div className="flex items-center space-x-4 text-sm text-blue-200">
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-4 w-4" />
                <span className="capitalize">{formatTime(currentTime)}</span>
              </div>
            </div>
          </div>

          {/* Status e Controles */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
            {/* Status do Sistema */}
            {stats && (
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                <div className={`flex items-center space-x-1 ${getSystemHealthColor(stats.systemHealth)}`}>
                  {getSystemHealthIcon(stats.systemHealth)}
                  <span className="text-sm font-medium text-white">
                    Sistema {stats.systemHealth === 'excellent' ? 'Excelente' : 
                            stats.systemHealth === 'good' ? 'Bom' :
                            stats.systemHealth === 'warning' ? 'Atenção' : 'Crítico'}
                  </span>
                </div>
              </div>
            )}

            {/* Última Atualização */}
            {lastUpdated && (
              <div className="text-sm text-blue-200">
                <span>Atualizado: </span>
                <span className="font-medium">
                  {lastUpdated.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            )}

            {/* Botão de Refresh */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm rounded-lg px-4 py-2 transition-all duration-200 hover:scale-105"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">
                {isLoading ? 'Atualizando...' : 'Atualizar'}
              </span>
            </button>
          </div>
        </div>

        {/* Estatísticas Rápidas */}
        {stats && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="text-2xl font-bold">{stats.totalLeads}</div>
              <div className="text-sm text-blue-200">Total de Leads</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="text-2xl font-bold">{stats.totalPacientes}</div>
              <div className="text-sm text-blue-200">Total de Pacientes</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="text-2xl font-bold">{stats.conversionRate}%</div>
              <div className="text-sm text-blue-200">Taxa de Conversão</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="text-2xl font-bold">{stats.avgResponseTime}</div>
              <div className="text-sm text-blue-200">Tempo Médio</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 