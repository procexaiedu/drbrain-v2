# Guia Técnico de Integração: Evolution API para Automação de WhatsApp (com n8n)

Este documento provê um guia técnico para a integração com a Evolution API, focando nas funcionalidades essenciais para conectar o WhatsApp de médicos ao seu SaaS e orquestrar a comunicação via uma Secretaria IA. A ênfase será em como utilizar o n8n para consumir e responder aos eventos da API.

## 1. Visão Geral da Evolution API

A Evolution API é uma solução que permite gerenciar múltiplas instâncias do WhatsApp, enviar e receber mensagens, e integrar com sistemas de automação e Inteligência Artificial. Cada "instância" da API corresponde a uma conexão ativa de um número de WhatsApp. No seu contexto, cada médico terá sua própria instância.

### Modelo de Autenticação:
Para a maioria das operações, a Evolution API utiliza uma **API Key** que você configura no seu ambiente da API Evolution. Segue chave configurada via variáveis de ambiente (`8823C54AEFE4-411A-8BB3-842942439741`) 

### URLs Base:
O `https://evolution2.procexai.tech` a url a seguir refere-se à URL onde minha instância da Evolution API está hospedada (https://evolution2.procexai.tech).

## 2. Gerenciamento de Instâncias do WhatsApp (Conectando o Médico)
#
O primeiro passo é permitir que o médico conecte seu número de WhatsApp à sua plataforma. Isso é feito criando uma instância na Evolution API.

## 2.1. Criar uma Nova Instância

**Endpoint:** `POST https://evolution2.procexai.tech/instance/create`

**Descrição:** Este endpoint cria uma nova instância de conexão WhatsApp na Evolution API. Ele é fundamental para o médico parear seu WhatsApp com sua Secretaria IA.

**Parâmetros do Corpo da Requisição (JSON):**
- `instanceName`: (string, obrigatório) Um nome único para a instância (ex: `dr_joao_whatsapp`). **Use o ID do seu cliente médico aqui para fácil rastreamento.**
- `number`: (string, opcional) O ID do número da instância (se já souber). Geralmente não é enviado na criação inicial com QR Code.
- `qrcode`: (boolean, obrigatório) Defina como `true` para que a API gere um QR Code para pareamento.
- `integration`: (string, obrigatório) O tipo de integração. Para WhatsApp normal, use `"WHATSAPP-BAILEYS"`.
- `token`: (string, opcional) Um token opcional para autenticar a instância. Pode ser gerado pelo seu sistema e armazenado.

**Corpo da Requisição (JSON - Exemplo):**
```json
{
    "instanceName": "dr_joao_consultorio",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS",
    "token": "SEU_TOKEN_SECRETO_PARA_INSTANCIA_DR_JOAO"
}
```

**Retorno (Exemplo):**
```json
{
    "instance": "dr_joao_consultorio",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS",
    "status": "connecting",
    "state": "start",
    "connection": "qrcode", // Indica que um QR Code precisa ser lido
    "url": "https://evolution2.procexai.tech/instance/connect/dr_joao_consultorio", // URL para obter o QR Code
    "token": "SEU_TOKEN_SECRETO_PARA_INSTANCIA_DR_JOAO" // O token que você enviou
}
```
**Ação no seu SaaS:** Após a criação, seu sistema deve capturar a `url` retornada (`https://evolution2.procexai.tech/instance/connect/SUA_INSTANCIA`) para exibir o QR Code para o médico.

### 2.2. Obter o QR Code para Pareamento

**Endpoint:** `GET https://evolution2.procexai.tech/instance/connect/{instance}`

**Descrição:** Este endpoint retorna o QR Code em formato Base64 para que o médico possa escanear com seu aplicativo WhatsApp no celular e conectar a instância.

**Parâmetros da URL:**
- `{instance}`: (string, obrigatório) O nome da instância criada (`instanceName`).

**Exemplo de Requisição HTTP:**
```http
GET https://evolution2.procexai.tech/instance/connect/dr_joao_consultorio
Host: seu-dominio-evolution-api.com
// Não precisa de headers adicionais se for uma requisição direta para o QR Code
```

**Retorno (Exemplo):**
```json
{
    "instance": "dr_joao_consultorio",
    "qrcode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEU...", // QR Code em Base64
    "status": "loading",
    "state": "pairing",
    "connection": "qrcode"
}
```
**Ação no seu SaaS:** Decodifique o Base64 e exiba a imagem do QR Code para o médico em sua interface. Seu frontend pode precisar fazer polling deste endpoint ou, preferencialmente, usar Webhooks para ser notificado sobre `QRCODE_UPDATED`.

### 2.3. Verificar Status da Conexão da Instância

**Endpoint:** `GET https://evolution2.procexai.tech/instance/connectionState/{instance}`

**Descrição:** Retorna o status atual da conexão da instância WhatsApp. Essencial para verificar se o médico está online.

**Parâmetros da URL:**
- `{instance}`: (string, obrigatório) O nome da instância.

**Retorno (Exemplo):**
```json
{
    "instance": "dr_joao_consultorio",
    "state": "connected", // Ou "disconnected", "pairing", "timeout"
    "status": "authenticated", // Ou "qr_scanned", "phone_not_connected", etc.
    "online": true,
    "webhook": "https://evolution2.procexai.tech/webhook/evolution"
}
```

## 3. Integração da Secretaria IA (Bot) com n8n

Esta seção descreve como a Evolution API se integra com o n8n para permitir que sua Secretaria IA converse com os pacientes.

### 3.1. Configurar Webhooks na Evolution API (Essencial para o n8n)

Para que o n8n receba as mensagens dos pacientes, você precisa configurar webhooks na Evolution API que apontem para os seus endpoints de webhook do n8n.

**Endpoint:** `POST https://evolution2.procexai.tech/webhook`
**Autenticação:** Com a API Key da Evolution API (geral), que é `8823C54AEFE4-411A-8BB3-842942439741`.

**Parâmetros do Corpo da Requisição (JSON):**
- `url`: (string, obrigatório) A URL do seu webhook no n8n. Para cada instância de médico, essa URL pode ser diferente ou conter um identificador (ex: `https://webh.procexai.tech/webhook/drbrain-playground` para produção, ou `https://seu-n8n.com/webhook/whatsapp_inbound?instanceId=dr_joao` para desenvolvimento com ID de instância).
- `event`: (string, obrigatório) O evento do qual você deseja ser notificado. Para receber mensagens, o mais importante é `"MESSAGES_UPSERT"`.
- `enabled`: (boolean, obrigatório) `true` para ativar o webhook.
- `instanceName`: (string, opcional) Se você quiser que este webhook seja específico para uma instância.
- `listen`: (array de strings, opcional) Lista de eventos para escutar neste webhook (se for um webhook geral para vários eventos).

**Corpo da Requisição (JSON - Exemplo para `MESSAGES_UPSERT`):**
```json
{
    "url": "https://webh.procexai.tech/webhook/drbrain-playground", // URL de produção para o webhook do n8n
    "event": "MESSAGES_UPSERT", // Recebe novas mensagens
    "enabled": true,
    "instanceName": "dr_joao_consultorio" // Opcional: vincula a um médico específico
}
```

**Eventos de Webhook Relevantes (para o n8n):**
- `QRCODE_UPDATED`: Envia o QR Code em Base64 para escaneamento. Crucial para o processo de onboarding do médico.
- `CONNECTION_UPDATE`: Informa o status da conexão do WhatsApp (ex: `connected`, `disconnected`). Permite monitorar a disponibilidade da Secretaria IA.
- `MESSAGES_UPSERT`: **Essencial!** Notifica quando uma nova mensagem é recebida ou uma mensagem existente é atualizada. Este é o gatilho principal para o seu fluxo de IA no n8n.
- `MESSAGES_UPDATE`: Informa quando uma mensagem é atualizada (ex: lida, enviada).
- `SEND_MESSAGE`: Notifica quando uma mensagem é enviada pela API (útil para logs).
- `PRESENCE_UPDATE`: Informa o status de presença de um contato (online, digitando, etc.).

### 3.2. Recebendo Mensagens no n8n (Webhook Node)

No n8n, você configuraria um nó "Webhook" para escutar na `url` que você definiu acima. O payload que a Evolution API envia para o n8n (o `MESSAGES_UPSERT` original) terá uma estrutura como:

**Payload de Exemplo (`MESSAGES_UPSERT` da Evolution API):**
```json
{
    "event": "MESSAGES_UPSERT",
    "instance": "dr_joao_consultorio",
    "data": {
        "key": {
            "remoteJid": "5547999998888@s.whatsapp.net", // JID do paciente
            "fromMe": false,
            "id": "msg_ID_UNICO"
        },
        "pushName": "Nome do Paciente",
        "message": {
            "conversation": "Olá, gostaria de agendar uma consulta."
        },
        "messageType": "conversation",
        "messageTimestamp": 1678886400,
        "owner": {
            "id": "5547999990000@s.whatsapp.net", // JID do médico/instância
            "name": "Dr. João"
        },
        "from": "5547999998888@s.whatsapp.net", // JID do remetente
        "to": "5547999990000@s.whatsapp.net" // JID do destinatário
        // ... outros campos (media, quoted messages, etc.)
    }
}
```
**Ação no n8n:** Seu fluxo no n8n processaria este payload. Você extrairia o `remoteJid` do paciente, o `message.conversation` (conteúdo da mensagem), o `instance` (para identificar qual médico) e enviaria para sua lógica de IA (que pode ser outro nó HTTP Request para uma API de IA, ou uma função customizada, etc.).

O payload *processado* que o n8n recebe e trabalha, que inclui informações de headers, parâmetros, query e um corpo mais específico para o processamento do DrBrain, pode ter uma estrutura como a seguinte:
```json
[
{
"headers":
{
"host":
"webh.procexai.tech",
"user-agent":
"Deno/1.45.2 (variant; SupabaseEdgeRuntime/1.67.3)",
"content-length":
"135",
"accept":
"*/*",
"accept-encoding":
"gzip, br",
"accept-language":
"*",
"content-type":
"application/json",
"x-forwarded-for":
"10.0.0.2",
"x-forwarded-host":
"webh.procexai.tech",
"x-forwarded-port":
"443",
"x-forwarded-proto":
"https",
"x-forwarded-server":
"b24a8fd82869",
"x-real-ip":
"10.0.0.2"
},
"params":
{
},
"query":
{
},
"body":
{
"message_type":
"text",
"content":
"Olá",
"medico_id":
"5f50610b-30cf-45ec-9c5d-cc1daf2d402a",
"agente_destino":
"playground_secretaria_ia"
},
"webhookUrl":
"https://webh.procexai.tech/webhook/drbrain-playground",
"executionMode":
"production"
}
]
```

### 3.3. Enviando Respostas do n8n via Evolution API

Após o processamento pela sua Secretaria IA no n8n, você precisará enviar a resposta de volta ao paciente. Isso é feito utilizando o endpoint de envio de mensagens da Evolution API.

**Endpoint (Enviar Mensagem de Texto):** `POST https://evolution2.procexai.tech/message/sendText/{instance}`
**Autenticação:** Com a API Key da Evolution API (geral).

**Parâmetros do Corpo da Requisição (JSON):**
- `number`: (string, obrigatório) O JID (ID do WhatsApp) ou número de telefone do destinatário (paciente).
- `body`: (string, obrigatório) O conteúdo da mensagem de texto.

**Corpo da Requisição (JSON - Exemplo no n8n):**
```json
{
    "number": "5547999998888", // Número do paciente
    "body": "Olá! Em que posso ajudar hoje?"
}
```
**Ação no n8n:** Dentro do seu fluxo no n8n, após a lógica da IA gerar a resposta, você usaria um nó "HTTP Request" para chamar este endpoint da Evolution API, enviando a mensagem de volta para o paciente.

## 4. Persistência de Dados e Configurações Essenciais
Preciso que me auxilie nisso, estou utilizando supabase 
Para o funcionamento da sua Secretaria IA e do histórico de conversas, a persistência de dados é crucial.

### Variáveis de Ambiente para Banco de Dados:
Configure estas variáveis no seu arquivo `.env`:
- `DATABASE_ENABLED=true`: Habilita o uso do banco de dados.
- `DATABASE_PROVIDER=postgresql` ou `mysql`: Escolha do provedor de banco de dados.
- `DATABASE_CONNECTION_URI`: String de conexão do seu banco de dados (ex: `postgresql://user:pass@host:port/evolution?schema=public`).
- `DATABASE_SAVE_DATA_INSTANCE=true`: Salva dados das instâncias (conexões).
- `DATABASE_SAVE_DATA_NEW_MESSAGE=true`: Salva novas mensagens.
- `DATABASE_SAVE_DATA_CONTACTS=true`: Salva contatos.
- `DATABASE_SAVE_DATA_CHATS=true`: Salva chats (conversas).

### Variáveis para Gerenciamento de Instâncias:
- `DEL_INSTANCE=false`: Defina como `false` para nunca excluir instâncias desconectadas automaticamente. Essencial para que a conexão do médico persista mesmo que ele fique offline.

## 5. Próximos Passos com n8n



1.  **Crie o Fluxo de Onboarding:** No seu SaaS, implemente a lógica para criar uma instância na Evolution API para cada médico, obter o QR Code e exibi-lo.
2.  **Desenvolva o Fluxo de Conversa no n8n:**
    *   Crie um Webhook no n8n para receber `MESSAGES_UPSERT` da Evolution API.
    *   Conecte este Webhook à sua lógica de Secretaria IA (pode ser um nó de "HTTP Request" para seu workflow, seja nó ou tool de integração com ferramentas de LLMs ja existentes).
    *   Após o processamento da IA, use um nó "HTTP Request" para chamar o endpoint `sendText` da Evolution API para enviar a resposta de volta ao paciente.
3.  **Monitore a Conexão:** Use webhooks `QRCODE_UPDATED` e `CONNECTION_UPDATE` para atualizar o status da conexão do WhatsApp do médico na interface do seu SaaS.

Este guia técnico detalha as interações programáticas necessárias para construir sua Secretaria IA com a Evolution API e o n8n. O próximo passo será o guia explicativo do fluxo. 