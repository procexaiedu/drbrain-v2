'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DocumentPlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  SpeakerWaveIcon,
  CalendarDaysIcon,
  UserIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import { 
  DocumentCheckIcon, 
  ClockIcon as ClockIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid 
} from '@heroicons/react/24/solid';
import { supabase } from '@/lib/supabaseClient';
import { useApp } from '@/context/AppContext';
import StatusBadge from '@/components/ui/StatusBadge';
import NewProntuarioModal from '@/components/ui/NewProntuarioModal';

interface Prontuario {
  id: string;
  paciente_id: string;
  nome_paciente: string;
  data_consulta: string;
  status_prontuario: string;
  data_ultima_modificacao: string;
}

const ProntuariosPage: React.FC = () => {
  const router = useRouter();
  const { setPageTitle, setPageSubtitle, setBreadcrumbs } = useApp();
  const [prontuarios, setProntuarios] = useState<Prontuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const statusOptions = [
    { value: '', label: 'Todos os status' },
    { value: 'PENDENTE_UPLOAD_STORAGE', label: 'Enviando áudio...' },
    { value: 'AGUARDANDO_PROCESSAMENTO_N8N', label: 'Aguardando processamento' },
    { value: 'PROCESSANDO_N8N', label: 'Processando IA' },
    { value: 'RASCUNHO_DISPONIVEL', label: 'Rascunho disponível' },
    { value: 'FINALIZADO', label: 'Finalizado' },
    { value: 'ERRO_PROCESSAMENTO', label: 'Erro no processamento' }
  ];

  // Configurar título da página
  useEffect(() => {
    setPageTitle('Prontuários Inteligentes');
    setPageSubtitle('Gerencie prontuários médicos com IA avançada');
    setBreadcrumbs([]);
  }, [setPageTitle, setPageSubtitle, setBreadcrumbs]);

  // Carregar prontuários
  const loadProntuarios = async (pageNum: number = 1, reset: boolean = true) => {
    try {
      if (reset) {
        setIsLoading(true);
        setError(null);
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20'
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const basePath = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || '/api/edge';
      const url = `${basePath}/v1/prontuarios-crud?${params}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar prontuários');
      }

      const data = await response.json();
      
      if (reset) {
        setProntuarios(data.prontuarios || []);
      } else {
        setProntuarios(prev => [...prev, ...(data.prontuarios || [])]);
      }
      
      setHasMorePages((data.prontuarios || []).length === 20);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      if (reset) {
        setProntuarios([]);
      }
    } finally {
      if (reset) {
        setIsLoading(false);
      }
    }
  };

  // Carregar na inicialização
  useEffect(() => {
    loadProntuarios();
  }, []);

  // Recarregar quando filtros mudarem
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadProntuarios(1, true);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  const handleProntuarioCreated = (prontuarioId: string) => {
    // Recarregar lista
    loadProntuarios();
    // Navegar para o prontuário criado
    router.push(`/prontuarios/${prontuarioId}`);
  };

  const handleViewProntuario = (id: string) => {
    router.push(`/prontuarios/${id}`);
  };

  const handleDeleteProntuario = async (id: string) => {
    const prontuario = prontuarios.find(p => p.id === id);
    const status = prontuario?.status_prontuario || '';
    
    let confirmMessage = 'Tem certeza que deseja excluir este prontuário?';
    
    // Mensagem mais específica baseada no status
    if (status === 'PROCESSANDO_N8N' || status === 'AGUARDANDO_PROCESSAMENTO_N8N') {
      confirmMessage = 'Este prontuário está sendo processado. Tem certeza que deseja excluir?';
    } else if (status === 'FINALIZADO') {
      confirmMessage = 'Este é um prontuário finalizado. Tem certeza que deseja excluir permanentemente?';
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    setDeletingId(id);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const basePath = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || '/api/edge';
      const response = await fetch(`${basePath}/v1/prontuarios-crud/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir prontuário');
      }

      // Remover da lista local
      setProntuarios(prev => prev.filter(p => p.id !== id));
      
      // Mostrar sucesso
      alert('Prontuário excluído com sucesso!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const canEdit = (status: string): boolean => {
    return ['RASCUNHO_DISPONIVEL', 'FINALIZADO'].includes(status);
  };

  // Calcular métricas
  const getMetrics = () => {
    const total = prontuarios.length;
    const finalizados = prontuarios.filter(p => p.status_prontuario === 'FINALIZADO').length;
    const processando = prontuarios.filter(p => ['AGUARDANDO_PROCESSAMENTO_N8N', 'PROCESSANDO_N8N'].includes(p.status_prontuario)).length;
    const rascunhos = prontuarios.filter(p => p.status_prontuario === 'RASCUNHO_DISPONIVEL').length;
    const erros = prontuarios.filter(p => p.status_prontuario === 'ERRO_PROCESSAMENTO').length;

    return { total, finalizados, processando, rascunhos, erros };
  };

  const metrics = getMetrics();

  // Função para obter o ícone e cor do status
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'FINALIZADO':
        return { icon: DocumentCheckIcon, color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'RASCUNHO_DISPONIVEL':
        return { icon: DocumentTextIcon, color: 'text-blue-600', bgColor: 'bg-blue-100' };
      case 'PROCESSANDO_N8N':
      case 'AGUARDANDO_PROCESSAMENTO_N8N':
        return { icon: ClockIconSolid, color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
      case 'ERRO_PROCESSAMENTO':
        return { icon: ExclamationTriangleIconSolid, color: 'text-red-600', bgColor: 'bg-red-100' };
      default:
        return { icon: ClockIconSolid, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header Moderno */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  🏥 Prontuários Médicos
                </h1>
                <p className="mt-2 text-gray-600">
                  Gerencie e visualize os prontuários de seus pacientes com IA
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {/* Toggle de visualização */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'cards' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Visualização em Cards"
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'table' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Visualização em Tabela"
                  >
                    <ListBulletIcon className="h-4 w-4" />
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowNewModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <DocumentPlusIcon className="h-5 w-5 mr-2" />
                  Novo Prontuário
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <DocumentTextIcon className="h-5 w-5 text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-xl font-bold text-gray-900">{metrics.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Finalizados</p>
                <p className="text-xl font-bold text-green-600">{metrics.finalizados}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Rascunhos</p>
                <p className="text-xl font-bold text-blue-600">{metrics.rascunhos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Processando</p>
                <p className="text-xl font-bold text-yellow-600">{metrics.processando}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Erros</p>
                <p className="text-xl font-bold text-red-600">{metrics.erros}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros Modernos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="🔍 Buscar por nome do paciente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Filtro de status */}
              <div className="sm:w-72">
                <div className="relative">
                  <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="mt-6">
          {error && (
            <div className="bg-white rounded-lg shadow-sm border border-red-200 mb-6">
              <div className="border-l-4 border-red-400 bg-red-50 p-4 rounded-lg">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Erro</h3>
                    <div className="text-sm text-red-700 mt-1">{error}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-center items-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-3 border-indigo-500 border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-gray-600 font-medium">Carregando prontuários...</p>
                </div>
              </div>
            </div>
          ) : prontuarios.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="text-center py-16">
                <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <DocumentPlusIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm || statusFilter ? 'Nenhum prontuário encontrado' : 'Nenhum prontuário ainda'}
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {searchTerm || statusFilter 
                    ? 'Tente ajustar os filtros de busca para encontrar o que procura.'
                    : 'Comece criando seu primeiro prontuário médico com nossa IA avançada.'
                  }
                </p>
                {!searchTerm && !statusFilter && (
                  <button
                    type="button"
                    onClick={() => setShowNewModal(true)}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <DocumentPlusIcon className="h-5 w-5 mr-2" />
                    Criar Primeiro Prontuário
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {viewMode === 'cards' ? (
                // Layout de Cards Moderno
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {prontuarios.map((prontuario) => {
                    const statusDisplay = getStatusDisplay(prontuario.status_prontuario);
                    const StatusIcon = statusDisplay.icon;
                    
                    return (
                      <div 
                        key={prontuario.id} 
                        className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg hover:border-indigo-200 transition-all duration-200 cursor-pointer transform hover:scale-[1.02]"
                        onClick={() => handleViewProntuario(prontuario.id)}
                      >
                        <div className="p-6">
                          {/* Header do Card */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center">
                              <div className={`p-2 rounded-lg ${statusDisplay.bgColor} mr-3`}>
                                <StatusIcon className={`h-5 w-5 ${statusDisplay.color}`} />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                                  {prontuario.nome_paciente}
                                </h3>
                                <StatusBadge status={prontuario.status_prontuario} />
                              </div>
                            </div>
                          </div>

                          {/* Informações do Card */}
                          <div className="space-y-3">
                            <div className="flex items-center text-sm text-gray-600">
                              <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-400" />
                              <span>Consulta: {formatDate(prontuario.data_consulta)}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                              <span>Modificado: {formatDateTime(prontuario.data_ultima_modificacao)}</span>
                            </div>
                          </div>

                          {/* Ações do Card */}
                          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewProntuario(prontuario.id);
                                }}
                                className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Visualizar"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              
                              {canEdit(prontuario.status_prontuario) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewProntuario(prontuario.id);
                                  }}
                                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                              )}
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProntuario(prontuario.id);
                                }}
                                disabled={deletingId === prontuario.id}
                                className={`p-2 rounded-lg transition-colors ${
                                  deletingId === prontuario.id 
                                    ? 'text-gray-400 cursor-not-allowed' 
                                    : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                                }`}
                                title="Excluir"
                              >
                                {deletingId === prontuario.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent"></div>
                                ) : (
                                  <TrashIcon className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                            
                            <div className="text-xs text-gray-400">
                              #{prontuario.id.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Layout de Tabela Original (melhorado)
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Paciente
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Data da Consulta
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Última Modificação
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {prontuarios.map((prontuario) => (
                          <tr key={prontuario.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8">
                                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <UserIcon className="h-4 w-4 text-indigo-600" />
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {prontuario.nome_paciente}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    #{prontuario.id.slice(-6)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(prontuario.data_consulta)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge status={prontuario.status_prontuario} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {formatDateTime(prontuario.data_ultima_modificacao)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleViewProntuario(prontuario.id)}
                                  className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Visualizar"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </button>
                                
                                {canEdit(prontuario.status_prontuario) && (
                                  <button
                                    onClick={() => handleViewProntuario(prontuario.id)}
                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Editar"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => handleDeleteProntuario(prontuario.id)}
                                  disabled={deletingId === prontuario.id}
                                  className={`p-2 rounded-lg transition-colors ${
                                    deletingId === prontuario.id 
                                      ? 'text-gray-400 cursor-not-allowed' 
                                      : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                                  }`}
                                  title="Excluir"
                                >
                                  {deletingId === prontuario.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent"></div>
                                  ) : (
                                    <TrashIcon className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Paginação Melhorada */}
              {hasMorePages && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => loadProntuarios(page + 1, false)}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-all duration-200"
                  >
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Carregar mais prontuários
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de novo prontuário */}
      <NewProntuarioModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onProntuarioCreated={handleProntuarioCreated}
      />
    </div>
  );
};

export default ProntuariosPage;