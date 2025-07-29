Com certeza! Analisei o seu PRD e os documentos de apoio (`database_drbrain.txt` e `documentaçãoEVO.md`) e identifiquei exatamente os pontos de aprimoramento que você mencionou. O plano original é excelente e bem estruturado. A seguir, apresento uma versão robustecida do seu PRD, mantendo todo o conteúdo original e adicionando os detalhes técnicos cruciais extraídos da documentação para torná-lo mais preciso e acionável para a equipe de desenvolvimento.

As adições estão marcadas com `> **[Nota de Aprimoramento]**` para fácil identificação.

---

### **Documento de Requisitos e Implementação: Módulo de Gestão de WhatsApp (Versão Aprimorada)**

#### **1. Introdução e Objetivo**
Este documento detalha os requisitos e o plano de implementação para o Módulo de Gestão de WhatsApp no SaaS Dr. Brain. O objetivo principal é permitir que médicos conectem suas contas de WhatsApp à plataforma, habilitando uma Secretaria de IA personalizada (configurada no módulo "Playground" existente) para interagir automaticamente com os pacientes.
A integração visa automatizar a comunicação rotineira, otimizar o tempo do médico e de sua equipe, e fornecer uma interface unificada para monitoramento e intervenção manual, resultando em uma experiência de comunicação mais rápida e eficiente para os pacientes.

#### **2. Visão Geral do Módulo**
##### **2.1. Problema a Ser Resolvido**
Médicos e clínicas dedicam um tempo considerável respondendo a perguntas frequentes, agendando consultas, confirmando horários e gerenciando informações básicas de pacientes via WhatsApp. A personalização e a consistência nessas interações são frequentemente desafiadoras.

##### **2.2. Solução Proposta**
Um módulo de gestão de WhatsApp que oferece:
*   Conexão fácil da conta WhatsApp do médico via QR Code.
*   Integração com uma Secretaria de IA (LLM configurado no "Playground") para atendimento automatizado 24/7.
*   Uma interface de "Caixa de Entrada" no SaaS que replica a experiência do WhatsApp Web, permitindo ao médico monitorar conversas, visualizar históricos e intervir manualmente quando necessário.

##### **2.3. Stakeholders**
*   **Médicos/Clínicas:** Usuários finais que se beneficiarão da automação e da gestão centralizada do WhatsApp.
*   **Pacientes:** Terão uma experiência de comunicação mais rápida e eficiente e interações mais consistentes.

#### **3. Jornada do Usuário (UI/UX)**
O foco é criar uma experiência intuitiva e familiar para o médico, minimizando a curva de aprendizado e espelhando a usabilidade do WhatsApp Web.

##### **3.1. Conexão do WhatsApp do Médico (Onboarding)**
1.  **Acesso à Configuração:** O médico navega para uma nova seção dentro das "Configurações" ou "Conexões de Aplicativo" no SaaS, intitulada "Conectar WhatsApp".
2.  **Início do Pareamento:** Ao clicar em "Conectar", o sistema inicia o processo de criação de instância na Evolution API.
    > **[Nota de Aprimoramento]** Detalhe Técnico: Esta ação disparará uma chamada de backend para o endpoint `POST /instance/create` da Evolution API. O corpo da requisição deverá ser estruturado para criar uma instância padrão, sem integração com a API Cloud do WhatsApp:
    > ```json
    > {
    >   "instanceName": "drbrain_{medico_id}", // Ex: drbrain_5f50610b-30cf-45ec-9c5d-cc1daf2d402a
    >   "qrcode": true
    > }
    > ```
    > A utilização de um `instanceName` padronizado e único, como `drbrain_{medico_id}`, é crucial para associar inequivocamente a instância ao médico no nosso sistema.
3.  **Exibição do QR Code:** Um QR Code exclusivo é exibido na tela do SaaS. Instruções claras são fornecidas para o médico escanear o QR Code usando o aplicativo WhatsApp em seu celular (acessando "Aparelhos Conectados"). Detalhe Técnico: O QR Code não é obtido via uma chamada GET. Após a criação da instância, a Evolution API enviará o QR Code (em formato base64) através de um webhook com o evento `QRCODE_UPDATED`. O backend do Dr. Brain deverá escutar este evento e transmitir o QR Code para o frontend em tempo real.
4.  **Feedback de Conexão:** Após o escaneamento, o SaaS exibe um status em tempo real (Conectando..., Conectado!, Desconectado). Detalhe Técnico: O status será atualizado primariamente através do webhook `CONNECTION_UPDATE`. Para verificações manuais ou redundância, o backend pode consultar o endpoint `GET /instance/connectionState/{instance}`.
5.  **Confirmação:** Uma mensagem de sucesso e um ícone de status verde confirmam que a conexão foi estabelecida e a Secretaria de IA está ativa para aquele número.

