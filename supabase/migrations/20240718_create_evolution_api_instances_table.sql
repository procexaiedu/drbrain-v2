
-- Tabela para armazenar informações da instância da EvolutionAPI de cada médico
CREATE TABLE public.medico_evolution_api_instances (
    medico_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    instance_name TEXT NOT NULL, -- Nome da instância (geralmente um UUID ou hash)
    api_key TEXT NOT NULL, -- Chave da API da instância (deve ser encriptada)
    webhook_url TEXT NULL, -- URL do webhook configurado na EvolutionAPI para esta instância
    status TEXT NOT NULL DEFAULT 'DISCONNECTED' CHECK (status IN ('CONNECTED', 'DISCONNECTED', 'QRCODE', 'TIMEOUT', 'ERROR')),
    qr_code_base64 TEXT NULL, -- QR Code em base64 para conexão inicial
    last_connected_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT medico_evolution_api_instances_pkey PRIMARY KEY (medico_id)
);

ALTER TABLE public.medico_evolution_api_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Medico_own_evolution_api_instances_access"
ON public.medico_evolution_api_instances
FOR ALL
USING (auth.uid() = medico_id)
WITH CHECK (auth.uid() = medico_id);

CREATE TRIGGER update_medico_evolution_api_instances_updated_at
BEFORE UPDATE ON public.medico_evolution_api_instances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
