# Guia de Integração Asaas API para SaaS (Modelo White Label)

Este documento detalha a integração com a API da Asaas para desenvolvedores de SaaS que desejam oferecer funcionalidades de pagamento e gestão financeira aos seus clientes, utilizando o conceito de Subcontas da Asaas em um modelo White Label.

## 1. Visão Geral e Modelo de Subcontas

Seu SaaS atuará como a "Conta Raiz" na Asaas, e cada cliente do seu SaaS terá uma "Subconta" Asaas associada, que você gerenciará programaticamente. Isso permite que cada cliente tenha seu próprio ambiente de pagamentos, com transações e dados financeiros isolados, enquanto você mantém o controle centralizado do provisionamento e monitoramento.

### Conceitos Chave:
- **Conta Raiz (Sua Conta Asaas):** Usada para criar e gerenciar as Subcontas de seus clientes. Sua API Key principal será usada aqui.
- **Subconta (Conta do seu Cliente no Asaas):** Representa a conta de pagamentos de cada um dos seus clientes. Cada subconta terá sua própria API Key e `walletId` (ID da carteira) gerados pela Asaas.

## 2. Autenticação na API Asaas

Todas as requisições à API Asaas exigem autenticação via API Key.

### Cabeçalhos Necessários:
```http
Content-Type: application/json
User-Agent: seu_nome_do_app // Substitua pelo nome do seu SaaS/aplicação
access_token: SUA_API_KEY   // Pode ser a chave da sua Conta Raiz ou da Subconta, dependendo da operação
```

### URLs de Ambiente:
É crucial usar o ambiente correto para desenvolvimento e produção.
| Ambiente   | URL Base                    |
|------------|-----------------------------|
| Produção   | `https://api.asaas.com/v3`  |
| Sandbox    | `https://api-sandbox.asaas.com/v3` |

**Recomendação:** Sempre desenvolva e teste no ambiente `Sandbox` com dados fictícios. Mude para `Produção` apenas após validar todas as funcionalidades.

### Gerenciamento de API Keys:
- **Sua API Key (Conta Raiz):** Gerada no painel da Asaas (Integrações > API Key). Use-a para criar as subcontas dos seus clientes.
- **API Key da Subconta:** Gerada automaticamente pela Asaas ao criar uma subconta. **É retornada apenas uma vez na criação e deve ser armazenada IMEDIATAMENTE e de forma segura no seu sistema, associada ao cliente correspondente.** Não é possível recuperá-la depois de perdida.
- **Segurança:** Nunca exponha API Keys no frontend, em logs públicos ou em controle de versão. Armazene-as em um local seguro (ex: variáveis de ambiente, key vault).

## 3. Gerenciamento de Subcontas (Clientes do seu SaaS)

Esta é a funcionalidade central para o seu modelo de negócio. Seu SaaS será responsável por coletar as informações necessárias do seu cliente e enviá-las para a Asaas.

### 3.1. Criação de Nova Subconta

**Endpoint:** `POST /v3/accounts`
**Descrição:** Cria uma nova subconta na Asaas para um dos seus clientes. Esta subconta terá sua própria API Key e `walletId` para operações financeiras independentes. Esta API Key deve ser armazenada e utilizada para todas as operações subsequentes relacionadas a este cliente.

**Informações que seu CLIENTE DO SAAS precisa fornecer para o SEU SISTEMA (UI/UX no seu site):**
Para que você possa criar a subconta Asaas para seu cliente, seu sistema precisará coletar as seguintes informações dele, geralmente através de um formulário de cadastro:
- **Nome Completo / Razão Social:** `name` (string, obrigatório)
- **E-mail:** `email` (string, obrigatório) - Será o e-mail principal da subconta Asaas.
- **CPF / CNPJ:** `cpfCnpj` (string, obrigatório) - Documento do titular da subconta.
- **Data de Nascimento:** `birthDate` (string, obrigatório, formato `YYYY-MM-DD`) - Data de nascimento do titular da subconta.
- **Tipo de Empresa:** `companyType` (string, obrigatório) - Exemplos: `MEI`, `LTDA`, `SA`, `EIRELI`, `INDIVIDUAL`, `OUTRO`.
- **Telefone Fixo:** `phone` (string, obrigatório)
- **Celular:** `mobilePhone` (string, obrigatório)
- **Endereço (Rua):** `address` (string, obrigatório)
- **Número do Endereço:** `addressNumber` (string, obrigatório)
- **Complemento:** `complement` (string, opcional) - Ex: "Sala 502", "Apto 10".
- **Bairro:** `province` (string, obrigatório)
- **CEP:** `postalCode` (string, obrigatório)

