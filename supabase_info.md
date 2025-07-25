
# Informações do Projeto Supabase

## 1. Tabelas do Banco de Dados (Schema: public)

### `documentos_contato`
- **RLS Habilitado**: Sim
- **Colunas**:
  - `id` (uuid, PK): Chave primária, gerado por `uuid_generate_v4()`.
  - `medico_id` (uuid): ID do médico. Chave estrangeira para `auth.users.id`.
  - `lead_id` (uuid): ID do lead, pode ser nulo. Chave estrangeira para `public.leads.id`.
  - `paciente_id` (uuid): ID do paciente, pode ser nulo. Chave estrangeira para `public.pacientes.id`.
  - `nome_arquivo_original` (text): Nome original do arquivo.
  - `tipo_arquivo` (text): Tipo MIME do arquivo.
  - `storage_path` (text): Caminho no Supabase Storage.
  - `data_upload` (timestamptz): Data e hora do upload, padrão `now()`.
  - `descricao_documento` (text): Descrição opcional do documento.
  - `created_at` (timestamptz): Data de criação.
  - `updated_at` (timestamptz): Data da última atualização.
- **Chaves Primárias**: `id`
- **Relacionamentos**:
  - `documentos_contato_lead_id_fkey` -> `public.leads.id`
  - `documentos_contato_paciente_id_fkey` -> `public.pacientes.id`
  - `documentos_contato_medico_id_fkey` -> `auth.users.id`

### `documents`
- **RLS Habilitado**: Não
- **Colunas**:
  - `id` (bigint, PK): Chave primária, gerado por sequência.
  - `content` (text): Conteúdo do documento.
  - `metadata` (jsonb): Metadados do documento.
  - `embedding` (vector): Vetor de embedding.
- **Chaves Primárias**: `id`
- **Relacionamentos**: N/A

### `feedbacks_sistema`
- **RLS Habilitado**: Sim
- **Comentário**: Tabela para armazenar feedbacks dos médicos sobre o sistema Dr.Brain
- **Colunas**:
  - `id` (uuid, PK): Chave primária, gerado por `gen_random_uuid()`.
  - `medico_id` (uuid): ID do médico que enviou o feedback. Chave estrangeira para `auth.users.id`.
  - `feedback_texto` (text): Texto consolidado do feedback processado pelo agente IA.
  - `status` (text): Status atual do feedback (`Aberto`, `Em Análise`, `Resolvido`, `Fechado`), padrão `Aberto`.
  - `data_criacao` (timestamptz): Data e hora de criação do feedback, padrão `now()`.
  - `data_ultima_atualizacao_status` (timestamptz): Data e hora da última atualização do status, padrão `now()`.
  - `created_at` (timestamptz): Data de criação.
  - `updated_at` (timestamptz): Data da última atualização.
- **Chaves Primárias**: `id`
- **Relacionamentos**:
  - `feedbacks_sistema_medico_id_fkey` -> `auth.users.id`

### `leads`
- **RLS Habilitado**: Sim
- **Colunas**:
  - `id` (uuid, PK): Chave primária, gerado por `uuid_generate_v4()`.
  - `medico_id` (uuid): ID do médico. Chave estrangeira para `auth.users.id`.
  - `nome_lead` (text): Nome do lead.
  - `telefone_principal` (text): Telefone principal.
  - `email_lead` (text): Email do lead, pode ser nulo.
  - `origem_lead` (text): Origem do lead, pode ser nulo.
  - `status_funil_lead` (text): Status no funil (`Novo Lead`, `Contato Inicial`, `Interesse em Agendamento`, `Consulta Marcada`, `Convertido`, `Perdido`), padrão `Novo Lead`.
  - `motivo_perda_lead` (text): Motivo da perda do lead, pode ser nulo.
  - `data_criacao` (timestamptz): Data de criação, padrão `now()`.
  - `data_ultima_atualizacao_status` (timestamptz): Data da última atualização de status, padrão `now()`.
  - `notas_internas_lead` (text): Notas internas, pode ser nulo.
  - `paciente_id_convertido` (uuid): ID do paciente se convertido, pode ser nulo. Chave estrangeira para `public.pacientes.id`.
  - `created_at` (timestamptz): Data de criação.
  - `updated_at` (timestamptz): Data da última atualização.
- **Chaves Primárias**: `id`
- **Relacionamentos**:
  - `pacientes_lead_origem_id_fkey` -> `public.leads.id`
  - `documentos_contato_lead_id_fkey` -> `public.leads.id`
  - `fk_paciente_convertido` -> `public.leads.paciente_id_convertido` (Provavelmente um erro no retorno da API, deveria ser paciente.id)
  - `leads_medico_id_fkey` -> `auth.users.id`

