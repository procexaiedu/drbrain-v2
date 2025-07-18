-- Tabela para registrar todas as cobranças geradas
CREATE TABLE public.cobrancas (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    medico_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    paciente_id uuid NULL REFERENCES public.pacientes(id) ON DELETE SET NULL,
    servico_id uuid NULL REFERENCES public.servicos(id) ON DELETE SET NULL, -- Se a cobrança for de um serviço
    produto_id uuid NULL REFERENCES public.produtos(id) ON DELETE SET NULL, -- Se a cobrança for de um produto
    descricao TEXT NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    status_cobranca TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status_cobranca IN ('PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO', 'ESTORNADO')),
    metodo_pagamento TEXT NULL, -- Ex: 'PIX', 'BOLETO', 'CARTAO_CREDITO'
    asaas_charge_id TEXT UNIQUE NULL, -- ID da cobrança no Asaas
    asaas_invoice_id TEXT UNIQUE NULL, -- ID da fatura no Asaas (se aplicável)
    link_pagamento TEXT NULL,
    qr_code_pix_base64 TEXT NULL, -- Base64 da imagem do QR Code Pix
    data_pagamento TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT cobrancas_pkey PRIMARY KEY (id)
);

ALTER TABLE public.cobrancas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Medico_own_cobrancas_access"
ON public.cobrancas
FOR ALL
USING (auth.uid() = medico_id)
WITH CHECK (auth.uid() = medico_id);

CREATE TRIGGER update_cobrancas_updated_at
BEFORE UPDATE ON public.cobrancas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_cobrancas_medico_id ON public.cobrancas(medico_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_paciente_id ON public.cobrancas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_status_cobranca ON public.cobrancas(status_cobranca);
CREATE INDEX IF NOT EXISTS idx_cobrancas_data_vencimento ON public.cobrancas(data_vencimento);

-- Tabela para registrar todas as receitas e despesas
CREATE TABLE public.transacoes_financeiras (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    medico_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo_transacao TEXT NOT NULL CHECK (tipo_transacao IN ('RECEITA', 'DESPESA')),
    descricao TEXT NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    data_transacao DATE NOT NULL,
    categoria TEXT NULL, -- Ex: 'Aluguel', 'Salário', 'Material', 'Consulta'
    meio_pagamento TEXT NULL, -- Ex: 'Dinheiro', 'Cartão', 'Transferência', 'Asaas'
    comprovante_url TEXT NULL, -- URL para comprovante no storage
    cobranca_id uuid NULL REFERENCES public.cobrancas(id) ON DELETE SET NULL, -- Se for uma receita de cobrança
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT transacoes_financeiras_pkey PRIMARY KEY (id)
);

ALTER TABLE public.transacoes_financeiras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Medico_own_transacoes_financeiras_access"
ON public.transacoes_financeiras
FOR ALL
USING (auth.uid() = medico_id)
WITH CHECK (auth.uid() = medico_id);

CREATE TRIGGER update_transacoes_financeiras_updated_at
BEFORE UPDATE ON public.transacoes_financeiras
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_transacoes_financeiras_medico_id ON public.transacoes_financeiras(medico_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_financeiras_tipo_transacao ON public.transacoes_financeiras(tipo_transacao);
CREATE INDEX IF NOT EXISTS idx_transacoes_financeiras_data_transacao ON public.transacoes_financeiras(data_transacao);

-- Tabela para gerenciar serviços recorrentes/assinaturas
CREATE TABLE public.assinaturas_recorrentes (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    medico_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    servico_id uuid NOT NULL REFERENCES public.servicos(id) ON DELETE CASCADE, -- Serviço que está sendo assinado
    valor_recorrencia NUMERIC(10, 2) NOT NULL,
    periodo_recorrencia TEXT NOT NULL CHECK (periodo_recorrencia IN ('DIARIO', 'SEMANAL', 'QUINZENAL', 'MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL')),
    data_inicio DATE NOT NULL,
    data_proxima_cobranca DATE NULL,
    status_assinatura TEXT NOT NULL DEFAULT 'ATIVA' CHECK (status_assinatura IN ('ATIVA', 'PAUSADA', 'CANCELADA', 'CONCLUIDA')),
    asaas_subscription_id TEXT UNIQUE NULL, -- ID da assinatura no Asaas
    observacoes TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT assinaturas_recorrentes_pkey PRIMARY KEY (id)
);

ALTER TABLE public.assinaturas_recorrentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Medico_own_assinaturas_recorrentes_access"
ON public.assinaturas_recorrentes
FOR ALL
USING (auth.uid() = medico_id)
WITH CHECK (auth.uid() = medico_id);

CREATE TRIGGER update_assinaturas_recorrentes_updated_at
BEFORE UPDATE ON public.assinaturas_recorrentes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_assinaturas_recorrentes_medico_id ON public.assinaturas_recorrentes(medico_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_recorrentes_paciente_id ON public.assinaturas_recorrentes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_recorrentes_status_assinatura ON public.assinaturas_recorrentes(status_assinatura);