**Corpo da Requisição (JSON) no seu Backend:**
```json
{
    "name": "Nome Completo ou Razão Social do Cliente",
    "email": "email.do.cliente@exemplo.com",
    "cpfCnpj": "11122233344555", // CPF ou CNPJ do cliente
    "birthDate": "1990-01-01",   // Data de nascimento do cliente (YYYY-MM-DD)
    "companyType": "MEI",        // Tipo de empresa (ex: "MEI", "LTDA", etc.)
    "phone": "4733334444",       // Telefone fixo do cliente
    "mobilePhone": "47999998888",// Celular do cliente
    "address": "Rua Principal",  // Nome da rua
    "addressNumber": "123",      // Número do endereço
    "complement": "Sala 101",    // Complemento (opcional)
    "province": "Centro",        // Bairro
    "postalCode": "88000000"     // CEP
}
```

**Retorno (Exemplo) da Asaas para seu Backend:**
Ao sucesso, a API retornará os dados da subconta, incluindo a crucial `apiKey` e `walletId`.
```json
{
    "object": "account",
    "id": "acc_XXXXXXXXXXXXX",
    "name": "Nome Completo ou Razão Social do Cliente",
    "email": "email.do.cliente@exemplo.com",
    "cpfCnpj": "11122233344555",
    "birthDate": "1990-01-01",
    "companyType": "MEI",
    "phone": "4733334444",
    "mobilePhone": "47999998888",
    "address": "Rua Principal",
    "addressNumber": "123",
    "complement": "Sala 101",
    "province": "Centro",
    "postalCode": "88000000",
    "apiKey": "sua_nova_api_key_da_subconta", // Chave de API exclusiva desta subconta
    "walletId": "id_da_carteira_da_subconta", // ID da carteira para transferências
    "enabled": true,
    "deleted": false
}
```
**Atenção:** Armazene `apiKey` e `walletId` da subconta de forma segura no seu banco de dados, vinculados ao seu cliente. Estas chaves **não podem ser recuperadas** após a criação.

**Limitações (Sandbox):** No ambiente Sandbox, há um limite de 20 subcontas criadas por dia.

### 3.2. Gerenciamento de Documentos de Subcontas

Após a criação da subconta, documentos adicionais podem ser necessários para a aprovação e para que a subconta possa operar plenamente (ex: realizar saques/transferências). O seu cliente do SaaS precisará fornecer estes documentos.

**3.2.1. Verificar Documentos Pendentes:**
**Endpoint:** `GET /v3/myAccount/documents`
**Autenticação:** Com a `access_token` da *sua conta Raiz Asaas*.
**Descrição:** Retorna uma lista dos tipos de documentos necessários para a aprovação de uma subconta e os links para onde o cliente pode ser redirecionado para fazer o upload (ou para o seu sistema enviar via API).
**Observação:** Recomenda-se aguardar 15 segundos após a criação da subconta antes de chamar este endpoint para garantir que a validação inicial da conta com a receita federal esteja completa.

**Retorno (Exemplo):**
```json
{
    "rejectReasons": null,
    "data": [
        {
            "id": "ID_DO_GRUPO_DE_DOCUMENTOS_1", // Usar este ID na URL do upload
            "status": "PENDING",
            "type": "IDENTIFICATION", // Tipo de documento (ex: IDENTIFICATION, IDENTIFICATION_SELFIE, CUSTOM)
            "title": "Documentos de Identificação",
            "description": "RG ou CNH serão aceitos.",
            "responsible": {
                "name": "Nome do Responsável",
                "type": "DIRECTOR"
            },
            "documents": [
                // Detalhes de documentos individuais, se já houver algum upload
            ],
            "onboardingUrl": "https://www.asaas.com/onboarding/upload/ID_DO_GRUPO_DE_DOCUMENTOS_1" // URL para redirecionar o cliente
        },
        // ... outros documentos pendentes
    ]
}
```
O `onboardingUrl` é importante caso você queira redirecionar seu cliente para o portal da Asaas para ele mesmo fazer o upload. Alternativamente, você pode usar a API de envio.

**3.2.2. Enviar Documento (via API):**
**Endpoint:** `POST /v3/myAccount/documents/{id}`
**Autenticação:** Com a `access_token` da *sua conta Raiz Asaas*.
**Descrição:** Envia um documento específico para um grupo de documentos pendentes. Você pode permitir que seu cliente faça o upload de arquivos no seu sistema, e seu backend enviaria para a Asaas.
**Parâmetros da URL:** `{id}` - O ID do grupo de documentos ao qual o arquivo pertence (obtido do `GET /v3/myAccount/documents`).

**Corpo da Requisição (Multipart Form-Data - Exemplo de como funcionaria, não JSON simples):**
Para enviar arquivos, a requisição geralmente é `multipart/form-data`, não `application/json`. Seu backend precisaria construir essa requisição.

