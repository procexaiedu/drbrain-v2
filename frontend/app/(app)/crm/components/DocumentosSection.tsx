'use client';

import React, { useState } from 'react';
import { 
  DocumentArrowUpIcon, 
  DocumentArrowDownIcon, 
  TrashIcon,
  EyeIcon,
  PaperClipIcon 
} from '@heroicons/react/24/outline';
import { useDocumentosContato, useUploadDocumento, useDownloadDocumento, useDeleteDocumento } from '../hooks/useDocumentos';
import { DocumentoContato } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DocumentosSectionProps {
  contatoId: string;
  tipoContato: 'lead' | 'paciente';
  nomeContato: string;
}

export default function DocumentosSection({ contatoId, tipoContato, nomeContato }: DocumentosSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDescription, setUploadDescription] = useState('');
  
  const { data: documentosData, isLoading, error } = useDocumentosContato(contatoId, tipoContato);
  const uploadMutation = useUploadDocumento();
  const downloadMutation = useDownloadDocumento();
  const deleteMutation = useDeleteDocumento();

  const documentos = documentosData?.data || [];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await uploadMutation.mutateAsync({
        contatoId,
        tipoContato,
        documentoData: {
          file,
          descricao_documento: uploadDescription.trim() || undefined,
        },
      });
      setUploadDescription('');
      // Reset input
      event.target.value = '';
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (documentoId: string) => {
    try {
      await downloadMutation.mutateAsync(documentoId);
    } catch (error) {
      console.error('Erro no download:', error);
    }
  };

  const handleDelete = async (documentoId: string, nomeArquivo: string) => {
    if (!confirm(`Tem certeza que deseja excluir o documento "${nomeArquivo}"?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(documentoId);
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };



  const getFileIcon = (tipoArquivo?: string) => {
    if (!tipoArquivo) return '📎';
    
    if (tipoArquivo.includes('image')) {
      return '🖼️';
    } else if (tipoArquivo.includes('pdf')) {
      return '📄';
    } else if (tipoArquivo.includes('word')) {
      return '📝';
    } else if (tipoArquivo.includes('excel') || tipoArquivo.includes('spreadsheet')) {
      return '📊';
    } else {
      return '📎';
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">
          Erro ao carregar documentos: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <PaperClipIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">
            Documentos de {nomeContato}
          </h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {documentos.length}
          </span>
        </div>
      </div>

      {/* Upload de arquivo */}
      <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
        <div className="text-center">
          <DocumentArrowUpIcon className="mx-auto h-8 w-8 text-gray-400" />
          <div className="mt-2">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                {isUploading ? 'Enviando...' : 'Clique para enviar um arquivo'}
              </span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                onChange={handleFileUpload}
                disabled={isUploading}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
              />
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            PDF, Word, Excel, TXT, Imagens • Máx. 5MB
          </p>
        </div>

        <div className="mt-3">
          <input
            type="text"
            placeholder="Descrição do documento (opcional)"
            value={uploadDescription}
            onChange={(e) => setUploadDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={isUploading}
          />
        </div>
      </div>

      {/* Lista de documentos */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Carregando documentos...</p>
        </div>
      ) : documentos.length === 0 ? (
        <div className="text-center py-8">
          <PaperClipIcon className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">
            Nenhum documento anexado ainda
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documentos.map((documento) => (
            <div
              key={documento.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <span className="text-2xl">
                  {getFileIcon(documento.tipo_arquivo)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {documento.nome_arquivo_original}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>
                      {format(new Date(documento.data_upload), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                  {documento.descricao_documento && (
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {documento.descricao_documento}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleDownload(documento.id)}
                  disabled={downloadMutation.isPending}
                  className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                  title="Baixar documento"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(documento.id, documento.nome_arquivo_original)}
                  disabled={deleteMutation.isPending}
                  className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                  title="Excluir documento"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 