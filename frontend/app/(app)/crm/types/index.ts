// Tipos para Leads
export interface Lead {
  id: string;
  medico_id: string;
  nome_lead: string;
  telefone_principal: string;
  email_lead?: string;
  origem_lead?: string;
  status_funil_lead: LeadStatus;
  motivo_perda_lead?: string;
  data_ultima_atualizacao_status?: string;
  notas_internas_lead?: string;
  paciente_id_convertido?: string;
  created_at: string;
  updated_at: string;
}

export type LeadStatus = 
  | 'Novo Lead'
  | 'Contato Inicial'
  | 'Interesse em Agendamento'
  | 'Consulta Marcada'
  | 'Convertido'
  | 'Perdido';

// Tipos para Pacientes
export interface Paciente {
  id: string;
  medico_id: string;
  nome_completo: string;
  cpf?: string;
  email_paciente?: string;
  data_nascimento?: string;
  sexo?: 'M' | 'F' | 'Outro';
  endereco_completo_json?: EnderecoCompleto;
  status_paciente: PacienteStatus;
  notas_gerais_paciente?: string;
  lead_origem_id?: string;
  data_cadastro_paciente?: string;
  telefone_principal?: string;
  updated_at: string;
}

export type PacienteStatus = 
  | 'Paciente Ativo'
  | 'Paciente Inativo'
  | 'Paciente Arquivado';

export interface EnderecoCompleto {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
}

// Tipos para Documentos
export interface DocumentoContato {
  id: string;
  medico_id: string;
  lead_id?: string;
  paciente_id?: string;
  nome_arquivo_original: string;
  tipo_arquivo?: string;
  storage_path: string;
  data_upload: string;
  descricao_documento?: string;
  created_at: string;
  updated_at: string;
}

// Tipos para formulários
export interface LeadFormData {
  nome_lead: string;
  telefone_principal: string;
  email_lead?: string;
  origem_lead?: string;
  status_funil_lead: LeadStatus;
  notas_internas_lead?: string;
}

export interface NewLeadData {
  nome_lead: string;
  telefone_principal: string;
  email_lead?: string;
  origem_lead?: string;
  status_funil_lead: LeadStatus;
  notas_internas_lead?: string;
}

export interface UpdateLeadData {
  nome_lead?: string;
  telefone_principal?: string;
  email_lead?: string;
  origem_lead?: string;
  status_funil_lead?: LeadStatus;
  notas_internas_lead?: string;
  motivo_perda_lead?: string;
}

export interface PacienteFormData {
  nome_completo: string;
  cpf?: string;
  email_paciente?: string;
  telefone_principal?: string;
  data_nascimento?: string;
  sexo?: 'M' | 'F' | 'Outro';
  endereco_completo_json?: EnderecoCompleto;
  status_paciente: PacienteStatus;
  notas_gerais_paciente?: string;
}

// Tipos para upload de documentos
export interface DocumentoUploadData {
  file: File;
  tipo_arquivo?: string;
  descricao_documento?: string;
}

// Tipos para API responses
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total?: number;
  hasMore?: boolean;
}

// Constantes para status
export const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'Novo Lead', label: 'Novo Lead', color: 'blue' },
  { value: 'Contato Inicial', label: 'Contato Inicial', color: 'yellow' },
  { value: 'Interesse em Agendamento', label: 'Interesse em Agendamento', color: 'purple' },
  { value: 'Consulta Marcada', label: 'Consulta Marcada', color: 'orange' },
  { value: 'Convertido', label: 'Convertido', color: 'green' },
  { value: 'Perdido', label: 'Perdido', color: 'red' },
];

export const PACIENTE_STATUS_OPTIONS: { value: PacienteStatus; label: string; color: string }[] = [
  { value: 'Paciente Ativo', label: 'Paciente Ativo', color: 'green' },
  { value: 'Paciente Inativo', label: 'Paciente Inativo', color: 'yellow' },
  { value: 'Paciente Arquivado', label: 'Paciente Arquivado', color: 'gray' },
];

export const ORIGEM_LEAD_OPTIONS = [
  'Site',
  'Redes Sociais',
  'Indicação',
  'Google Ads',
  'Facebook Ads',
  'WhatsApp',
  'Telefone',
  'Email',
  'Evento',
  'Outros'
];

export const MOTIVO_PERDA_OPTIONS = [
  'Preço muito alto',
  'Não teve interesse',
  'Escolheu concorrente',
  'Não tem necessidade no momento',
  'Falta de orçamento',
  'Localização inadequada',
  'Outros'
]; 