**Exemplo conceitual de como o corpo seria (não JSON puro):**
```
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryXXXXX

------WebKitFormBoundaryXXXXX
Content-Disposition: form-data; name="documentFile"; filename="documento.pdf"
Content-Type: application/pdf

<conteúdo do arquivo PDF>
------WebKitFormBoundaryXXXXX
Content-Disposition: form-data; name="type"

IDENTIFICATION
------WebKitFormBoundaryXXXXX--
```
**Observação:** A documentação da Asaas normalmente forneceria exemplos de `curl` ou SDKs para o envio de arquivos, que abstraem a complexidade do `multipart/form-data`. Certifique-se de verificar a documentação oficial para a forma exata de envio de arquivos.

## 4. Gerenciamento de Clientes (para o Cliente do seu SaaS)

Estas operações são realizadas *em nome da subconta do seu cliente*, utilizando a `apiKey` da respectiva subconta.

### 4.1. Criar um Cliente

**Endpoint:** `POST /v3/customers`
**Autenticação:** Com a `access_token` da *subconta do seu cliente Asaas*.
**Descrição:** Cadastra um novo cliente que será cobrado pela subconta do seu cliente. Este é o cliente final do seu SaaS, que fará os pagamentos.

**Informações que o CLIENTE FINAL precisa fornecer para o SISTEMA DO SEU CLIENTE (formulário de checkout/cadastro do seu cliente):**
- **Nome:** `name` (string, obrigatório) - Nome completo da pessoa ou Razão Social da empresa.
- **CPF / CNPJ:** `cpfCnpj` (string, obrigatório)
- **E-mail:** `email` (string, opcional, mas **altamente recomendado** para notificações de cobrança)
- **Telefone Celular:** `mobilePhone` (string, opcional, mas **altamente recomendado** para notificações de cobrança)
- **Endereço Completo:** (Opcional, mas útil para emissão de boleto ou nota fiscal) - Incluindo `address`, `addressNumber`, `complement`, `province`, `postalCode`.

**Corpo da Requisição (JSON) no seu Backend (usando a API Key da subconta):**
```json
{
      "name": "Nome do Cliente a ser cobrado",
      "email": "cliente.final@dominio.com",
      "cpfCnpj": "99988877766555", // CPF ou CNPJ do cliente a ser cobrado
      "mobilePhone": "47999991111",
      "address": "Rua do Comércio",
      "addressNumber": "456",
      "complement": "Loja 1",
      "province": "Centro",
      "postalCode": "88000000"
}
```
**Retorno (Exemplo):**
```json
{
    "object": "customer",
    "id": "cus_ID_DO_CLIENTE", // ID único do cliente criado na Asaas
    "name": "Nome do Cliente a ser cobrado",
    "email": "cliente.final@dominio.com",
    // ... outros dados do cliente
}
```
**Observação:** A Asaas permite a criação de clientes duplicados. É sua responsabilidade implementar uma lógica de verificação (ex: buscar por CPF/CNPJ antes de criar) para evitar duplicatas, caso necessário para o seu fluxo de negócio.

### 4.2. Listar Clientes

**Endpoint:** `GET /v3/customers`
**Autenticação:** Com a `access_token` da *subconta do seu cliente Asaas*.
**Descrição:** Recupera uma lista de todos os clientes cadastrados para a subconta específica.

**Parâmetros (Query String):**
- `limit`: (Opcional, inteiro) Número máximo de resultados a serem retornados. Ex: `?limit=10`.
- `offset`: (Opcional, inteiro) Número de resultados a serem ignorados (para paginação). Ex: `?offset=20`.
- `name`: (Opcional, string) Filtra por nome do cliente.
- `email`: (Opcional, string) Filtra por email do cliente.
- `cpfCnpj`: (Opcional, string) Filtra por CPF/CNPJ do cliente.

**Exemplo de Requisição HTTP:**
```http
GET /v3/customers?limit=10&offset=0
Host: api.asaas.com/v3
Content-Type: application/json
access_token: sua_api_key_da_subconta
```
**Retorno (Exemplo):**
```json
{
    "object": "list",
    "hasMore": true,
    "totalCount": 100,
    "limit": 10,
    "offset": 0,
    "data": [
        {
            "object": "customer",
            "id": "cus_ID_DO_CLIENTE_1",
            "name": "Cliente A",
            "email": "clienteA@email.com",
            // ...
        },
        {
            "object": "customer",
            "id": "cus_ID_DO_CLIENTE_2",
            "name": "Cliente B",
            "email": "clienteB@email.com",
            // ...
        }
    ]
}
```

## 5. Criação de Cobranças e Pagamentos

Operações realizadas *em nome da subconta do seu cliente*, utilizando a `apiKey` da respectiva subconta.

### 5.1. Criar uma Cobrança

**Endpoint:** `POST /v3/payments`
**Autenticação:** Com a `access_token` da *subconta do seu cliente Asaas*.
**Descrição:** Cria uma nova cobrança (fatura) para um cliente da subconta. Suporta Pix, Boleto e Cartão de Crédito.

