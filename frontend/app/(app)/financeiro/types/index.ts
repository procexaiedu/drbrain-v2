export interface Cobranca {
  id: string;
  medico_id: string;
  paciente_id: string | null;
  servico_id: string | null;
  produto_id: string | null;
  descricao: string;
  valor: number;
  data_vencimento: string;
  status_cobranca: 'PENDENTE' | 'PAGO' | 'VENCIDO' | 'CANCELADO' | 'ESTORNADO';
  metodo_pagamento: string | null; // Ex: 'PIX', 'BOLETO', 'CARTAO_CREDITO'
  asaas_charge_id: string | null;
  asaas_invoice_id: string | null;
  link_pagamento: string | null;
  qr_code_pix_base64: string | null;
  data_pagamento: string | null;
  created_at: string;
  updated_at: string;
  pacientes?: { nome_completo: string } | null; // Para join
  servicos?: { nome_servico: string } | null; // Para join
  produtos?: { nome_produto: string } | null; // Para join
}

export interface TransacaoFinanceira {
  id: string;
  medico_id: string;
  tipo_transacao: 'RECEITA' | 'DESPESA';
  descricao: string;
  valor: number;
  data_transacao: string;
  categoria: string | null;
  meio_pagamento: string | null;
  comprovante_url: string | null;
  cobranca_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssinaturaRecorrente {
  id: string;
  medico_id: string;
  paciente_id: string;
  servico_id: string;
  valor_recorrencia: number;
  periodo_recorrencia: 'DIARIO' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  data_inicio: string;
  data_proxima_cobranca: string | null;
  status_assinatura: 'ATIVA' | 'PAUSADA' | 'CANCELADA' | 'CONCLUIDA';
  asaas_subscription_id: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  pacientes?: { nome_completo: string } | null; // Para join
  servicos?: { nome_servico: string } | null; // Para join
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}