### `medico_oauth_pending_states`
- **RLS Habilitado**: Não
- **Comentário**: Armazena temporariamente os valores de "state" gerados durante o início de um fluxo OAuth2, associando-os ao médico e ao provedor, com um tempo de expiração.
- **Colunas**:
  - `state_value` (text, PK): Valor aleatório do parâmetro "state".
  - `medico_id` (uuid): ID do usuário (`auth.users.id`). Chave estrangeira para `auth.users.id`.
  - `provider` (text): Identificador do provedor OAuth (ex: `google_calendar`).
  - `expires_at` (timestamptz): Timestamp de expiração.
  - `created_at` (timestamptz): Timestamp de criação.
- **Chaves Primárias**: `state_value`
- **Relacionamentos**:
  - `fk_medico_auth_user` -> `auth.users.id`

### `medico_oauth_tokens`
- **RLS Habilitado**: Sim
- **Colunas**:
  - `medico_id` (uuid, PK): ID do médico. Chave estrangeira para `auth.users.id`.
  - `provider` (text, PK): Provedor (`google_calendar`, `asaas`, `evolution_api`).
  - `access_token` (text): Token de acesso.
  - `refresh_token` (text): Token de refresh, pode ser nulo.
  - `expires_at` (timestamptz): Timestamp de expiração, pode ser nulo.
  - `scopes` (text[]): Escopos, pode ser nulo.
  - `created_at` (timestamptz): Data de criação.
  - `updated_at` (timestamptz): Data da última atualização.
  - `api_key` (text): Chave de API, pode ser nulo.
  - `instance_id` (text): ID da instância, pode ser nulo.
  - `phone_number` (text): Número de telefone, pode ser nulo.
  - `instance_name` (text): Nome da instância, pode ser nulo.
  - `connection_status` (text): Status da conexão, pode ser nulo.
  - `qrcode` (text): QR Code, pode ser nulo.
- **Chaves Primárias**: `medico_id`, `provider`
- **Relacionamentos**:
  - `medico_oauth_tokens_medico_id_fkey` -> `auth.users.id`

### `medico_profiles`
- **RLS Habilitado**: Sim
- **Colunas**:
  - `id` (uuid, PK): ID do usuário (auth.users.id). Chave estrangeira para `auth.users.id`.
  - `nome_completo` (text): Nome completo do médico, pode ser nulo.
  - `email` (text): Email do médico, pode ser nulo.
  - `telefone` (text): Telefone do médico, pode ser nulo.
  - `especialidade_principal` (text): Especialidade principal, pode ser nulo.
  - `registro_conselho` (text): Registro no conselho, pode ser nulo.
  - `nome_clinica` (text): Nome da clínica, pode ser nulo.
  - `endereco_clinica` (text): Endereço da clínica, pode ser nulo.
  - `nome_secretaria_ia` (text): Nome da secretária IA, padrão `Assistente`.
  - `onboarding_concluido` (boolean): Onboarding concluído, padrão `false`.
  - `configuracoes_adicionais_json` (jsonb): Configurações adicionais em JSON, pode ser nulo.
  - `created_at` (timestamptz): Data de criação.
  - `updated_at` (timestamptz): Data da última atualização.
- **Chaves Primárias**: `id`
- **Relacionamentos**:
  - `medico_profiles_id_fkey` -> `auth.users.id`

### `medico_ia_configs`
- **RLS Habilitado**: Sim
- **Colunas**:
  - `medico_id` (uuid, PK): ID do médico. Chave estrangeira para `auth.users.id`.
  - `prompt_texto_producao` (text): Prompt de texto em produção, pode ser nulo.
  - `prompt_texto_laboratorio` (text): Prompt de texto em laboratório, pode ser nulo.
  - `updated_at_producao` (timestamptz): Data da última atualização em produção, padrão `now()`.
  - `updated_at_laboratorio` (timestamptz): Data da última atualização em laboratório, padrão `now()`.
  - `tone` (text): Tom, padrão `standard`.
  - `greetings` (text): Saudações, padrão `Olá! Em que posso ajudar hoje?`.
  - `farewells` (text): Despedidas, padrão `Até mais!`.
  - `max_retries_ia` (integer): Máximo de retentativas da IA, padrão `3`.
  - `ai_active_default` (boolean): IA ativa por padrão, padrão `true`.
  - `chatwoot_config` (jsonb): Configurações do Chatwoot, padrão `{}`.
  - `webhook_url_n8n_inbound` (text): URL do webhook N8N de entrada, pode ser nulo.
- **Chaves Primárias**: `medico_id`
- **Relacionamentos**:
  - `medico_secretaria_ia_prompts_medico_id_fkey` -> `auth.users.id`

### `n8n_assistentepessoal_wgr6`
- **RLS Habilitado**: Não
- **Colunas**:
  - `id` (integer, PK): Chave primária, gerado por sequência.
  - `session_id` (varchar): ID da sessão.
  - `message` (jsonb): Mensagem em JSONB.
- **Chaves Primárias**: `id`
- **Relacionamentos**: N/A

