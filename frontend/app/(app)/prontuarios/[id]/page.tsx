'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeftIcon,
  SpeakerWaveIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabaseClient';
import { useApp } from '@/context/AppContext';
import StatusBadge from '@/components/ui/StatusBadge';
import ReactMarkdown from 'react-markdown';

interface ProntuarioDetail {
  id: string;
  paciente_id: string;
  nome_paciente: string;
  cpf_paciente: string;
  data_consulta: string;
  status_prontuario: string;
  audio_original_filename: string;
  conteudo_transcricao_bruta: string | null;
  conteudo_rascunho: string | null;
  conteudo_finalizado: string | null;
  erro_processamento_msg: string | null;
  data_criacao: string;
  data_ultima_modificacao: string;
}

const ProntuarioDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { setPageTitle, setPageSubtitle, setBreadcrumbs } = useApp();
  const prontuarioId = params.id as string;

  const [prontuario, setProntuario] = useState<ProntuarioDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [transcricaoExpandida, setTranscricaoExpandida] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Configurar título da página quando prontuário carrega
  useEffect(() => {
    if (prontuario) {
      setPageTitle(`Prontuário - ${prontuario.nome_paciente}`);
      setPageSubtitle(`Data: ${formatDate(prontuario.data_consulta)} • Status: ${prontuario.status_prontuario}`);
      setBreadcrumbs([
        { label: 'Prontuários', href: '/prontuarios' },
        { label: prontuario.nome_paciente }
      ]);
    } else {
      setPageTitle('Carregando Prontuário...');
      setPageSubtitle('');
      setBreadcrumbs([
        { label: 'Prontuários', href: '/prontuarios' },
        { label: 'Carregando...' }
      ]);
    }
  }, [prontuario, setPageTitle, setPageSubtitle, setBreadcrumbs]);

  // Carregar dados do prontuário
  const loadProntuario = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const basePath = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || '/api/edge';
      const response = await fetch(`${basePath}/v1/prontuarios-crud/${prontuarioId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Prontuário não encontrado');
        }
        throw new Error('Erro ao carregar prontuário');
      }

      const data = await response.json();
      setProntuario(data);
      setEditContent(data.conteudo_rascunho || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar URL do áudio
  const loadAudioUrl = async () => {
    if (!prontuario?.audio_original_filename) return;

    try {
      setIsLoadingAudio(true);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const basePath = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || '/api/edge';
      const response = await fetch(`${basePath}/v1/prontuarios-crud/${prontuarioId}/audio-url`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAudioUrl(data.audio_url);
      }
    } catch (err) {
      console.error('Erro ao carregar áudio:', err);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Salvar rascunho
  const handleSaveRascunho = async () => {
    if (!prontuario) return;

    try {
      setIsSaving(true);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const basePath = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || '/api/edge';
      const response = await fetch(`${basePath}/v1/prontuarios-crud/${prontuarioId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conteudo_rascunho: editContent
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar rascunho');
      }

      // Atualizar estado local
      setProntuario(prev => prev ? {
        ...prev,
        conteudo_rascunho: editContent,
        data_ultima_modificacao: new Date().toISOString()
      } : null);

      setIsEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsSaving(false);
    }
  };

  // Finalizar prontuário
  const handleFinalizar = async () => {
    if (!prontuario || !editContent.trim()) {
      alert('Conteúdo não pode estar vazio');
      return;
    }

    if (!confirm('Tem certeza que deseja finalizar este prontuário? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setIsSaving(true);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const basePath = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || '/api/edge';
      const response = await fetch(`${basePath}/v1/prontuarios-crud/${prontuarioId}/finalizar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conteudo_finalizado: editContent
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao finalizar prontuário');
      }

      // Recarregar dados
      await loadProntuario();
      setIsEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (prontuarioId) {
      loadProntuario();
    }
  }, [prontuarioId]);

  // Auto-refresh para prontuários em processamento
  useEffect(() => {
    if (!prontuario) return;
    
    const isProcessing = ['PENDENTE_UPLOAD_STORAGE', 'AGUARDANDO_PROCESSAMENTO_N8N', 'PROCESSANDO_N8N'].includes(prontuario.status_prontuario);
    
    if (isProcessing) {
      const interval = setInterval(() => {
        loadProntuario();
      }, 5000); // Verifica a cada 5 segundos
      
      return () => clearInterval(interval);
    }
  }, [prontuario?.status_prontuario]);

  useEffect(() => {
    if (prontuario && prontuario.audio_original_filename) {
      loadAudioUrl();
    }
  }, [prontuario]);

  const formatCPF = (cpf: string): string => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const canEdit = (): boolean => {
    return prontuario ? ['RASCUNHO_DISPONIVEL', 'FINALIZADO'].includes(prontuario.status_prontuario) : false;
  };

  const canFinalize = (): boolean => {
    return prontuario?.status_prontuario === 'RASCUNHO_DISPONIVEL';
  };

  const getContentToShow = (): string => {
    if (!prontuario) return '';
    
    if (prontuario.status_prontuario === 'FINALIZADO' && prontuario.conteudo_finalizado) {
      return prontuario.conteudo_finalizado;
    }
    
    return prontuario.conteudo_rascunho || '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando prontuário...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Erro</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/prontuarios')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Voltar para Lista
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!prontuario) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="px-4 py-5 sm:px-6">
            {/* Breadcrumbs */}
            <nav className="flex mb-4" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <button
                    onClick={() => router.push('/prontuarios')}
                    className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600"
                  >
                    🏥 Prontuários
                  </button>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                    </svg>
                    <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                      {prontuario.nome_paciente}
                    </span>
                  </div>
                </li>
              </ol>
            </nav>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/prontuarios')}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold leading-tight text-gray-900">
                    📋 {prontuario.nome_paciente}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    CPF: {formatCPF(prontuario.cpf_paciente)} • Consulta: {formatDate(prontuario.data_consulta)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right text-xs text-gray-500">
                  ID: #{prontuario.id.slice(-6)}
                </div>
                <StatusBadge status={prontuario.status_prontuario} />
              </div>
            </div>
          </div>
        </div>

        {/* Informações e Áudio */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Card de Informações */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Informações da Consulta</h3>
              </div>
              <dl className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <dt className="text-sm font-medium text-gray-600">Arquivo de áudio</dt>
                  <dd className="text-sm text-gray-900 font-mono text-right max-w-xs truncate" title={prontuario.audio_original_filename}>
                    {prontuario.audio_original_filename}
                  </dd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <dt className="text-sm font-medium text-gray-600">Data de criação</dt>
                  <dd className="text-sm text-gray-900">{formatDateTime(prontuario.data_criacao)}</dd>
                </div>
                <div className="flex justify-between items-center py-2">
                  <dt className="text-sm font-medium text-gray-600">Última modificação</dt>
                  <dd className="text-sm text-gray-900">{formatDateTime(prontuario.data_ultima_modificacao)}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Card de Áudio */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <SpeakerWaveIcon className="h-5 w-5 text-green-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Áudio da Consulta</h3>
              </div>
              {isLoadingAudio ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600 mr-3"></div>
                  <span className="text-sm">Carregando áudio...</span>
                </div>
              ) : audioUrl ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <audio
                      ref={audioRef}
                      controls
                      className="w-full"
                      preload="metadata"
                    >
                      <source src={audioUrl} type="audio/webm" />
                      <source src={audioUrl} type="audio/mpeg" />
                      Seu navegador não suporta o elemento de áudio.
                    </audio>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    🎧 Clique em play para ouvir o áudio da consulta
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <SpeakerWaveIcon className="h-8 w-8 mr-3" />
                  <span className="text-sm">Áudio não disponível</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Erro de processamento */}
        {prontuario.status_prontuario === 'ERRO_PROCESSAMENTO' && prontuario.erro_processamento_msg && (
          <div className="bg-white shadow mt-6">
            <div className="border-l-4 border-red-400 bg-red-50 p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Erro no Processamento</h3>
                  <div className="mt-2 text-sm text-red-700">
                    {prontuario.erro_processamento_msg}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo aguardando processamento */}
        {['PENDENTE_UPLOAD_STORAGE', 'AGUARDANDO_PROCESSAMENTO_N8N', 'PROCESSANDO_N8N'].includes(prontuario.status_prontuario) && (
          <div className="bg-white shadow mt-6">
            <div className="px-4 py-5 sm:px-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mx-auto"></div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Processando...</h3>
              <p className="mt-1 text-sm text-gray-500">
                O prontuário está sendo processado pela IA. O conteúdo estará disponível em breve.
              </p>
            </div>
          </div>
        )}

        {/* Transcrição bruta (apenas se houver e estiver em rascunho) */}
        {prontuario.conteudo_transcricao_bruta && prontuario.status_prontuario === 'RASCUNHO_DISPONIVEL' && (
          <div className="bg-white shadow mt-6">
            <div className="px-4 py-5 sm:px-6">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setTranscricaoExpandida(!transcricaoExpandida)}
              >
                <h3 className="text-lg font-medium text-gray-900">Transcrição Bruta</h3>
                <button className="text-gray-500 hover:text-gray-700">
                  {transcricaoExpandida ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </div>
              
              {transcricaoExpandida && (
                <div className="bg-gray-50 rounded-md p-4 mt-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                    {prontuario.conteudo_transcricao_bruta}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conteúdo do prontuário */}
        {(prontuario.status_prontuario === 'RASCUNHO_DISPONIVEL' || prontuario.status_prontuario === 'FINALIZADO') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${prontuario.status_prontuario === 'FINALIZADO' ? 'bg-green-100' : 'bg-blue-100'}`}>
                    <DocumentTextIcon className={`h-5 w-5 ${prontuario.status_prontuario === 'FINALIZADO' ? 'text-green-600' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {prontuario.status_prontuario === 'FINALIZADO' ? '📋 Prontuário Finalizado' : '📝 Rascunho do Prontuário'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {prontuario.status_prontuario === 'FINALIZADO' 
                        ? 'Documento médico oficial' 
                        : 'Documento em revisão - pode ser editado'
                      }
                    </p>
                  </div>
                </div>
                {canEdit() && (
                  <div className="flex space-x-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setEditContent(getContentToShow());
                          }}
                          disabled={isSaving}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          Cancelar
                        </button>
                        <button
                          onClick={handleSaveRascunho}
                          disabled={isSaving}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {isSaving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1"></div>
                          ) : (
                            <CheckIcon className="h-4 w-4 mr-1" />
                          )}
                          Salvar Rascunho
                        </button>
                        {canFinalize() && (
                          <button
                            onClick={handleFinalizar}
                            disabled={isSaving}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            {isSaving ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1"></div>
                            ) : (
                              <DocumentTextIcon className="h-4 w-4 mr-1" />
                            )}
                            Finalizar
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                      >
                        ✏️ Editar
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              {isEditing ? (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Conteúdo do Prontuário (Markdown)
                  </label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={20}
                    className="block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                    placeholder="Digite o conteúdo do prontuário em formato Markdown..."
                  />
                  <p className="text-xs text-gray-500">
                    💡 Use **negrito**, *itálico*, ## Títulos, - listas e outras formatações Markdown
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  {getContentToShow() ? (
                    <div className="prose prose-blue max-w-none">
                      <style jsx global>{`
                        .prose h1 { 
                          font-size: 1.5rem; 
                          font-weight: 700; 
                          color: #1f2937; 
                          margin-bottom: 1rem; 
                          padding-bottom: 0.5rem;
                          border-bottom: 2px solid #e5e7eb;
                        }
                        .prose h2 { 
                          font-size: 1.25rem; 
                          font-weight: 600; 
                          color: #374151; 
                          margin-top: 1.5rem; 
                          margin-bottom: 0.75rem; 
                          padding-left: 0.5rem;
                          border-left: 4px solid #3b82f6;
                        }
                        .prose h3 { 
                          font-size: 1.1rem; 
                          font-weight: 600; 
                          color: #4b5563; 
                          margin-top: 1rem; 
                          margin-bottom: 0.5rem; 
                        }
                        .prose p { 
                          color: #4b5563; 
                          line-height: 1.6; 
                          margin-bottom: 0.75rem; 
                        }
                        .prose ul { 
                          margin-left: 1rem !important;
                          margin-bottom: 1rem !important;
                          list-style-type: disc !important;
                          padding-left: 1.5rem !important;
                        }
                        .prose ol { 
                          margin-left: 1rem !important;
                          margin-bottom: 1rem !important;
                          list-style-type: decimal !important;
                          padding-left: 1.5rem !important;
                        }
                        .prose li { 
                          margin-bottom: 0.25rem !important; 
                          color: #4b5563 !important;
                          display: list-item !important;
                          margin-left: 0 !important;
                        }
                        .prose strong { 
                          font-weight: 600; 
                          color: #1f2937; 
                        }
                        .prose em { 
                          font-style: italic; 
                          color: #6b7280; 
                        }
                        .prose code { 
                          background-color: #f3f4f6; 
                          padding: 0.125rem 0.25rem; 
                          border-radius: 0.25rem; 
                          font-family: 'Courier New', monospace;
                          font-size: 0.875rem;
                        }
                      `}</style>
                      <ReactMarkdown>
                        {getContentToShow()}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic text-center py-8">Conteúdo não disponível</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProntuarioDetailPage; 