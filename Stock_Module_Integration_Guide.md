# Guia Explicativo: Módulo de Estoque e Serviços (Integrado com IA e Financeiro)

Este documento detalha o Módulo de Estoque e Serviços do seu SaaS, explicando suas funcionalidades principais, o fluxo de movimentação de produtos, e como ele se conecta de forma inteligente com a Secretaria IA (via WhatsApp/Evolution API) e o Módulo Financeiro (Asaas). O objetivo é demonstrar como a gestão de produtos e serviços se torna uma parte fluida e automatizada da operação da clínica do médico.

## 1. O Propósito do Módulo de Estoque e Serviços

O Módulo de Estoque e Serviços foi desenvolvido para dar ao médico um controle completo sobre tudo o que ele oferece na clínica, desde produtos físicos (medicamentos, kits) até os diversos tipos de serviços (consultas, exames, procedimentos). Ele centraliza o gerenciamento, automatiza o controle de inventário e se integra perfeitamente com os processos de comunicação e financeiro.

## 2. Cadastro de Produtos e Serviços

No coração do módulo, o médico pode registrar detalhadamente cada item oferecido por sua clínica.

### 2.1. Produtos (Ex: Medicamentos, Kits de Higiene)

*   **Informações Essenciais:** Para cada produto, o médico cadastra:
    *   **Nome e Descrição:** Como o produto será identificado.
    *   **Código/SKU:** Para organização e leitura por códigos de barra.
    *   **Preço de Venda:** O valor que será cobrado dos pacientes.
    *   **Preço de Custo:** Para cálculo de lucratividade.
    *   **Estoque Atual:** A quantidade de unidades disponíveis.
    *   **Estoque Mínimo:** Um limite para que o sistema saiba quando alertar sobre a necessidade de reposição.
    *   **Unidade de Medida:** (ex: Unidade, Caixa, Frasco).
*   **Controle de Inventário:** O sistema automaticamente ajusta o estoque quando uma venda é registrada ou quando novos produtos são adicionados.

### 2.2. Serviços (Ex: Consultas, Exames, Procedimentos)

*   **Informações Essenciais:** Para cada serviço, o médico cadastra:
    *   **Nome e Descrição:** Detalhes sobre o tipo de atendimento.
    *   **Duração Estimada:** Para integração com a agenda.
    *   **Preço do Serviço:** O valor da consulta, exame ou procedimento.
    *   **Categoria:** (ex: Clínica Geral, Dermatologia, Fisioterapia).
*   **Sem Controle de Estoque Físico:** Como são serviços, não há "estoque" físico, mas o cadastro é crucial para a precificação e faturamento.

## 3. Movimentação de Estoque: O Ciclo de Vida do Produto/Serviço

Este módulo registra todas as entradas e saídas, garantindo que o inventário esteja sempre atualizado e que as vendas sejam corretamente processadas.

### 3.1. Entradas (Compras, Reposições)

*   Quando novos produtos chegam à clínica (compras de fornecedores), o médico ou sua equipe registra a entrada no sistema, aumentando o estoque disponível.
*   Isso pode ser manual ou, no futuro, via integração com sistemas de fornecedores.

### 3.2. Saídas (Vendas, Uso Interno)

*   **Vendas a Pacientes:** Ao final de uma consulta, se o médico vende um medicamento ou realiza um procedimento, ele registra essa "saída" no sistema. O estoque do produto é automaticamente diminuído.
*   **Uso Interno:** Para produtos usados internamente na clínica (ex: materiais de escritório), também é possível registrar a saída para controle.

**Conexão CRÍTICA com o Módulo Financeiro (Asaas):**
O registro de uma **venda** (saída de produto ou realização de serviço) no Módulo de Estoque **automaticamente dispara a criação de uma cobrança no Módulo Financeiro, via Asaas**. Isso significa que, ao marcar um item como "vendido" ou "serviço realizado", a fatura para o paciente é gerada instantaneamente, pronta para ser paga via Pix, Boleto ou Cartão de Crédito. Essa integração garante que nenhuma venda seja esquecida e simplifica o processo de faturamento para o médico.