### `n8n_engenheiroprompt_drbrain`
- **RLS Habilitado**: Sim
- **Colunas**:
  - `id` (integer, PK): Chave primária, gerado por sequência.
  - `session_id` (varchar): ID da sessão.
  - `message` (jsonb): Mensagem em JSONB.
- **Chaves Primárias**: `id`
- **Relacionamentos**: N/A

### `n8n_feedbacks_drbrain`
- **RLS Habilitado**: Não
- **Colunas**:
  - `id` (integer, PK): Chave primária, gerado por sequência.
  - `session_id` (varchar): ID da sessão.
  - `message` (jsonb): Mensagem em JSONB.
- **Chaves Primárias**: `id`
- **Relacionamentos**: N/A

### `n8n_onboarding_drbrain`
- **RLS Habilitado**: Sim
- **Colunas**:
  - `id` (integer, PK): Chave primária, gerado por sequência.
  - `session_id` (varchar): ID da sessão.
  - `message` (jsonb): Mensagem em JSONB.
  - `timestamp` (timestamptz): Timestamp da mensagem, padrão `now()`.
- **Chaves Primárias**: `id`
- **Relacionamentos**: N/A

### `n8n_playground_drbrain`
- **RLS Habilitado**: Sim
- **Colunas**:
  - `id` (integer, PK): Chave primária, gerado por sequência.
  - `session_id` (varchar): ID da sessão.
  - `message` (jsonb): Mensagem em JSONB.
- **Chaves Primárias**: `id`
- **Relacionamentos**: N/A

### `pacientes`
- **RLS Habilitado**: Sim
- **Colunas**:
  - `id` (uuid, PK): Chave primária, gerado por `uuid_generate_v4()`.
  - `medico_id` (uuid): ID do médico. Chave estrangeira para `auth.users.id`.
  - `nome_completo` (text): Nome completo do paciente.
  - `cpf` (text): CPF do paciente, pode ser nulo.
  - `data_cadastro_paciente` (timestamptz): Data de cadastro, padrão `now()`.
  - `email_paciente` (text): Email do paciente, pode ser nulo.
  - `data_nascimento` (date): Data de nascimento, pode ser nulo.
  - `sexo` (text): Sexo (`Masculino`, `Feminino`, `Outro`, `Prefiro não informar`), pode ser nulo.
  - `endereco_completo_json` (jsonb): Endereço completo em JSON, pode ser nulo.
  - `status_paciente` (text): Status do paciente (`Paciente Ativo`, `Em Pós-Consulta`, `Inativo`), padrão `Paciente Ativo`.
  - `notas_gerais_paciente` (text): Notas gerais, pode ser nulo.
  - `lead_origem_id` (uuid): ID do lead de origem, pode ser nulo. Chave estrangeira para `public.leads.id`.
  - `updated_at` (timestamptz): Data da última atualização.
  - `telefone_principal` (text): Telefone principal, pode ser nulo.
  - `asaas_customer_id` (text): ID do cliente Asaas, pode ser nulo.
- **Chaves Primárias**: `id`
- **Relacionamentos**:
  - `prontuarios_paciente_id_fkey` -> `public.prontuarios.paciente_id` (Provavelmente um erro no retorno da API, deveria ser paciente.id)
  - `documentos_contato_paciente_id_fkey` -> `public.documentos_contato.paciente_id` (Provavelmente um erro no retorno da API, deveria ser paciente.id)
  - `fk_paciente_convertido` -> `public.leads.paciente_id_convertido` (Provavelmente um erro no retorno da API, deveria ser paciente.id)
  - `pacientes_lead_origem_id_fkey` -> `public.pacientes.lead_origem_id` (Provavelmente um erro no retorno da API, deveria ser paciente.id)
  - `pacientes_medico_id_fkey` -> `auth.users.id`

### `prontuarios`
- **RLS Habilitado**: Sim
- **Colunas**:
  - `id` (uuid, PK): Chave primária, gerado por `uuid_generate_v4()`.
  - `medico_id` (uuid): ID do médico. Chave estrangeira para `auth.users.id`.
  - `paciente_id` (uuid): ID do paciente, pode ser nulo. Chave estrangeira para `public.pacientes.id`.
  - `data_consulta` (date): Data da consulta.
  - `status_prontuario` (text): Status do prontuário (`PENDENTE_UPLOAD_STORAGE`, etc.).
  - `audio_storage_path` (text): Caminho do áudio no Storage, pode ser nulo.
  - `audio_original_filename` (text): Nome original do arquivo de áudio, pode ser nulo.
  - `conteudo_transcricao_bruta` (text): Conteúdo da transcrição bruta, pode ser nulo.
  - `conteudo_rascunho` (text): Conteúdo do rascunho, pode ser nulo.
  - `conteudo_finalizado` (text): Conteúdo finalizado, pode ser nulo.
  - `data_criacao` (timestamptz): Data de criação, padrão `now()`.
  - `data_ultima_modificacao` (timestamptz): Data da última modificação, padrão `now()`.
  - `erro_processamento_msg` (text): Mensagem de erro de processamento, pode ser nulo.
  - `sugestoes_consumo_json` (jsonb): Sugestões de consumo em JSON, pode ser nulo.