**Parâmetros do Corpo da Requisição (JSON):**
- `customer`: (string, obrigatório) O ID do cliente Asaas (`cus_ID_DO_CLIENTE`) ao qual a cobrança será associada.
- `billingType`: (string, obrigatório) Tipo de método de cobrança. Valores possíveis: `"BOLETO"`, `"CREDIT_CARD"`, `"PIX"`.
- `value`: (float, obrigatório) O valor da cobrança.
- `dueDate`: (string, obrigatório) Data de vencimento da cobrança, no formato `YYYY-MM-DD`.
- `description`: (string, opcional) Uma descrição para a cobrança.
- `externalReference`: (string, opcional) Um identificador externo seu para a cobrança (ex: ID da sua fatura interna).
- `callback`: (string, opcional) URL de callback para esta cobrança específica (se diferente do webhook geral).

**Corpo da Requisição (JSON - Exemplos):**

**Exemplo 1: Cobrança via Pix**
```json
{
  "customer": "cus_ID_DO_CLIENTE",
  "billingType": "PIX",
  "value": 100.00,
  "dueDate": "2024-12-31",
  "description": "Pagamento do Plano Premium - Janeiro",
  "externalReference": "PLANO_PREMIUM_JAN_123"
}
```

**Exemplo 2: Cobrança via Boleto**
```json
{
  "customer": "cus_ID_DO_CLIENTE",
  "billingType": "BOLETO",
  "value": 50.00,
  "dueDate": "2024-11-20",
  "description": "Mensalidade do Sistema - Novembro",
  "fine": { "value": 2.0 }, // Multa de 2% após o vencimento
  "interest": { "value": 0.03 } // Juros de 0.03% ao dia após o vencimento
}
```

**Exemplo 3: Cobrança via Cartão de Crédito (com tokenização)**
Para cobrança com cartão de crédito, geralmente você tokeniza os dados do cartão primeiro (usando um endpoint de tokenização do Asaas, não detalhado aqui, mas disponível na API para segurança) e então usa o token na criação da cobrança.
```json
{
  "customer": "cus_ID_DO_CLIENTE",
  "billingType": "CREDIT_CARD",
  "value": 150.00,
  "dueDate": "2024-10-25",
  "description": "Serviço de Consultoria",
  "creditCard": {
    "creditCardNumber": "NUMERO_DO_CARTAO", // Em produção, usar token
    "creditCardBrand": "VISA",
    "creditCardToken": "TOKEN_DO_CARTAO", // Preferencialmente usar o token gerado
    "holderName": "NOME_NO_CARTAO",
    "expiryMonth": "MES_EXPIRACAO",
    "expiryYear": "ANO_EXPIRACAO",
    "ccv": "CVV_DO_CARTAO"
  },
  "creditCardHolderInfo": {
    "name": "NOME COMPLETO TITULAR CARTAO",
    "email": "email.titular@exemplo.com",
    "cpfCnpj": "CPF_CNPJ_TITULAR",
    "postalCode": "CEP_TITULAR",
    "addressNumber": "NUMERO_ENDERECO_TITULAR",
    "addressComplement": "COMPLEMENTO_TITULAR",
    "phone": "TELEFONE_TITULAR",
    "mobilePhone": "CELULAR_TITULAR"
  },
  "installmentCount": 1 // Número de parcelas (para crédito parcelado)
}
```
**Retorno (Exemplo):**
```json
{
    "object": "payment",
    "id": "pay_XXXXXXXXXXXXX", // ID único da cobrança
    "customer": "cus_ID_DO_CLIENTE",
    "value": 100.00,
    "dueDate": "2024-12-31",
    "status": "PENDING", // Status inicial da cobrança
    "billingType": "PIX",
    "pixQrCode": {
        // Dados do QR Code Pix para ser apresentado ao pagador
        "encodedImage": "data:image/png;base64,...",
        "payload": "00020126...",
        "expirationDate": "2024-12-31T23:59:59Z"
    },
    "invoiceUrl": "https://www.asaas.com/faturas/pay_XXXXXXXXXXXXX", // URL da fatura para o cliente pagar
    // ... outros detalhes da cobrança
}
```

### 5.2. Criar Link de Pagamento

**Endpoint:** `POST /v3/paymentLinks`
**Autenticação:** Com a `access_token` da *subconta do seu cliente Asaas*.
**Descrição:** Gera um link de pagamento que pode ser compartilhado com o pagador. Suporta tipos de cobrança `DETACHED` (avulsa), `INSTALLMENT` (parcelada) e `RECURRENT` (recorrente/assinatura).

