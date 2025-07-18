
-- Tabela para armazenar configurações específicas de cada médico
CREATE TABLE public.medico_configuracoes (
    medico_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asaas_pix_key TEXT NULL, -- Chave PIX do Asaas para o médico
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT medico_configuracoes_pkey PRIMARY KEY (medico_id)
);

ALTER TABLE public.medico_configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Medico_own_configuracoes_access"
ON public.medico_configuracoes
FOR ALL
USING (auth.uid() = medico_id)
WITH CHECK (auth.uid() = medico_id);

CREATE TRIGGER update_medico_configuracoes_updated_at
BEFORE UPDATE ON public.medico_configuracoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