- **Chaves Primárias**: `id`
- **Relacionamentos**:
  - `prontuarios_paciente_id_fkey` -> `public.pacientes.id`
  - `prontuarios_medico_id_fkey` -> `auth.users.id`

### `whatsapp_conversations`
- **RLS Habilitado**: Sim
- **Colunas**:
  - `id` (uuid, PK): Chave primária, gerado por `uuid_generate_v4()`.
  - `medico_id` (uuid): ID do médico. Chave estrangeira para `auth.users.id`.
  - `contact_jid` (text): JID do contato.
  - `contact_name` (text): Nome do contato, pode ser nulo.
  - `last_message_at` (timestamptz): Data da última mensagem, pode ser nulo.
  - `unread_messages` (integer): Número de mensagens não lidas, padrão `0`.
  - `created_at` (timestamptz): Data de criação.
  - `updated_at` (timestamptz): Data da última atualização.
- **Chaves Primárias**: `id`
- **Relacionamentos**:
  - `whatsapp_messages_conversation_id_fkey` -> `public.whatsapp_conversations.id` (Provavelmente um erro no retorno da API, deveria ser whatsapp_conversations.id)
  - `whatsapp_conversations_medico_id_fkey` -> `auth.users.id`

### `whatsapp_messages`
- **RLS Habilitado**: Sim
- **Colunas**:
  - `id` (uuid, PK): Chave primária, gerado por `uuid_generate_v4()`.
  - `conversation_id` (uuid): ID da conversa. Chave estrangeira para `public.whatsapp_conversations.id`.
  - `medico_id` (uuid): ID do médico. Chave estrangeira para `auth.users.id`.
  - `message_content` (text): Conteúdo da mensagem, pode ser nulo.
  - `message_type` (text): Tipo da mensagem, padrão `text`.
  - `sent_by` (text): Remetente (`ia`, `contact`, `medico`).
  - `sent_at` (timestamptz): Data de envio.
  - `media_url` (text): URL da mídia, pode ser nulo.
  - `evolution_message_id` (text): ID da mensagem da Evolution API, pode ser nulo.
  - `created_at` (timestamptz): Data de criação.
- **Chaves Primárias**: `id`
- **Relacionamentos**:
  - `whatsapp_messages_medico_id_fkey` -> `auth.users.id`
  - `whatsapp_messages_conversation_id_fkey` -> `public.whatsapp_conversations.id`

## 2. Extensões Instaladas

