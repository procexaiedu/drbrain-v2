-- Adiciona 'evolution_api' ao tipo ENUM da coluna 'provider' em medico_oauth_tokens
DO $$
BEGIN
    -- Se o tipo ENUM ainda não existe, crie-o com todos os valores conhecidos
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'provider_enum' AND typcategory = 'E'
    ) THEN
        CREATE TYPE provider_enum AS ENUM ('google_calendar', 'asaas', 'evolution_api');
        -- Altera o tipo da coluna com cast explícito
        ALTER TABLE public.medico_oauth_tokens ALTER COLUMN provider TYPE provider_enum USING provider::text::provider_enum;
    ELSE
        -- Se o tipo ENUM já existe, adicione os novos valores se ainda não existirem
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'provider_enum') AND enumlabel = 'asaas'
        ) THEN
            ALTER TYPE provider_enum ADD VALUE 'asaas';
        END IF;
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'provider_enum') AND enumlabel = 'evolution_api'
        ) THEN
            ALTER TYPE provider_enum ADD VALUE 'evolution_api';
        END IF;
    END IF;
END$$;


-- Garante que a tabela de tokens tenha as colunas necessárias para a Evolution API
ALTER TABLE public.medico_oauth_tokens
ADD COLUMN IF NOT EXISTS instance_name TEXT,
ADD COLUMN IF NOT EXISTS connection_status TEXT DEFAULT 'disconnected';
COMMENT ON COLUMN public.medico_oauth_tokens.instance_name IS 'Nome da instância na Evolution API (ex: drbrain_{medico_id})';
COMMENT ON COLUMN public.medico_oauth_tokens.connection_status IS 'Status da conexão (ex: connected, disconnected, connecting)';

-- Cria a tabela para agrupar conversas por contato
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    medico_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_jid TEXT NOT NULL,
    contact_name TEXT,
    last_message_at TIMESTAMPTZ,
    unread_messages INT DEFAULT 0,
    CONSTRAINT unique_medico_contact UNIQUE (medico_id, contact_jid)
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

-- Política: Médicos podem acessar suas próprias conversas
CREATE POLICY "Medicos podem acessar suas proprias conversas"
ON public.whatsapp_conversations
FOR ALL
USING (auth.uid() = medico_id)
WITH CHECK (auth.uid() = medico_id);

CREATE INDEX IF NOT EXISTS idx_conversations_medico_id ON public.whatsapp_conversations (medico_id);

-- Cria a tabela para armazenar cada mensagem individual
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message_content TEXT,
    message_type TEXT NOT NULL DEFAULT 'text',
    sent_by TEXT NOT NULL CHECK (sent_by IN ('ia', 'contact', 'medico')),
    sent_at TIMESTAMPTZ NOT NULL,
    message_api_id TEXT -- ID da mensagem na API do WhatsApp, para referência e deleção
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Política: Médicos podem acessar suas próprias mensagens
CREATE POLICY "Medicos podem acessar suas proprias mensagens"
ON public.whatsapp_messages
FOR ALL
USING (auth.uid() = medico_id)
WITH CHECK (auth.uid() = medico_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.whatsapp_messages (conversation_id); 