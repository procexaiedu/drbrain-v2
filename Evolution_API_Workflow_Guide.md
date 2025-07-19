# Guia de Fluxo de Uso: Conectando o WhatsApp do Médico à Secretaria IA (Evolution API)

Este documento explica, de forma clara e não-técnica, como o seu SaaS utiliza a Evolution API para integrar o WhatsApp pessoal do médico com a Secretaria IA. O objetivo é detalhar a experiência do médico e do paciente no dia a dia da comunicação, complementando o guia técnico.

## 1. O Coração da Comunicação: A Conexão WhatsApp do Médico

Para que a Secretaria IA possa funcionar, o primeiro e mais crucial passo é conectar o WhatsApp do médico à sua plataforma. Pense nisso como ativar o "telefone" da Secretaria IA para que ela possa conversar com os pacientes.

### 1.1. Como o Médico Conecta seu WhatsApp (Onboarding no seu SaaS):

1.  **"Ativar Secretaria IA" (No Painel de confiurações, em "Conexões de Aplicativo"):** No painel de configuração, o médico encontrará uma opção clara como "Conectar WhatsApp", "Ativar Secretaria IA" ou "Parear WhatsApp".
2.  **Geração do QR Code:** Ao clicar, seu sistema (nos bastidores, usando a Evolution API) solicitará um QR Code de pareamento. Este QR Code será gerado pela Evolution API especificamente para a conta do médico.
3.  **Leitura do QR Code:** O médico simplesmente abre o aplicativo WhatsApp em seu celular (na conta que deseja usar para a clínica), vai em "Aparelhos Conectados" (ou "WhatsApp Web/Desktop") e escaneia o QR Code exibido na tela do seu SaaS. É o mesmo processo de conectar o WhatsApp no computador.
4.  **Conexão Estabelecida:** Uma vez escaneado, o WhatsApp do médico estará conectado ao seu SaaS. Uma mensagem de "Conectado!" ou um ícone de status verde aparecerá no painel do médico. A partir desse momento, a Secretaria IA estará pronta para atuar!

**O que acontece nos bastidores (para o seu SaaS):**
*   Seu sistema cria uma **Instância** na Evolution API para aquele médico.
*   A Evolution API envia o QR Code e, quando ele é lido, notifica seu sistema sobre a conexão.
*   Seu SaaS salva o `instanceName` (o ID da conexão do médico) e o `token` da instância para uso futuro.

### 1.2. Mantendo a Conexão Ativa:

A conexão WhatsApp depende de o celular do médico estar online e com o WhatsApp funcionando. Seu SaaS monitorará o status dessa conexão:

*   **Status em Tempo Real:** No painel do médico, ele sempre verá o status de sua conexão WhatsApp (ex: "Online", "Desconectado").
*   **Notificações:** Se a conexão cair, seu sistema poderá alertar o médico para que ele reabra o WhatsApp no celular e garanta que está online.

## 2. A Secretaria IA em Ação: Conversando com os Pacientes

Com o WhatsApp do médico conectado, a Secretaria IA assume o controle das interações iniciais e rotineiras com os pacientes.





**O que acontece nos bastidores (para o seu SaaS e n8n):**
*   A Evolution API notifica seu n8n (`Webhook`) sobre cada nova mensagem recebida (`MESSAGES_UPSERT`).
*   Seu workflow no n8n recebe a mensagem, identifica o médico e o paciente.
*   O n8n envia a mensagem para a sua lógica de IA (que pode ser hospedada em outro local ou rodar no próprio n8n).
*   Sua lógica de IA processa a mensagem e gera uma resposta.
*   O n8n usa a Evolution API para enviar a resposta da IA de volta ao paciente (`sendText` ou outro tipo de mensagem).

## 3. Monitoramento e Intervenção do Médico

O médico não está de fora do ciclo. Ele tem controle total e pode intervir a qualquer momento. Temos que desenvolver uma UI semelhante ao whatsapp web, seguindo os mesmos padrões de UI dos outro módulos. seguindo  @cores_drbrain.txt

### 3.1. Visão das Conversas na Interface do SaaS:

*   **Histórico Completo:** O médico pode acessar o histórico de todas as conversas entre a Secretaria IA e os pacientes, diretamente no seu painel. Isso inclui mensagens enviadas e recebidas.
*   **Resumos Inteligentes:** A Secretaria IA pode gerar resumos rápidos das conversas mais longas ou complexas, destacando pontos importantes para o médico.

### 3.2. Intervenção Manual:

*   **Assumir Atendimento:** Se um paciente tiver uma dúvida muito complexa ou a IA não conseguir resolver, o médico pode "assumir" a conversa a partir do seu painel do SaaS e responder diretamente pelo seu sistema. A IA, então, pausa o atendimento daquele contato.
*   **Envio de Mensagens Manuais:** O médico pode enviar mensagens proativas para os pacientes a qualquer momento, diretamente do seu painel, utilizando o mesmo número de WhatsApp conectado.

**O que acontece nos bastidores (para o seu SaaS e n8n):**
*   Sua lógica de n8n pode ser configurada para que, quando o médico envia uma mensagem manual, a Secretaria IA saiba que ele "assumiu" e pause seu fluxo para aquele paciente (`stopBotFromMe: true` na configuração do bot).
*   As mensagens enviadas pelo médico também podem ser registradas no histórico via webhooks da Evolution API (`SEND_MESSAGE`).

## 4. Integração com Módulos Internos (Estoque, Serviços, Financeiro)

A inteligência da Secretaria IA é ampliada pela integração com os outros módulos do seu SaaS.

*   **Agendamento e Financeiro:** Quando a IA agenda uma consulta, essa informação é enviada para o módulo de agendamento do seu SaaS. Se a consulta for paga antecipadamente, o módulo financeiro (integrado com Asaas) gera a cobrança automaticamente.
*   **Venda de Produtos/Serviços:** Se a IA for configurada para oferecer produtos (ex: kits de higiene bucal para dentistas) ou procedimentos (ex: sessões de fisioterapia), ela pode registrar a "venda" no módulo de estoque/serviços, que por sua vez, dispara a emissão da cobrança via Asaas.
*   **Insights Unificados:** Os dados de conversas da IA, agendamentos, estoque/serviços e financeiro são combinados para fornecer ao médico um panorama completo da sua clínica. Ex: "Quantos pacientes agendados via IA efetivamente pagaram?", "Qual produto mais vendido após a interação da IA?".

## Conclusão

Ao conectar o WhatsApp do médico à sua plataforma via Evolution API, você cria uma Secretaria IA poderosa que não só automatiza a comunicação, mas se integra profundamente com todas as facetas da gestão da clínica. Isso oferece ao médico um assistente inteligente e eficiente, liberando seu tempo e otimizando a experiência do paciente. 