- `pageinspect` (Default Version: 1.11, Comment: inspect the contents of database pages at a low level)
- `pgroonga` (Default Version: 3.2.5, Comment: Super fast and all languages supported full text search index based on Groonga)
- `postgis` (Default Version: 3.3.7, Comment: PostGIS geometry and geography spatial types and functions)
- `wrappers` (Default Version: 0.5.3, Comment: Foreign data wrappers developed by Supabase)
- `earthdistance` (Default Version: 1.1, Comment: calculate great-circle distances on the surface of the Earth)
- `sslinfo` (Default Version: 1.2, Comment: information about SSL certificates)
- `pg_jsonschema` (Default Version: 0.3.3, Comment: pg_jsonschema)
- `plls` (Default Version: 3.1.10, Comment: PL/LiveScript (v8) trusted procedural language)
- `postgis_sfcgal` (Default Version: 3.3.7, Comment: PostGIS SFCGAL functions)
- `dict_xsyn` (Default Version: 1.0, Comment: text search dictionary template for extended synonym processing)
- `pgtap` (Default Version: 1.2.0, Comment: Unit testing for PostgreSQL)
- `pg_net` (Schema: extensions, Default Version: 0.14.0, Installed Version: 0.14.0, Comment: Async HTTP)
- `dblink` (Default Version: 1.2, Comment: connect to other PostgreSQL databases from within a database)
- `pg_hashids` (Default Version: 1.3, Comment: pg_hashids)
- `pgsodium` (Default Version: 3.1.8, Comment: Postgres extension for libsodium functions)
- `pg_buffercache` (Default Version: 1.3, Comment: examine the shared buffer cache)
- `http` (Default Version: 1.6, Comment: HTTP client for PostgreSQL, allows web page retrieval inside the database.)
- `adminpack` (Default Version: 2.1, Comment: administrative functions for PostgreSQL)
- `tsm_system_rows` (Default Version: 1.0, Comment: TABLESAMPLE method which accepts number of rows as a limit)
- `moddatetime` (Schema: public, Default Version: 1.0, Installed Version: 1.0, Comment: functions for tracking last modification time)
- `tablefunc` (Default Version: 1.0, Comment: functions that manipulate whole tables, including crosstab)
- `intagg` (Default Version: 1.1, Comment: integer aggregator and enumerator (obsolete))
- `address_standardizer_data_us` (Default Version: 3.3.7, Comment: Address Standardizer US dataset example)
- `rum` (Default Version: 1.3, Comment: RUM index access method)
- `pg_freespacemap` (Default Version: 1.2, Comment: examine the free space map (FSM))
- `vector` (Schema: public, Default Version: 0.8.0, Installed Version: 0.8.0, Comment: vector data type and ivfflat and hnsw access methods)
- `timescaledb` (Default Version: 2.16.1, Comment: Enables scalable inserts and complex queries for time-series data (Apache 2 Edition))
- `isn` (Default Version: 1.2, Comment: data types for international product numbering standards)
- `pg_prewarm` (Default Version: 1.2, Comment: prewarm relation data)
- `postgis_tiger_geocoder` (Default Version: 3.3.7, Comment: PostGIS tiger geocoder and reverse geocoder)
- `pg_repack` (Default Version: 1.5.2, Comment: Reorganize tables in PostgreSQL databases with minimal locks)
- `pgcrypto` (Schema: extensions, Default Version: 1.3, Installed Version: 1.3, Comment: cryptographic functions)
- `pgrouting` (Default Version: 3.4.1, Comment: pgRouting Extension)
- `pgstattuple` (Default Version: 1.5, Comment: show tuple-level statistics)
- `btree_gin` (Default Version: 1.3, Comment: support for indexing common datatypes in GIN)
- `cube` (Default Version: 1.5, Comment: data type for multidimensional cubes)
- `pg_cron` (Default Version: 1.6, Comment: Job scheduler for PostgreSQL)
- `uuid-ossp` (Schema: extensions, Default Version: 1.1, Installed Version: 1.1, Comment: generate universally unique identifiers (UUIDs))
- `plcoffee` (Default Version: 3.1.10, Comment: PL/CoffeeScript (v8) trusted procedural language)
- `pg_graphql` (Schema: graphql, Default Version: 1.5.11, Installed Version: 1.5.11, Comment: pg_graphql: GraphQL support)
- `autoinc` (Default Version: 1.0, Comment: functions for autoincrementing fields)
- `plv8` (Default Version: 3.1.10, Comment: PL/JavaScript (v8) trusted procedural language)
- `plpgsql_check` (Default Version: 2.7, Comment: extended check for plpgsql functions)
- `pgrowlocks` (Default Version: 1.2, Comment: show row-level locking information)
- `pgjwt` (Default Version: 0.2.0, Comment: JSON Web Token API for Postgresql)
- `supabase_vault` (Schema: vault, Default Version: 0.3.1, Installed Version: 0.3.1, Comment: Supabase Vault Extension)
- `pg_stat_statements` (Schema: extensions, Default Version: 1.10, Installed Version: 1.10, Comment: track planning and execution statistics of all SQL statements executed)
- `hypopg` (Default Version: 1.4.1, Comment: Hypothetical indexes for PostgreSQL)
- `file_fdw` (Default Version: 1.0, Comment: foreign-data wrapper for flat file access)
- `address_standardizer` (Default Version: 3.3.7, Comment: Used to parse an address into constituent elements. Generally used to support geocoding address normalization step.)
- `dict_int` (Default Version: 1.0, Comment: text search dictionary template for integers)
- `pg_walinspect` (Default Version: 1.0, Comment: functions to inspect contents of PostgreSQL Write-Ahead Log)
- `pg_stat_monitor` (Default Version: 2.1, Comment: The pg_stat_monitor is a PostgreSQL Query Performance Monitoring tool, based on PostgreSQL contrib module pg_stat_statements. pg_stat_monitor provides aggregated statistics, client information, plan details including plan, and histogram information.)
- `pg_trgm` (Default Version: 1.6, Comment: text similarity measurement and index searching based on trigrams)
- `seg` (Default Version: 1.4, Comment: data type for representing line segments or floating-point intervals)
- `pg_tle` (Default Version: 1.4.0, Comment: Trusted Language Extensions for PostgreSQL)
- `insert_username` (Default Version: 1.0, Comment: functions for tracking who changed a table)
- `postgres_fdw` (Default Version: 1.1, Comment: foreign-data wrapper for remote PostgreSQL servers)
- `postgis_raster` (Default Version: 3.3.7, Comment: PostGIS raster types and functions)
- `xml2` (Default Version: 1.1, Comment: XPath querying and XSLT)
- `pg_surgery` (Default Version: 1.0, Comment: extension to perform surgery on a damaged relation)
- `amcheck` (Default Version: 1.3, Comment: functions for verifying relation integrity)
- `pgroonga_database` (Default Version: 3.2.5, Comment: PGroonga database management module)
- `hstore` (Default Version: 1.8, Comment: data type for storing sets of (key, value) pairs)
- `intarray` (Default Version: 1.5, Comment: functions, operators, and index support for 1-D arrays of integers)
- `pg_visibility` (Default Version: 1.2, Comment: examine the visibility map (VM) and page-level visibility info)
- `unaccent` (Default Version: 1.1, Comment: text search dictionary that removes accents)
- `citext` (Default Version: 1.6, Comment: data type for case-insensitive character strings)
- `bloom` (Default Version: 1.0, Comment: bloom access method - signature file based index)
- `fuzzystrmatch` (Default Version: 1.1, Comment: determine similarities and distance between strings)
- `postgis_topology` (Default Version: 3.3.7, Comment: PostGIS topology spatial types and functions)
- `ltree` (Default Version: 1.2, Comment: data type for hierarchical tree-like structures)
- `plpgsql` (Schema: pg_catalog, Default Version: 1.0, Installed Version: 1.0, Comment: PL/pgSQL procedural language)
- `pgmq` (Default Version: 1.4.4, Comment: A lightweight message queue. Like AWS SQS and RSMQ but on Postgres.)
- `pgaudit` (Default Version: 1.7, Comment: provides auditing functionality)
- `refint` (Default Version: 1.0, Comment: functions for implementing referential integrity (obsolete))
- `lo` (Default Version: 1.1, Comment: Large Object maintenance)
- `old_snapshot` (Default Version: 1.0, Comment: utilities in support of old_snapshot_threshold)
- `tsm_system_time` (Default Version: 1.0, Comment: TABLESAMPLE method which accepts time in milliseconds as a limit)
- `tcn` (Default Version: 1.0, Comment: Triggered change notifications)
- `btree_gist` (Default Version: 1.7, Comment: support for indexing common datatypes in GiST)
- `index_advisor` (Default Version: 0.2.0, Comment: Query index advisor)