##### **3.2. Visão Geral das Conversas (Painel de Gestão)**
Uma nova interface de "Caixa de Entrada WhatsApp" será adicionada ao SaaS, similar ao WhatsApp Web, permitindo que o médico e sua equipe:
*   Visualizem uma lista de todas as conversas ativas e recentes.
*   Cliquem em uma conversa para ver o histórico completo de mensagens (IA e paciente).
*   Enviem mensagens manualmente, se necessário.

##### **3.3. Requisitos de UI/UX e Wireframe Conceitual**
*   **Familiaridade:** A interface deve espelhar a usabilidade do WhatsApp Web, com lista de chats à esquerda e painel de conversa à direita.
*   **Status Visual:** Indicadores claros de status de conexão (online/offline) para o número do WhatsApp do médico.
*   **Histórico Consolidado:** O chat deve exibir claramente quem enviou a mensagem (paciente, IA, médico).
*   **Responsividade:** O módulo deve ser totalmente responsivo para desktop.
*   **Consistência Visual:** Seguir padrões de UI existentes do Dr. Brain para garantir uma experiência coesa.
*   **Wireframe Conceitual (Descrição):**
    *   **Sidebar Esquerda:** Lista de conversas, com foto de perfil do contato, nome, última mensagem e hora. Filtros por "Ativas", "Não lidas", "Minhas Conversas".
    *   **Painel Central:** Área de exibição da conversa, com balões de chat distintos para paciente, IA e médico. Campo de texto para digitação de mensagem e botão de envio.

#### **4. Plano de Implementação Detalhado**
Este manifesto detalha o plano de implementação completo para o Módulo de Gestão de WhatsApp. O objetivo é criar uma solução robusta e escalável com uma experiência de usuário impecável. A arquitetura foi refinada para maximizar a modularidade e o controle sobre os dados.

##### **4.1. Contexto Técnico e Arquitetura**
*   **Fonte da Verdade no Supabase:** Todo o histórico de conversas será armazenado em tabelas PostgreSQL dedicadas dentro do ecossistema Supabase, garantindo soberania e facilidade de integração com os demais módulos do Dr. Brain.
*   **EvolutionAPI como Gateway:** A EvolutionAPI, gerenciada via Docker, funcionará exclusivamente como um gateway de comunicação para o WhatsApp.
    *   **UI Nativa e Reativa:** A interface de chat será construída diretamente no frontend do Dr. Brain (Next.js), utilizando o Supabase Realtime para notificações instantâneas, garantindo uma experiência perfeitamente integrada e fluida.
*   **Orquestração Inteligente com n8n:** O n8n orquestrará o fluxo de mensagens de forma assíncrona, executando a lógica da IA e interagindo com o Supabase para persistência de dados.
*   **Detalhe Técnico Adicional (n8n):** A orquestração no n8n é construída visualmente (ou programaticamente) como um workflow, que é uma estrutura JSON definindo nodes (os blocos de ação, como "HTTP Request" ou "Postgres") e connections (as ligações que determinam o fluxo de dados entre os nós). Cada item de dados flui através do workflow encapsulado em um objeto com uma chave `json` e, opcionalmente, uma chave `binary`.

##### **4.1.# --- Configuração de Webhooks Globais ---**
*   `https://webh.procexai.tech/webhook/drBrainCentral` # URL do nosso orquestrador n8n
*   **Detalhe Técnico Adicional (n8n):** Este URL apontará para um nó "Webhook" no n8n. Este nó atua como o ponto de entrada do workflow, escutando por requisições POST. Ele automaticamente parseia o corpo da requisição (seja JSON, form-data, etc.) e o disponibiliza como a saída do nó, pronto para ser consumido pelos nós seguintes no fluxo.