**Parâmetros Comuns do Corpo da Requisição (JSON):**
- `name`: (string, obrigatório) Nome do link de pagamento.
- `description`: (string, opcional) Descrição do produto/serviço.
- `value`: (float, obrigatório) Valor total do pagamento.
- `billingType`: (string, obrigatório para `INSTALLMENT` e `RECURRENT`, opcional para `DETACHED`) Tipo de cobrança principal. Ex: `"BOLETO"`, `"CREDIT_CARD"`, `"PIX"`, `"UNDEFINED"` (para permitir o pagador escolher).
- `chargeType`: (string, obrigatório) Tipo de fluxo de pagamento do link. Valores possíveis: `"DETACHED"`, `"INSTALLMENT"`, `"RECURRENT"`.
- `dueDateLimitDays`: (inteiro, opcional, para `DETACHED`) Número de dias para vencimento após a criação da cobrança.
- `maxInstallmentCount`: (inteiro, obrigatório para `INSTALLMENT`) Número máximo de parcelas.
- `subscriptionCycle`: (string, obrigatório para `RECURRENT`) Ciclo da recorrência. Valores: `"WEEKLY"`, `"BIWEEKLY"`, `"MONTHLY"`, `"QUARTERLY"`, `"SEMIANNUALLY"`, `"YEARLY"`.
- `redirectUrl`: (string, opcional) URL para redirecionar o pagador após o pagamento.
- `notificationEnabled`: (boolean, opcional) Habilita/desabilita notificações da Asaas.
- `callback`: (string, opcional) URL de callback específica para o link de pagamento.

**Exemplos de Corpo da Requisição (JSON):**

**Avulsa (`DETACHED`):**
```json
{
  "name": "Venda de Produto X",
  "description": "Produto digital para download",
  "value": 50.00,
  "billingType": "UNDEFINED", // Permite que o cliente escolha o tipo de pagamento
  "chargeType": "DETACHED",
  "dueDateLimitDays": 10      // Limite de dias para vencimento
}
```

**Parcelada (`INSTALLMENT`):**
```json
{
  "billingType": "CREDIT_CARD",
  "chargeType": "INSTALLMENT",
  "name": "Venda de Eletrônicos",
  "description": "Qualquer produto em até 10x de R$ 50,00",
  "value": 500.00,
  "maxInstallmentCount": 10,
  "notificationEnabled": false
}
```

**Recorrente (`RECURRENT`):**
```json
{
  "billingType": "CREDIT_CARD",
  "chargeType": "RECURRENT",
  "name": "Assinatura de Livros",
  "description": "Receba um livro todo mês por R$: 50,00",
  "value": 50.00,
  "subscriptionCycle": "MONTHLY"
}
```
**Retorno (Exemplo):**
```json
{
    "object": "paymentLink",
    "id": "pl_XXXXXXXXXXXXX", // ID único do link de pagamento
    "name": "Venda de Produto X",
    "description": "Produto digital para download",
    "value": 50.00,
    "url": "https://www.asaas.com/c/XXXXXXXXXXXXX", // URL do link de pagamento
    "chargeType": "DETACHED",
    // ... outros detalhes do link
}
```

## 6. Gerenciamento de Assinaturas

Operações realizadas *em nome da subconta do seu cliente*, utilizando a `apiKey` da respectiva subconta.

### 6.1. Criar uma Assinatura

**Endpoint:** `POST /v3/subscriptions`
**Autenticação:** Com a `access_token` da *subconta do seu cliente Asaas*.
**Descrição:** Cria uma assinatura para um cliente (que já deve estar cadastrado na Asaas para esta subconta), gerando cobranças automaticamente em um ciclo definido.

**Parâmetros do Corpo da Requisição (JSON):**
- `customer`: (string, obrigatório) ID do cliente Asaas (`cus_ID_DO_CLIENTE`) ao qual a assinatura será vinculada.
- `billingType`: (string, obrigatório) Tipo de pagamento da assinatura. Valores: `"BOLETO"`, `"PIX"`, `"CREDIT_CARD"`.
- `nextDueDate`: (string, obrigatório) Data da primeira cobrança da assinatura no formato `YYYY-MM-DD`. Para períodos de teste, esta seria a data do primeiro pagamento real após o trial.
- `value`: (float, obrigatório) Valor de cada cobrança da assinatura.
- `cycle`: (string, obrigatório) Ciclo de cobrança. Valores: `"WEEKLY"`, `"BIWEEKLY"`, `"MONTHLY"`, `"QUARTERLY"`, `"SEMIANNUALLY"`, `"YEARLY"`.
- `description`: (string, opcional) Descrição da assinatura.
- `externalReference`: (string, opcional) Um identificador externo seu para a assinatura.

**Corpo da Requisição (JSON):**
```json
{
  "customer": "cus_ID_DO_CLIENTE_DO_SEU_SAAS",
  "billingType": "BOLETO",
  "nextDueDate": "2023-10-15",
  "value": 19.9,
  "cycle": "MONTHLY",
  "description": "Assinatura Plano Pró"
}
```
**Retorno (Exemplo):**
```json
{
    "object": "subscription",
    "id": "sub_XXXXXXXXXXXXX", // ID único da assinatura
    "customer": "cus_ID_DO_CLIENTE_DO_SEU_SAAS",
    "value": 19.9,
    "cycle": "MONTHLY",
    "status": "ACTIVE",
    // ... outros detalhes da assinatura
}
```

