
-- Tabela para armazenar dados de formulários de pré-consulta
CREATE TABLE public.formularios_pre_consulta (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    medico_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    data_consulta DATE NOT NULL, -- Data da consulta à qual o formulário se refere
    status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PREENCHIDO', 'REVISADO')),
    conteudo_json JSONB NULL, -- Dados do formulário em formato JSON
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT formularios_pre_consulta_pkey PRIMARY KEY (id)
);

ALTER TABLE public.formularios_pre_consulta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Medico_own_formularios_pre_consulta_access"
ON public.formularios_pre_consulta
FOR ALL
USING (auth.uid() = medico_id)
WITH CHECK (auth.uid() = medico_id);

CREATE TRIGGER update_formularios_pre_consulta_updated_at
BEFORE UPDATE ON public.formularios_pre_consulta
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_formularios_pre_consulta_medico_id ON public.formularios_pre_consulta(medico_id);
CREATE INDEX IF NOT EXISTS idx_formularios_pre_consulta_paciente_id ON public.formularios_pre_consulta(paciente_id);
CREATE INDEX IF NOT EXISTS idx_formularios_pre_consulta_data_consulta ON public.formularios_pre_consulta(data_consulta);