##### **4.2. Infraestrutura Principal**
*   **Backend:** Supabase (PostgreSQL, Edge Functions em Deno/TypeScript, Auth, Realtime).
*   **Frontend:** Next.js / React.
*   **Automação:** n8n, com capacidade de construção de workflows via ferramentas n8n mcp.
*   **Detalhe Técnico Adicional (n8n):** O termo n8n mcp provavelmente refere-se a uma interface de linha de comando ou um conjunto de ferramentas customizadas para gerenciar n8n programaticamente. Conforme a documentação do n8n, o MCP Client Tool Node permite que um agente de IA se conecte a um "MCP server" via um endpoint SSE para consumir e utilizar um conjunto de ferramentas (outros nós ou workflows) de forma dinâmica.

##### **4.3. Esquema de Banco de Dados Relevante (Supabase - `database_drbrain.txt`)**
*   **public.medico_profiles:** Armazena os perfis dos médicos. Contém colunas como `id` (uuid), `nome_completo`, `email`, `nome_secretaria_ia`, etc.
*   **public.medico_secretaria_ia_prompts:** (Anteriormente `medico_ia_configs`) Armazena as configurações da IA para cada médico, incluindo `medico_id` (uuid), `prompt_texto_producao`, e `prompt_texto_laboratorio`. Esta será a fonte para o "System Prompt" da nossa Secretaria IA.
*   **public.medico_oauth_tokens:** Tabela centralizadora de credenciais. Será utilizada para armazenar os detalhes da conexão da Evolution API.
*   **public.n8n_*_drbrain:** Existem múltiplas tabelas para o histórico de memória dos agentes n8n (ex: `n8n_playground_drbrain`). Elas usam um campo `session_id` que corresponde ao `medico_id`.

##### **4.4. Módulos de Implementação (Sequenciais)**
###### **Módulo 1: Ambiente, Backend e Alinhamento de Dados**
*   **Objetivo:** Preparar a fundação da aplicação, configurando a EvolutionAPI e estruturando o banco de dados e as funções de backend no Supabase.
*   **Papéis:** IA Desenvolvedora (Full-Stack).
*   **Passos de Implementação:**
    1.      2.  **Preparar Backend do Supabase - Estrutura de Dados:**
        *   **Ação:** Alinhe a tabela `public.medico_oauth_tokens` para armazenar os dados da instância e crie as novas tabelas para conversas.
        *   **DDL a ser executado:**
            ```sql
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
            ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
            CREATE POLICY "Medicos podem acessar suas próprias conversas" ON public.whatsapp_conversations FOR ALL USING (auth.uid() = medico_id) WITH CHECK (auth.uid() = medico_id);
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
            ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
            CREATE POLICY "Medicos podem acessar suas próprias mensagens" ON public.whatsapp_messages FOR ALL USING (auth.uid() = medico_id) WITH CHECK (auth.uid() = medico_id);
            CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.whatsapp_messages (conversation_id);
            ```
    3. Desenvolver Backend do Supabase - Edge Functions (Versão Detalhada)
Ação: Crie duas Edge Functions modulares.
evolution-manager (supabase/functions/evolution-manager/index.ts):
Responsabilidade: Gerenciar o ciclo de vida da conexão com a EvolutionAPI.
Endpoints:
POST /connect:
Chama POST /instance/create na Evolution API com o payload { "instanceName": "drbrain_{medico_id}", "qrcode": true }.
Armazena o instanceName na tabela public.medico_oauth_tokens para o medico_id logado, com provider = 'evolution_api'.
Imediatamente após o sucesso, fazer uma chamada para POST /settings/set/{instanceName} na Evolution API com o seguinte payload para configurar o webhook da instância:
[Nota de Aprimoramento - Configuração do Webhook] Este payload é crucial e deve ser enviado para garantir que a instância comunique-se corretamente com o n8n.
Generated json
{
    "enabled": true,
    "url": "https://webh.procexai.tech/webhook/drBrainCentral",
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": [
        "QRCODE_UPDATED",
        "CONNECTION_UPDATE",
        "MESSAGES_UPSERT"
    ]
}
Use code with caution.
Json
GET /connection-status: Chama GET /instance/connectionState/{instance} na Evolution API.
DELETE /disconnect: Chama DELETE /instance/logout/{instance} e/ou DELETE /instance/delete/{instance} na Evolution API e atualiza a linha correspondente em medico_oauth_tokens.
whatsapp-chat (supabase/functions/whatsapp-chat/index.ts):
Responsabilidade: Servir como o BFF para a interface de chat.
Endpoints: GET /conversations, GET /messages, POST /send-message. A rota POST /send-message internamente chamará a API da Evolution para enviar a mensagem ao paciente..