### 6.2. Listar Pagamentos de uma Assinatura

**Endpoint:** `GET /v3/subscriptions/{id}/payments`
**Autenticação:** Com a `access_token` da *subconta do seu cliente Asaas*.
**Descrição:** Recupera todas as cobranças (pagamentos) geradas para uma assinatura específica.

**Parâmetros da URL:** `{id}` - O ID da assinatura (`sub_ID_DA_ASSINATURA`).

**Exemplo de Requisição HTTP:**
```http
GET /v3/subscriptions/sub_ID_DA_ASSINATURA/payments
Host: api.asaas.com/v3
Content-Type: application/json
access_token: sua_api_key_da_subconta
```
**Retorno (Exemplo):**
```json
{
    "object": "list",
    "hasMore": false,
    "totalCount": 12,
    "limit": 10,
    "offset": 0,
    "data": [
        {
            "object": "payment",
            "id": "pay_ID_DA_COBRANCA_1",
            "status": "CONFIRMED",
            "value": 19.9,
            "dueDate": "2023-10-15",
            // ...
        },
        // ... outras cobranças
    ]
}
```

### 6.3. Atualizar uma Assinatura Existente

**Endpoint:** `POST /v3/subscriptions/{id}`
**Autenticação:** Com a `access_token` da *subconta do seu cliente Asaas*.
**Descrição:** Atualiza os detalhes de uma assinatura existente (aplicável a assinaturas via Boleto ou Pix, para Cartão de Crédito pode haver restrições em alguns campos ou exigir recriação).

**Parâmetros da URL:** `{id}` - O ID da assinatura (`sub_ID_DA_ASSINATURA`) a ser atualizada.

**Parâmetros do Corpo da Requisição (JSON):**
- `value`: (float, opcional) Novo valor da assinatura.
- `nextDueDate`: (string, opcional) Nova data da próxima cobrança.
- `billingType`: (string, opcional) Novo tipo de pagamento.
- `description`: (string, opcional) Nova descrição.
- `updatePendingPayments`: (boolean, opcional) Se `true`, atualiza cobranças futuras (ainda não pagas) com o novo valor ou método de pagamento.
- `cycle`: (string, opcional) Novo ciclo de cobrança.

**Corpo da Requisição (JSON - Exemplo):**
```json
{
  "value": 29.9, // Novo valor da assinatura
  "description": "Plano Pro Avançado",
  "updatePendingPayments": true // Se true, atualiza cobranças pendentes futuras
}
```
**Retorno:** Retorna o objeto da assinatura atualizada.

## 7. Transferências de Valores

Operações que podem ser feitas da sua Conta Raiz para Subcontas, ou de Subcontas para contas externas (ambas utilizando a API Key correta).

### 7.1. Transferência para Outra Conta Asaas (Subconta para Subconta ou Raiz para Subconta)

**Endpoint:** `POST /v3/transfers/`
**Autenticação:** Com a `access_token` da *conta Asaas de origem da transferência* (sua conta Raiz ou a subconta do seu cliente).
**Descrição:** Solicita uma transferência de valor entre contas Asaas (carteiras digitais internas da Asaas). Útil para movimentar fundos entre as carteiras dos seus clientes ou da sua conta raiz para uma subconta.

**Parâmetros do Corpo da Requisição (JSON):**
- `value`: (float, obrigatório) O valor da transferência.
- `walletId`: (string, obrigatório) O ID da carteira da conta Asaas de destino.

**Informações que seu CLIENTE DO SAAS precisa fornecer para o SEU SISTEMA (para receber valores em outra subconta Asaas):**
- **ID da Carteira (Wallet ID):** `walletId` (string, obrigatório). Este é o ID da carteira Asaas da subconta que irá receber.

**Corpo da Requisição (JSON - Exemplo):**
```json
{
  "value": 1000.00,
  "walletId": "id_da_carteira_de_destino_da_subconta" // walletId da conta Asaas de destino
}
```
**Retorno (Exemplo):**
```json
{
    "object": "transfer",
    "id": "trn_XXXXXXXXXXXXX", // ID único da transferência
    "value": 1000.00,
    "status": "DONE", // Geralmente DONE imediatamente para transferências internas
    "type": "ASAAS_ACCOUNT",
    "walletId": "id_da_carteira_de_destino_da_subconta",
    // ... outros detalhes da transferência
}
```
**Observação:** Transferências entre contas Asaas são efetivadas imediatamente. Não é possível transferir um valor superior ao saldo da conta de origem.

### 7.2. Transferência para Conta Bancária Externa (Saque via Pix/TED/DOC)

