export interface Produto {
  id: string;
  medico_id: string;
  tipo_produto: 'Medicamento' | 'Insumo' | 'Outro';
  nome_produto: string;
  principio_ativo: string | null;
  categoria_regulatoria: string | null;
  numero_registro_anvisa: string | null;
  empresa_detentora_registro: string | null;
  codigo_barras: string | null;
  preco_venda: number;
  custo_aquisicao: number;
  fornecedor_id: string | null;
  estoque_atual: number;
  estoque_minimo: number;
  localizacao_estoque: string | null;
  created_at: string;
  updated_at: string;
  fornecedores?: { nome_fornecedor: string } | null; // Para join
}

export interface Servico {
  id: string;
  medico_id: string;
  nome_servico: string;
  descricao_servico: string | null;
  preco_servico: number;
  duracao_estimada_minutos: number | null;
  created_at: string;
  updated_at: string;
}

export interface Fornecedor {
  id: string;
  medico_id: string;
  nome_fornecedor: string;
  contato_principal: string | null;
  telefone: string | null;
  email: string | null;
  cnpj: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoteProduto {
  id: string;
  produto_id: string;
  medico_id: string;
  numero_lote: string | null;
  data_validade: string;
  quantidade_lote: number;
  data_entrada: string;
  created_at: string;
  updated_at: string;
  produtos?: { nome_produto: string } | null; // Para join
}

export interface MovimentacaoEstoque {
  id: string;
  medico_id: string;
  produto_id: string;
  lote_id: string | null;
  tipo_movimentacao: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
  quantidade: number;
  data_movimentacao: string;
  origem_destino: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  produtos?: { nome_produto: string } | null; // Para join
  lotes_produtos?: { numero_lote: string } | null; // Para join
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}