## 3. Edge Functions Implantadas

### `create-medico-admin`
- **ID**: `0a8dd2fc-3438-42ba-b93a-0650901b9405`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/create-medico-admin/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Cria um novo usuário médico no Supabase Auth usando `supabaseAdmin`.
  - Insere um perfil correspondente na tabela `medico_profiles`.
  - Requer autenticação de um ADMIN_USER_ID.
  - Lida com CORS e validação de payload.

### `get-medico-profile`
- **ID**: `f212fbd0-c88b-4035-b097-c5873eebcb59`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/get-medico-profile/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Busca o perfil do médico autenticado na tabela `medico_profiles`.
  - Lida com CORS e erros de autenticação ou perfil não encontrado.

### `update-medico-profile`
- **ID**: `12dac8ba-8f64-4c1f-9665-99b9d91a5ded`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/update-medico-profile/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Atualiza o perfil do médico autenticado na tabela `medico_profiles`.
  - Permite a atualização de campos específicos e valida o payload.

### `onboarding-chat`
- **ID**: `04b88957-8755-48a4-9397-82f464f70fbc`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/onboarding-chat/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Encaminha mensagens de chat de onboarding para um webhook N8N.
  - Requer `medico_id`, `agente_destino`, `message_type` e `content` no payload.

### `get-onboarding-history`
- **ID**: `eb3a02c4-7a93-455f-a7f9-5c3e3e8acd44`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/get-onboarding-history/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Busca o histórico de mensagens de onboarding da tabela `n8n_onboarding_drbrain`.
  - Filtra por `session_id` (que é o `medico_id`).

### `playground-secretaria-ia-chat`
- **ID**: `4c874d73-1dbb-499b-9478-16269cc597f5`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/playground-secretaria-ia-chat/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Função para o chat do playground da Secretária IA, encaminha para webhook N8N.
  - Requer autenticação do usuário e `medico_id` no payload.

### `playground-bob-chat`
- **ID**: `21dbcb85-067b-40b3-ab7b-a81e1da7ff9d`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/playground-bob-chat/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Função para o chat do playground do Bob, encaminha para webhook N8N.
  - Similar ao `playground-secretaria-ia-chat`.

### `update-prompt-laboratorio`
- **ID**: `4434b315-2e7c-4d0f-9004-e695502c7455`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/update-prompt-laboratorio/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Atualiza o `prompt_texto_laboratorio` na tabela `medico_ia_configs`.
  - Requer autenticação e `prompt_texto` no payload.

### `get-prompt-laboratorio`
- **ID**: `9e179568-46ca-4569-a8b4-9b3cca525318`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/get-prompt-laboratorio/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Busca o `prompt_texto_laboratorio` e `updated_at_laboratorio` da tabela `medico_ia_configs`.
  - Retorna um prompt vazio se não encontrado.

### `publicar-prompt-laboratorio`
- **ID**: `c9a18a1a-1df4-4f8f-bdb6-5ae1afbb55c9`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/publicar-prompt-laboratorio/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Copia o `prompt_texto_laboratorio` para `prompt_texto_producao` na tabela `medico_ia_configs`.

