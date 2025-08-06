import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'prontuario' | 'lead' | 'paciente';
  className?: string;
}

export type ProntuarioStatus = 
  | 'PENDENTE_UPLOAD_STORAGE'
  | 'AGUARDANDO_PROCESSAMENTO_N8N' 
  | 'PROCESSANDO_N8N'
  | 'RASCUNHO_DISPONIVEL'
  | 'FINALIZADO'
  | 'ERRO_PROCESSAMENTO';

export type LeadStatus = 
  | 'Novo Lead'
  | 'Contato Inicial'
  | 'Interesse em Agendamento'
  | 'Consulta Marcada'
  | 'Convertido'
  | 'Perdido';

export type PacienteStatus = 
  | 'Paciente Ativo'
  | 'Paciente Inativo'
  | 'Paciente Arquivado';

const prontuarioStatusConfig: Record<ProntuarioStatus, { label: string; color: string }> = {
  'PENDENTE_UPLOAD_STORAGE': {
    label: 'Enviando áudio...',
    color: 'bg-gray-100 text-gray-800'
  },
  'AGUARDANDO_PROCESSAMENTO_N8N': {
    label: 'Aguardando processamento',
    color: 'bg-yellow-100 text-yellow-800'
  },
  'PROCESSANDO_N8N': {
    label: 'Processando IA',
    color: 'bg-blue-100 text-blue-800'
  },
  'RASCUNHO_DISPONIVEL': {
    label: 'Rascunho disponível',
    color: 'bg-indigo-100 text-indigo-800'
  },
  'FINALIZADO': {
    label: 'Finalizado',
    color: 'bg-green-100 text-green-800'
  },
  'ERRO_PROCESSAMENTO': {
    label: 'Erro no processamento',
    color: 'bg-red-100 text-red-800'
  }
};

const leadStatusConfig: Record<LeadStatus, { label: string; color: string }> = {
  'Novo Lead': {
    label: 'Novo Lead',
    color: 'bg-blue-100 text-blue-800'
  },
  'Contato Inicial': {
    label: 'Contato Inicial',
    color: 'bg-yellow-100 text-yellow-800'
  },
  'Interesse em Agendamento': {
    label: 'Interesse em Agendamento',
    color: 'bg-purple-100 text-purple-800'
  },
  'Consulta Marcada': {
    label: 'Consulta Marcada',
    color: 'bg-orange-100 text-orange-800'
  },
  'Convertido': {
    label: 'Convertido',
    color: 'bg-green-100 text-green-800'
  },
  'Perdido': {
    label: 'Perdido',
    color: 'bg-red-100 text-red-800'
  }
};

const pacienteStatusConfig: Record<PacienteStatus, { label: string; color: string }> = {
  'Paciente Ativo': {
    label: 'Ativo',
    color: 'bg-green-100 text-green-800'
  },
  'Paciente Inativo': {
    label: 'Inativo',
    color: 'bg-yellow-100 text-yellow-800'
  },
  'Paciente Arquivado': {
    label: 'Arquivado',
    color: 'bg-gray-100 text-gray-800'
  }
  };

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'prontuario', className = '' }) => {
  let config;
  
  switch (type) {
    case 'lead':
      config = leadStatusConfig[status as LeadStatus];
      break;
    case 'paciente':
      config = pacienteStatusConfig[status as PacienteStatus];
      break;
    case 'prontuario':
    default:
      config = prontuarioStatusConfig[status as ProntuarioStatus];
      break;
  }

  // Fallback para status não mapeados
  if (!config) {
    config = {
      label: status,
      color: 'bg-gray-100 text-gray-800'
    };
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} ${className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge; 