###### **Módulo 2: Orquestração e Inteligência (n8n)**
*   **Objetivo:** Construir os workflows n8n que automatizarão o fluxo de mensagens.
*   **Papéis:** IA Desenvolvedora (com acesso ao n8n MCP).
*   **Passos de Implementação:**
    1.  **Construir Workflow 1: `[Production] EvolutionAPI - AI Message Handler`**
        *   **Ação:** Use `n8n_create_workflow` para criar o workflow que recebe, processa, persiste e responde às mensagens.
        *   **Fluxo Detalhado dos Nós:**
            1.  **Webhook:** Recebe o evento `messages.upsert`.
            2.  **IF (Validação):** Valida a API Key: `{{ $json.body.apikey }} === {{ $credentials.evolutionApi.apiKey }}`.
            3.  **Postgres (Fetch Medico e Prompt):** Busca o `medico_id` e o `prompt_texto_producao` a partir do `instance_name`. `SELECT p.id, ia.prompt_texto_producao FROM medico_profiles p JOIN medico_secretaria_ia_prompts ia ON p.id = ia.medico_id JOIN medico_oauth_tokens t ON p.id = t.medico_id WHERE t.instance_name = '{{ $json.body.instance }}'`.
            4.  **Postgres (Persistir Mensagem):** Insere a mensagem do paciente na tabela `whatsapp_messages`.
            5.  **LLM Call (IA):** Envia a mensagem do paciente e o prompt do médico para o modelo de linguagem.
            6.  **Postgres (Persistir Resposta IA):** Insere a resposta da IA na tabela `whatsapp_messages`.
            7.  **HTTP Request (Enviar Resposta):** Envia a resposta para o paciente.
        *   **NÓ CRUCIAL:**
            *   **Nó 7: "Send Reply to Patient" (HTTP Request)** - Envia a resposta para o paciente via `POST https://evolution2.procexai.tech/message/sendText/{instance}`. O corpo da requisição deve ser:
                ```json
                {
                    "number": "{{ $json.body.data.key.remoteJid }}",
                    "options": {
                        "delay": 1200
                    },
                    "textMessage": {
                        "text": "{{ $('LLM Call (IA)').item.json.answer }}"
                    }
                }
                ```
    2.  **Construir Workflow 2: `[Production] EvolutionAPI - Connection Status Handler`**
        *   **Ação:** Use `n8n_create_workflow` para criar o workflow de utilidade que atualiza o status da conexão no Supabase.
        *   **Detalhe Técnico Adicional (n8n):** Este workflow terá um nó "Webhook" como gatilho, seguido por um nó "Postgres". O nó Postgres executará uma query `UPDATE` na tabela `public.medico_oauth_tokens`. Para segurança, a query deve ser parametrizada: `UPDATE public.medico_oauth_tokens SET connection_status = $1 WHERE instance_name = $2;`. Os valores para `$1` e `$2` serão preenchidos no campo "Query Parameters" com expressões n8n, como `{{ [$json.body.data.state, $json.body.instance] }}`, prevenindo SQL Injection.

###### **Módulo 3: Frontend e User Interface (Next.js)**
*   **Objetivo:** Construir a interface do usuário no SaaS, permitindo a conexão e a visualização das conversas em tempo real.
*   **Papéis:** IA Desenvolvedora (Frontend).
*   **Passos de Implementação:**
    1.  **Implementar Página de Conexões:**
        *   Crie o componente `WhatsappConnectionCard.tsx`.
        *   Use `react-query` para chamar a Edge Function `GET /evolution-manager/connection-status`.
        *   Implemente o fluxo de conexão que exibe o QR Code (recebido via WebSocket/Realtime do backend) em um modal.
    2.  **Construir Caixa de Entrada do WhatsApp:**
        *   Crie a rota e a página em `app/(app)/whatsapp/page.tsx`.
        *   Desenvolva os componentes `ChatList.tsx`, `ChatWindow.tsx`, e `MessageInput.tsx`, que devem consumir os dados das Edge Functions do `whatsapp-chat`.
    3.  **Implementar Funcionalidade de Tempo Real:**
        *   Na UI, utilize o cliente Supabase para se inscrever em eventos `INSERT` na tabela `whatsapp_messages` via Supabase Realtime, filtrando pelo `medico_id`.
        *   No callback da inscrição, invalide o cache do `react-query` (`invalidateQueries`) para que a UI busque o histórico de chat atualizado e exiba a nova mensagem instantaneamente.