### `descartar-prompt-laboratorio`
- **ID**: `129b37c8-7e32-457a-801d-b888d737ff7c`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/descartar-prompt-laboratorio/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Reverte o `prompt_texto_laboratorio` para o valor de `prompt_texto_producao`.

### `limpar-memoria-playground-secretaria`
- **ID**: `22d736aa-78c7-41c2-9ed1-58e52c1c2338`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/limpar-memoria-playground-secretaria/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Limpa o histórico de chat do playground da Secretária IA na tabela `n8n_playground_drbrain`.

### `limpar-memoria-bob`
- **ID**: `401b63c0-f449-47cb-adb7-079d7ab399f1`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/limpar-memoria-bob/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Limpa o histórico de chat do playground do Bob na tabela `n8n_engenheiroprompt_drbrain`.

### `get-playground-secretaria-history`
- **ID**: `c69dff92-18aa-47a6-aa69-f1dbc904a6cb`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/get-playground-secretaria-history/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Busca o histórico de mensagens da Secretária IA do playground.
  - Inclui lógica para extrair conteúdo limpo de mensagens.

### `get-playground-bob-history`
- **ID**: `53e2b0ed-6c1f-4ec3-950f-5f7627679458`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/get-playground-bob-history/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Busca o histórico de mensagens do Bob do playground.
  - Inclui lógica para extrair conteúdo limpo de mensagens.

### `iniciar-processamento-prontuario`
- **ID**: `bb4ce899-129c-4636-99f5-f5f3038171e9`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/iniciar-processamento-prontuario/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Recebe um arquivo de áudio e dados de prontuário.
  - Cria um registro de prontuário e faz upload do áudio para o Storage.
  - Atualiza o status do prontuário para `AGUARDANDO_PROCESSAMENTO_N8N`.

### `crm-pacientes`
- **ID**: `fa4f9a48-93e2-47b6-8be4-c549c50a2da6`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/crm-pacientes/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Implementa CRUD para pacientes (`list`, `get`, `create`, `update`, `delete`).
  - Inclui validação de CPF e verificação de propriedade do médico.

### `prontuarios-crud`
- **ID**: `0817cfc4-b677-4115-9c2d-05a6da61b099`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/prontuarios-crud/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Implementa CRUD para prontuários, incluindo listagem com filtros, obtenção de URL de áudio assinada e finalização de prontuários.

### `n8n-callback-prontuario-rascunho`
- **ID**: `d0bf3eee-4129-49c7-9cd7-12d7655e22fb`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/n8n-callback-prontuario-rascunho/index.ts`
- **Verificar JWT**: Não
- **Conteúdo do Arquivo Principal** (Resumo):
  - Callback do N8N para atualizar o prontuário com o rascunho ou erro de processamento.

### `storage-trigger-to-n8n-prontuarios`
- **ID**: `2a0688b5-3a40-4ac2-b2ed-3413332ac2ff`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/storage-trigger-to-n8n-prontuarios/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Disparada por um trigger do Supabase Storage quando um novo áudio é inserido.
  - Gera uma URL assinada para o áudio e chama um webhook N8N para iniciar o processamento.

### `feedback-chat`
- **ID**: `15be1480-31ac-42f1-9cdf-52a89031ee9a`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/feedback-chat/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Encaminha mensagens de feedback do chat para um webhook N8N.

### `n8n-callback-registrar-feedback`
- **ID**: `ab265662-703f-4a72-939c-d0bcfa6950ad`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/n8n-callback-registrar-feedback/index.ts`
- **Verificar JWT**: Não
- **Conteúdo do Arquivo Principal** (Resumo):
  - Callback do N8N para registrar feedback na tabela `feedbacks_sistema`.

### `limpar-memoria-feedback`
- **ID**: `e97d32ad-c21e-40bd-ac5e-5bc72a3d10e1`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/limpar-memoria-feedback/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Limpa o histórico de chat do agente de feedback na tabela `n8n_feedbacks_drbrain`.

### `get-feedback-history`
- **ID**: `837c7236-c13e-4d66-b5a5-d47139ba866f`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/get-feedback-history/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Busca o histórico de mensagens do agente de feedback.

### `crm-leads-management`
- **ID**: `2bbaf891-c644-43f5-b27a-da628d02d596`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/crm-leads-management/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Implementa CRUD completo para `leads` (`list`, `get`, `create`, `update`, `delete`).
  - Permite converter um lead em paciente e atualizar o status do lead.

### `crm-pacientes-management`
- **ID**: `4f659695-f168-4001-970e-97790f74f661`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/crm-pacientes-management/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Implementa CRUD completo para `pacientes` (`list`, `get`, `create`, `update`, `delete`).
  - Permite atualizar o status do paciente.
  - Inclui validação para evitar exclusão de pacientes com prontuários ou documentos associados.

### `crm-documentos`
- **ID**: `38012aab-bd6f-4cd9-af6a-2d8575bf1481`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/crm-documentos/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Gerencia documentos relacionados a leads e pacientes, incluindo upload, listagem e download.
  - Valida tipos e tamanhos de arquivos, e garante que o documento seja associado a um lead ou paciente válido.

