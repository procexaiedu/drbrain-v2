-- Migração: Substituir ENUM por Tabela de Lookup para Provedores em medico_oauth_tokens

-- 1. Cria a tabela public.providers se não existir
CREATE TABLE IF NOT EXISTS public.providers (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE
);

-- 2. Popula a tabela public.providers com provedores conhecidos (idempotente)
INSERT INTO public.providers (name) VALUES
('google_calendar'),
('asaas'),
('evolution_api')
ON CONFLICT (name) DO NOTHING;

-- 3. Adiciona a nova coluna new_provider_id em medico_oauth_tokens, temporariamente nula
ALTER TABLE public.medico_oauth_tokens
ADD COLUMN IF NOT EXISTS new_provider_id UUID;

-- 4. Atualiza new_provider_id com base nos nomes existentes de provedores
--    Esta etapa garante a migração dos dados existentes.
UPDATE public.medico_oauth_tokens AS mot
SET new_provider_id = p.id
FROM public.providers AS p
WHERE mot.provider = p.name; -- Usa a coluna TEXT existente para fazer o JOIN

-- 5. Torna new_provider_id NOT NULL (após garantir que todos os campos foram preenchidos)
--    Se houver dados que não correspondem, isso falhará. 
--    Considerando que listamos os provedores existentes, isso deve ser seguro.
ALTER TABLE public.medico_oauth_tokens
ALTER COLUMN new_provider_id SET NOT NULL;

-- 6. Adiciona a chave estrangeira
ALTER TABLE public.medico_oauth_tokens
ADD CONSTRAINT fk_provider
FOREIGN KEY (new_provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;

-- 7. Remove a coluna antiga 'provider' (TEXT)
ALTER TABLE public.medico_oauth_tokens
DROP COLUMN IF EXISTS provider;

-- 8. Renomeia new_provider_id para provider
ALTER TABLE public.medico_oauth_tokens
RENAME COLUMN new_provider_id TO provider;

-- 9. Adiciona/Garante as colunas instance_name e connection_status
--    (Removido da migração anterior para evitar conflito com a alteração do tipo 'provider')
ALTER TABLE public.medico_oauth_tokens
ADD COLUMN IF NOT EXISTS instance_name TEXT,
ADD COLUMN IF NOT EXISTS connection_status TEXT DEFAULT 'disconnected';
COMMENT ON COLUMN public.medico_oauth_tokens.instance_name IS 'Nome da instância na Evolution API (ex: drbrain_{medico_id})';
COMMENT ON COLUMN public.medico_oauth_tokens.connection_status IS 'Status da conexão (ex: connected, disconnected, connecting)';

-- Cria a tabela para agrupar conversas por contato (copiado da migração anterior)
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

-- Cria a tabela para armazenar cada mensagem individual (copiado da migração anterior)
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