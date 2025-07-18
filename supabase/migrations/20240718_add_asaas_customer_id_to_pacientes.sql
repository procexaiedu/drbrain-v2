
-- Adicionar coluna asaas_customer_id à tabela pacientes
ALTER TABLE public.pacientes
ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT UNIQUE NULL;

-- Criar índice para a nova coluna
CREATE INDEX IF NOT EXISTS idx_pacientes_asaas_customer_id ON public.pacientes(asaas_customer_id);