### `get-dashboard-summary`
- **ID**: `bfd894e6-0c2b-4328-a698-2615c6219728`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/get-dashboard-summary/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Coleta e processa dados de leads, pacientes e prontuários para um resumo do dashboard.

### `limpar-historico-onboarding`
- **ID**: `69c39be9-2d11-454b-9cfb-4ee775425307`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/limpar-historico-onboarding/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Limpa o histórico de mensagens de onboarding de um médico na tabela `n8n_onboarding_drbrain`.

### `google-calendar-auth-connect`
- **ID**: `077afbdb-5074-4558-817f-232fe26c9583`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/google-calendar-auth-connect/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Inicia o fluxo de autenticação OAuth 2.0 com o Google Calendar.
  - Salva um estado pendente na tabela `medico_oauth_pending_states`.
  - Retorna a URL de autorização do Google para o frontend.

### `google-calendar-auth-callback`
- **ID**: `d49cf671-4abb-412b-977c-d962ba2e1fba`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/google-calendar-auth-callback/index.ts`
- **Verificar JWT**: Não
- **Conteúdo do Arquivo Principal** (Resumo):
  - Endpoint de callback para o fluxo OAuth do Google Calendar.
  - Troca o código de autorização por tokens de acesso/refresh do Google.
  - Salva os tokens na tabela `medico_oauth_tokens`.
  - Redireciona para o frontend com o status da conexão.

### `google-calendar-auth-disconnect`
- **ID**: `522b41d1-4b7d-41dc-b9ca-27453151897f`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/google-calendar-auth-disconnect/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Desconecta a conta do Google Calendar de um médico.
  - Deleta os tokens OAuth associados da tabela `medico_oauth_tokens`.

### `agenda-crud-events`
- **ID**: `86b77051-a2e4-41d6-99a8-d7593375001c`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/agenda-crud-events/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Permite operações CRUD em eventos do Google Calendar para o médico autenticado.
  - Obtém um token de acesso válido para o Google Calendar usando `getValidGoogleToken`.

### `secretaria-ia-agendamento-contact-patient`
- **ID**: `bc2fd423-a809-4302-872b-f3e6ff72a4d5`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/secretaria-ia-agendamento-contact-patient/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Recebe uma solicitação para iniciar contato de agendamento via Secretária IA.
  - Valida os dados do paciente e o motivo, e encaminha a solicitação para um webhook N8N.

### `google-calendar-auth-status`
- **ID**: `898ee2c0-eacd-4b0c-96be-efa1703c48f0`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/google-calendar-auth-status/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Verifica o status da conexão do Google Calendar para um médico, consultando a tabela `medico_oauth_tokens`.

### `get-delegate-gcal-token`
- **ID**: `21c78e51-7b28-49c9-a3eb-7d74849dea05`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/get-delegate-gcal-token/index.ts`
- **Verificar JWT**: Não
- **Conteúdo do Arquivo Principal** (Resumo):
  - Obtém um token de acesso válido do Google Calendar para um `medico_id` específico.
  - Projetada para ser chamada internamente, com verificação de segredo (`X-Internal-Secret`).

### `token-issuer`
- **ID**: `866d8a68-876d-4f89-816c-149cf0ca39de`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/Users/ProceX/Desktop/drbrain/drbrain-v2/supabase/functions/token-issuer/index.ts`
- **Verificar JWT**: Não
- **Conteúdo do Arquivo Principal** (Resumo):
  - Emite um token JWT personalizado para um `medico_id` fornecido.
  - Requer uma chave de API (`x-api-key`) para autenticação interna.

### `evolution-manager`
- **ID**: `6981b162-13da-4953-ac08-9380b89c4850`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `source/supabase/functions/evolution-manager/index.ts`
- **Verificar JWT**: Sim
- **Conteúdo do Arquivo Principal** (Resumo):
  - Gerencia a conexão com a Evolution API (WhatsApp).
  - Permite criar instâncias (conexões), verificar status e desconectar.
  - Salva informações da instância (hash, qrcode) na tabela `medico_oauth_tokens`.
  - Configura webhooks para `MESSAGES_UPSERT` e `CONNECTION_UPDATE` na Evolution API.

### `whatsapp-chat`
- **ID**: `d5e2d9b6-21b5-4d43-8517-9e3a0dd1e43d`
- **Status**: `ACTIVE`
- **Caminho de Entrada**: `/drbrain-v2-main/supabase/functions/whatsapp-chat/index.ts`
- **Verificar JWT**: Não
- **Conteúdo do Arquivo Principal** (Resumo):
  - Lida com operações de chat do WhatsApp, como listar conversas, listar mensagens e enviar mensagens.
  - Interage com a Evolution API para enviar mensagens e com o banco de dados Supabase para persistir conversas e mensagens. 