## 4. Conexão Inteligente com a Secretaria IA (Evolution API): Gestão de Fornecedores

Um dos pontos mais inovadores do seu SaaS é como a Secretaria IA estende a funcionalidade do módulo de estoque para além da clínica, automatizando a comunicação com fornecedores.

### Fluxo de Reposição Automática:

1.  **Monitoramento Contínuo:** O sistema monitora constantemente o "Estoque Atual" de cada produto, comparando-o com o "Estoque Mínimo" definido pelo médico.
2.  **Gatilho de Reposição:** Quando o estoque de um produto atinge ou fica abaixo do seu limite mínimo, o sistema identifica a necessidade de reposição.
3.  **Comunicação com Fornecedores via WhatsApp (Secretaria IA):**
    *   Se o médico tiver pré-cadastrado os dados de contato de seus fornecedores (e autorizado a automação), a Secretaria IA entra em ação.
    *   Ela pode enviar uma mensagem automatizada de WhatsApp para o fornecedor responsável (ou para o médico com um alerta para ele mesmo contatar), indicando qual produto precisa ser reposto e a quantidade sugerida.
    *   **Exemplo de Mensagem da IA para o Fornecedor:** "Olá, [Nome do Fornecedor]! O produto 'XYZ' da Clínica [Nome da Clínica do Médico] está com estoque baixo. Precisamos repor 5 unidades. Por favor, confirme a disponibilidade e o prazo de entrega. Obrigado!"
4.  **Notificação ao Médico:** Além de contatar o fornecedor, a Secretaria IA também pode enviar um alerta para o médico no painel do SaaS ou via WhatsApp, informando sobre a reposição automática ou solicitando sua aprovação para um pedido maior.

Isso transforma a gestão de estoque de uma tarefa manual e reativa em um processo proativo e automatizado, economizando tempo e evitando a falta de produtos críticos.

## 5. Conexão Fundamental com o Módulo Financeiro (Asaas): Lucro e Faturamento

A integração entre o Módulo de Estoque/Serviços e o Módulo Financeiro é a chave para o controle financeiro preciso da clínica.

### Sinergia Direta:

*   **Faturamento Instantâneo:** Como mencionado, cada venda ou serviço registrado no módulo de estoque/serviços resulta diretamente na criação de uma cobrança no Asaas. Não há necessidade de digitação duplicada ou reconciliação manual de vendas com recebimentos.
*   **Transparência Total:** O status do pagamento de cada venda é atualizado em tempo real no Módulo Financeiro (via webhooks da Asaas), e essa informação pode ser visualizada no registro da venda no Módulo de Estoque/Serviços.
*   **Controle de Recebíveis:** O sistema sabe exatamente quais produtos/serviços foram faturados e qual o status de seus pagamentos, facilitando o acompanhamento dos recebíveis da clínica.

### Seção de Lucros e Análises:

O Módulo de Estoque, em conjunto com o Financeiro, oferece uma visão clara da saúde financeira dos produtos e serviços:

*   **Cálculo de Margem de Lucro:** Para produtos, o sistema calcula automaticamente a margem de lucro (`(Preço de Venda - Preço de Custo) / Preço de Venda`) para cada item vendido, fornecendo insights sobre a rentabilidade.
*   **Relatórios de Vendas por Item:** O médico pode gerar relatórios que mostram quais produtos e serviços são os mais vendidos, quais geram mais receita e quais são mais lucrativos.
*   **Performance por Período:** Acompanhe o lucro total de produtos e serviços em diferentes períodos (dia, semana, mês, ano), ajudando o médico a identificar tendências e tomar decisões estratégicas para o crescimento da clínica.

## Conclusão

O Módulo de Estoque e Serviços do seu SaaS não é apenas um inventário; é um centro de operações que se integra de forma inteligente com a Secretaria IA e o Módulo Financeiro. Ele transforma a gestão de suprimentos e o faturamento em processos eficientes e automatizados, garantindo que o médico tenha sempre o que precisa em mãos e total visibilidade sobre a rentabilidade de sua clínica. Essa integração completa é um pilar fundamental para a gestão moderna e eficiente do consultório médico. 