**Endpoint:** `POST /v3/transfers` (Este é o endpoint genérico para transferências, a distinção é feita pelos parâmetros no corpo).
**Autenticação:** Com a `access_token` da *subconta do seu cliente Asaas* (a conta de onde o dinheiro sairá).
**Descrição:** Inicia uma transferência de saldo da subconta Asaas do seu cliente para uma conta bancária externa (via Pix, TED ou DOC).

**Informações que seu CLIENTE DO SAAS precisa fornecer para o SEU SISTEMA (para receber valores na conta bancária dele):**
Seu sistema precisará coletar os dados bancários ou a chave Pix do cliente.
- **Tipo de Transferência:** Se é Pix, TED ou DOC.
- **Valor:** `value` (float, obrigatório).
- **Dados do Beneficiário:**
    - **Nome Completo do Titular:** `bankAccount.ownerName` (string, obrigatório).
    - **CPF / CNPJ do Titular:** `bankAccount.cpfCnpj` (string, obrigatório).
    - **Dados Bancários (se não for Pix):**
        - **Código do Banco:** `bankAccount.bank.code` (string, obrigatório, ex: "001" para Banco do Brasil).
        - **Nome do Banco:** `bankAccount.bank.name` (string, opcional, mas bom para validação).
        - **Número da Agência:** `bankAccount.agency` (string, obrigatório).
        - **Dígito da Agência:** `bankAccount.agencyDigit` (string, opcional).
        - **Número da Conta:** `bankAccount.account` (string, obrigatório).
        - **Dígito da Conta:** `bankAccount.accountDigit` (string, obrigatório).
        - **Tipo de Conta:** `bankAccount.accountType` (string, obrigatório, ex: `"CHECKING_ACCOUNT"`, `"SAVING_ACCOUNT"`).
    - **Dados Pix (se for Pix):**
        - **Chave Pix:** `pixAddressKey` (string, obrigatório).
        - **Tipo da Chave Pix:** `pixAddressKeyType` (string, obrigatório). Valores: `"CPF"`, `"CNPJ"`, `"EMAIL"`, `"PHONE"`, `"RANDOM_KEY"`.

**Corpo da Requisição (JSON - Exemplos):**

**Exemplo 1: Transferência via Pix para Chave CPF**
```json
{
  "value": 500.00,
  "bankAccount": {
    "pixAddressKey": "12345678900", // CPF do beneficiário
    "pixAddressKeyType": "CPF",
    "ownerName": "Nome Completo Beneficiario",
    "cpfCnpj": "12345678900"
  },
  "description": "Saque de Vendas do Sistema"
}
```

**Exemplo 2: Transferência via TED/DOC para Conta Corrente (se o Asaas suportar via este endpoint, verificar doc oficial)**
```json
{
  "value": 250.00,
  "bankAccount": {
    "bank": {
      "code": "237", // Código do Bradesco
      "name": "Bradesco"
    },
    "accountName": "Nome Completo Titular",
    "ownerName": "Nome Completo Titular",
    "cpfCnpj": "11122233344", // CPF do titular
    "agency": "1234",
    "agencyDigit": "5",
    "account": "67890",
    "accountDigit": "1",
    "accountType": "CHECKING_ACCOUNT"
  },
  "description": "Saque de Comissões"
}
```
**Retorno (Exemplo):**
```json
{
    "object": "transfer",
    "id": "trn_EXTERNAL_XXXXXXXXXXXXX",
    "value": 500.00,
    "status": "PENDING", // Status inicial para transferências externas
    "type": "BANK_ACCOUNT", // Ou PIX, dependendo dos parâmetros
    "bankAccount": {
        // ... dados da conta bancária de destino
    },
    "transactionReceiptUrl": "https://www.asaas.com/comprovantes/...",
    // ... outros detalhes da transferência
}
```
**Observação:** O status de transferências externas pode demorar mais para mudar para `DONE` devido aos processamentos bancários. Use webhooks para monitorar o status (`TRANSFER_DONE`, `TRANSFER_FAILED`, etc.).

## 8. Webhooks (Notificações em Tempo Real)

Webhooks são essenciais para manter seu sistema sincronizado com os eventos da Asaas, sem a necessidade de polling constante. Seu sistema deve ter endpoints que a Asaas possa chamar quando um evento ocorre.

### 8.1. Criar um Webhook

**Endpoint:** `POST /v3/webhooks`
**Autenticação:** Com a `access_token` da *sua conta Raiz Asaas* (para webhooks gerais) ou da *subconta do seu cliente Asaas* (para webhooks específicos dessa subconta).
**Descrição:** Registra um novo endpoint (URL no seu sistema) para receber notificações sobre eventos da Asaas.

