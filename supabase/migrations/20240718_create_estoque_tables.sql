-- Tabela para cadastrar os fornecedores (deve ser criada primeiro, pois produtos a referenciam)
CREATE TABLE public.fornecedores (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    medico_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_fornecedor TEXT NOT NULL,
    contato_principal TEXT NULL,
    telefone TEXT NULL,
    email TEXT NULL,
    cnpj TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fornecedores_pkey PRIMARY KEY (id)
);

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Medico_own_fornecedores_access"
ON public.fornecedores
FOR ALL
USING (auth.uid() = medico_id)
WITH CHECK (auth.uid() = medico_id);

CREATE TRIGGER update_fornecedores_updated_at
BEFORE UPDATE ON public.fornecedores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_fornecedores_medico_id ON public.fornecedores(medico_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_nome_fornecedor ON public.fornecedores(nome_fornecedor);

-- Tabela para armazenar informações sobre produtos físicos (medicamentos, insumos)
CREATE TABLE public.produtos (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    medico_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo_produto TEXT NOT NULL CHECK (tipo_produto IN ('Medicamento', 'Insumo', 'Outro')),
    nome_produto TEXT NOT NULL,
    principio_ativo TEXT NULL,
    categoria_regulatoria TEXT NULL,
    numero_registro_anvisa TEXT NULL,
    empresa_detentora_registro TEXT NULL,
    codigo_barras TEXT UNIQUE NULL, -- Pode ser nulo se o produto não tiver código de barras
    preco_venda NUMERIC(10, 2) NOT NULL,
    custo_aquisicao NUMERIC(10, 2) NOT NULL,
    fornecedor_id uuid NULL REFERENCES public.fornecedores(id) ON DELETE SET NULL,
    estoque_atual INTEGER NOT NULL DEFAULT 0,
    estoque_minimo INTEGER DEFAULT 0,
    localizacao_estoque TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT produtos_pkey PRIMARY KEY (id)
);

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Medico_own_produtos_access"
ON public.produtos
FOR ALL
USING (auth.uid() = medico_id)
WITH CHECK (auth.uid() = medico_id);

CREATE TRIGGER update_produtos_updated_at
BEFORE UPDATE ON public.produtos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_produtos_medico_id ON public.produtos(medico_id);
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_barras ON public.produtos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_produtos_nome_produto ON public.produtos(nome_produto);

-- Tabela para armazenar informações sobre serviços oferecidos (independente, mas necessária para financeiro)
CREATE TABLE public.servicos (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    medico_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_servico TEXT NOT NULL,
    descricao_servico TEXT NULL,
    preco_servico NUMERIC(10, 2) NOT NULL,
    duracao_estimada_minutos INTEGER NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT servicos_pkey PRIMARY KEY (id)
);

ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Medico_own_servicos_access"
ON public.servicos
FOR ALL
USING (auth.uid() = medico_id)
WITH CHECK (auth.uid() = medico_id);

CREATE TRIGGER update_servicos_updated_at
BEFORE UPDATE ON public.servicos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_servicos_medico_id ON public.servicos(medico_id);
CREATE INDEX IF NOT EXISTS idx_servicos_nome_servico ON public.servicos(nome_servico);

-- Tabela para gerenciar múltiplos lotes de um mesmo produto (referencia produtos)
CREATE TABLE public.lotes_produtos (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
    medico_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    numero_lote TEXT NULL,
    data_validade DATE NOT NULL,
    quantidade_lote INTEGER NOT NULL,
    data_entrada TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT lotes_produtos_pkey PRIMARY KEY (id)
);

ALTER TABLE public.lotes_produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Medico_own_lotes_produtos_access"
ON public.lotes_produtos
FOR ALL
USING (auth.uid() = medico_id)
WITH CHECK (auth.uid() = medico_id);

CREATE TRIGGER update_lotes_produtos_updated_at
BEFORE UPDATE ON public.lotes_produtos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_lotes_produtos_produto_id ON public.lotes_produtos(produto_id);
CREATE INDEX IF NOT EXISTS idx_lotes_produtos_medico_id ON public.lotes_produtos(medico_id);
CREATE INDEX IF NOT EXISTS idx_lotes_produtos_data_validade ON public.lotes_produtos(data_validade);

-- Tabela para registrar todas as entradas e saídas de produtos (referencia produtos e lotes_produtos)
CREATE TABLE public.movimentacoes_estoque (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    medico_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
    lote_id uuid NULL REFERENCES public.lotes_produtos(id) ON DELETE SET NULL,
    tipo_movimentacao TEXT NOT NULL CHECK (tipo_movimentacao IN ('ENTRADA', 'SAIDA', 'AJUSTE')),
    quantidade INTEGER NOT NULL,
    data_movimentacao TIMESTAMPTZ DEFAULT now(),
    origem_destino TEXT NULL, -- Ex: 'Compra', 'Venda', 'Descarte', 'Prontuario_ID: <uuid>'
    observacoes TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT movimentacoes_estoque_pkey PRIMARY KEY (id)
);

ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Medico_own_movimentacoes_estoque_access"
ON public.movimentacoes_estoque
FOR ALL
USING (auth.uid() = medico_id)
WITH CHECK (auth.uid() = medico_id);

CREATE TRIGGER update_movimentacoes_estoque_updated_at
BEFORE UPDATE ON public.movimentacoes_estoque
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_medico_id ON public.movimentacoes_estoque(medico_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_produto_id ON public.movimentacoes_estoque(produto_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_tipo_movimentacao ON public.movimentacoes_estoque(tipo_movimentacao);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_data_movimentacao ON public.movimentacoes_estoque(data_movimentacao);