###### **Módulo 4: Segurança e Otimização**
*   **Objetivo:** Garantir a robustez, segurança e performance do módulo.
*   **Papéis:** IA Desenvolvedora (Full-Stack).
*   **Passos de Implementação:**
    1.  **Aplicar RLS (Row Level Security) Crítico:**
        *   Valide que as políticas de RLS nas novas tabelas `whatsapp_conversations` e `whatsapp_messages` estão ativas e funcionando.
        *   **Ação Crítica:** Execute o DDL para aplicar RLS em todas as tabelas de memória do n8n (ex: `n8n_playground_drbrain`), restringindo o acesso por `session_id` (mapeado para `medico_id`).
    2.  **Gerenciar Secrets:**
        *   Confirme que a API Key da EvolutionAPI está configurada como Secret no Supabase e como Credencial no n8n.
        *   **Detalhe Técnico Adicional (n8n):** O n8n gerencia credenciais de forma segura e centralizada. Ao criar uma credencial (ex: `evolutionApi`), você insere a API Key uma única vez. Nos workflows, você apenas referencia o nome da credencial. O n8n injeta o valor real da chave apenas no momento da execução, garantindo que a chave secreta nunca seja exposta no JSON do workflow ou nos logs de execução.
    3.  **Testar o Fluxo de Ponta a Ponta:**
        *   Execute um teste completo: conecte um médico, envie uma mensagem, verifique a resposta da IA, a atualização da UI em tempo real e a correta persistência dos dados nas tabelas do Supabase.

#### **5. Considerações Finais e Recomendações Técnicas**
*   **Idempotência:** As Edge Functions e os workflows n8n devem ser projetados para serem idempotentes sempre que possível, para evitar efeitos colaterais em caso de retentativas.
*   **Monitoramento e Logging:** Implemente logging nas Edge Functions e nos workflows n8n para facilitar a depuração de problemas em produção. A Evolution API também possui variáveis de ambiente para controle de log (`LOG_LEVEL`, `LOG_COLOR`) que devem ser utilizadas.
*   **Validação de Webhooks:** A recomendação de adicionar um segredo compartilhado é excelente. A Evolution API inclui o campo `apikey` no payload de cada webhook enviado. O workflow n8n deve usar este campo para validar que a requisição é legítima.
    > **[Nota de Aprimoramento]** A validação pode ser implementada com um nó "IF" logo após o nó "Webhook". A condição do nó IF seria, por exemplo, `{{ $json.body.apikey }} Equals {{ $credentials.evolutionApi.apiKey }}`. Se a condição for falsa, o workflow termina, impedindo o processamento de requisições não autorizadas.

#### **6. Anexos**
(Os payloads de exemplo permanecem os mesmos, pois estão corretos e alinhados com a documentação.)

##### **6.1. Payload de Exemplo (EvolutionAPI `CONNECTION_UPDATE` -> n8n):**
```json
[
  {
    "body": {
      "event": "connection.update",
      "instance": "drbrain_5f50610b_30cf_45ec_9c5d_cc1daf2d402a",
      "data": {
        "instance": "drbrain_5f50610b_30cf_45ec_9c5d_cc1daf2d402a",
        "state": "connecting",
        "statusReason": 200
      },
      "apikey": "4D2C1657-E3EA-4B2D-AA25-828A74D350A5"
    }
  }
]
```
##### **6.2. Payload de Exemplo (EvolutionAPI `MESSAGES_UPSERT` -> n8n):**
```json
[
  {
    "body": {
      "event": "messages.upsert",
      "instance": "drbrain_5f50610b_30cf_45ec_9c5d_cc1daf2d402a",
      "data": {
        "key": {
          "remoteJid": "5511999998888@s.whatsapp.net",
          "fromMe": false,
          "id": "BAE5A93B7F131AB4"
        },
        "pushName": "Nome do Paciente",
        "message": {
          "conversation": "Olá, gostaria de marcar uma consulta."
        },
        "messageType": "conversation",
        "messageTimestamp": 1693339339
      },
      "apikey": "4D2C1657-E3EA-4B2D-AA25-828A74D350A5"
    }
  }
]
```