**Parâmetros do Corpo da Requisição (JSON):**
- `url`: (string, obrigatório) A URL do seu sistema que receberá as notificações POST da Asaas.
- `event`: (string, obrigatório) O tipo de evento para o qual deseja ser notificado (ex: `"PAYMENT_CREATED"`, `"TRANSFER_DONE"`). Consulte a documentação oficial da Asaas para a lista completa.
- `include_all_events`: (boolean, opcional, padrão `false`) Se `true`, todos os eventos serão enviados para esta URL, ignorando o campo `event` específico.
- `asaas_access_token`: (string, opcional) Um token customizado que a Asaas enviará no cabeçalho `asaas-access-token` da requisição para que você possa verificar a origem e autenticidade. **Altamente recomendado para segurança.**

**Corpo da Requisição (JSON):**
```json
{
  "url": "https://seu-dominio.com/webhook-handler",
  "event": "PAYMENT_RECEIVED", // Ou "PAYMENT_CREATED", "TRANSFER_DONE", etc.
  "include_all_events": false,
  "asaas_access_token": "SEU_TOKEN_SECRETO_PARA_WEBHOOK" // Para validar no seu sistema
}
```
**Retorno (Exemplo):**
```json
{
    "object": "webhook",
    "id": "whk_XXXXXXXXXXXXX", // ID único do webhook
    "url": "https://seu-dominio.com/webhook-handler",
    "event": "PAYMENT_RECEIVED",
    "enabled": true,
    // ... outros detalhes do webhook
}
```

**Exemplo de Payload de Webhook Recebido (POST no seu `webhook-handler`):**
A Asaas enviará um corpo JSON para a sua `url` configurada. O formato exato varia por evento, mas segue um padrão.

**Payload para `PAYMENT_RECEIVED`:**
```json
{
   "event": "PAYMENT_RECEIVED",
   "payment": {
      "object": "payment",
      "id": "pay_ID_DA_COBRANCA",
      "customer": "cus_ID_DO_CLIENTE",
      "value": 100.00,
      "netValue": 98.50, // Valor líquido após taxas
      "status": "RECEIVED",
      "billingType": "PIX",
      "dueDate": "2024-12-31",
      "originalDueDate": "2024-12-31",
      "clientPaymentDate": "2024-12-30", // Data que o cliente pagou
      "installmentNumber": null,
      "description": "Pagamento do Plano Premium - Janeiro",
      "externalReference": "PLANO_PREMIUM_JAN_123",
      "invoiceUrl": "https://www.asaas.com/faturas/...",
      "bankSlipUrl": null,
      "pixQrCode": { /* ... */ },
      "lastChargeBack": null,
      "lastChargeBackReceived": null,
      "deleted": false,
      "anticipated": false,
      "anticipable": false,
      "refundable": true,
      "refunds": [],
      "chargeback": null,
      "creditCard": null,
      "postalService": false,
      "split": []
   },
   "subscription": null,
   "bill": null,
   "invoice": null,
   "estimatedCredit": null,
   "installment": null
}
```

**Considerações Importantes para Webhooks:**
- Seu endpoint deve responder com um status `HTTP 200 OK` para indicar que a notificação foi recebida com sucesso.
- A Asaas pode reenviar notificações se não receber uma resposta 200.
- A Asaas pode enviar novos atributos nos payloads dos webhooks. Seu código deve ser resiliente a isso e não gerar exceções para evitar a interrupção da fila de sincronização.
- Implemente validação da origem das requisições:
    - Verifique o cabeçalho `User-Agent`.
    - Se você configurou `asaas_access_token` na criação do webhook, verifique o valor do cabeçalho `asaas-access-token` na requisição recebida.

## 9. Próximos Passos e Boas Práticas

- **Desenvolvimento em Sandbox:** Comece toda a sua integração no ambiente Sandbox. Ele é ideal para testar fluxos sem impactar dados reais.
- **Segurança da API Key:** Mantenha todas as API Keys (sua raiz e as das subcontas) extremamente seguras. Nunca as exponha no frontend, em logs públicos ou em controle de versão. Armazene-as em um local seguro (ex: variáveis de ambiente, key vault).
- **Tratamento de Erros:** Implemente um robusto tratamento de erros para lidar com respostas da API (ex: `HTTP 401 Unauthorized` para API Key inválida, `HTTP 400 Bad Request` para parâmetros incorretos).
- **Webhooks são CRUCIAIS:** Para um SaaS, webhooks são a forma mais eficiente de manter seu sistema atualizado com os eventos da Asaas, evitando polling excessivo e garantindo a sincronização em tempo real.
- **Documentação Oficial da Asaas:** Esta documentação é um guia, mas a Asaas atualiza sua API e documentação. Sempre consulte a documentação oficial da Asaas para os detalhes mais recentes sobre endpoints, parâmetros, e eventos.

---

Esta documentação serve como um guia abrangente para a integração do seu SaaS com a Asaas via subcontas, fornecendo os detalhes técnicos e as considerações sobre os dados necessários do seu cliente. 