# Padronizar chamadas de API no frontend
_Exported on 7/29/2025 at 16:42:36 GMT-3 from Cursor (1.2.4)_

---

**User**

O objetivo é forçar uma padronização absoluta em todas as chamadas de API do frontend para resolver todos os erros 404 e de CORS. A configuração em frontend/next.config.js define que o único prefixo válido para o redirecionamento de API é /api/. Qualquer variação como /api/v1/ ou /api/edge/ está incorreta e é a causa dos erros.

Execute as seguintes buscas e substituições em toda a pasta frontend para restaurar o padrão funcional:

Padronize todos os prefixos de API para /api/. Realize as seguintes substituições:

Encontre todas as ocorrências de '/api/v1/ e substitua por '/api/.

Encontre todas as ocorrências de '/api/edge/v1/ e substitua por '/api/.

Encontre todas as ocorrências de '/api/edge/ e substitua por '/api/.

Encontre todas as ocorrências de '/edge/v1/ e substitua por '/api/.

Elimine qualquer uso restante de variáveis de ambiente ou URLs diretas nas chamadas fetch.

Procure por process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL e erutqtbknunsjfnkeevt.supabase.co. Qualquer chamada fetch que ainda utilize essas strings deve ser reescrita para usar o caminho relativo /api/.

Exemplo da transformação final necessária:

SE ESTIVER: fetch('/api/v1/agenda-crud-events', ...)

DEVE FICAR: fetch('/api/agenda-crud-events', ...)

SE ESTIVER: fetch('/api/edge/crm-leads-management', ...)

DEVE FICAR: fetch('/api/crm-leads-management', ...)

O resultado final é que toda e qualquer chamada fetch para uma Edge Function no código deve, sem exceção, começar com /api/, seguido diretamente pelo nome da função. Execute esta tarefa em todos os arquivos necessários."

---

**Cursor**

Compreendi. Para padronizar todas as chamadas de API no frontend para o prefixo `/api/` e resolver os erros de CORS e 404, vou seguir o seguinte plano:

1.  Procurar e substituir todas as ocorrências de `/api/v1/` por `/api/`.
2.  Procurar e substituir todas as ocorrências de `/api/edge/v1/` por `/api/`.
3.  Procurar e substituir todas as ocorrências de `/api/edge/` por `/api/`.
4.  Procurar e substituir todas as ocorrências de `/edge/v1/` por `/api/`.
5.  Procurar por `fetch` chamadas que contenham `process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL` e reescrevê-las para usar o caminho relativo `/api/` seguido pelo nome da função.
6.  Procurar por `fetch` chamadas que contenham `erutqtbknunsjfnkeevt.supabase.co` e reescrevê-las para usar o caminho relativo `/api/` seguido pelo nome da função.

Vou começar pesquisando por `/api/v1/` dentro da pasta `frontend`.


Ótimo, encontrei algumas ocorrências de `/api/v1/`. Agora vou substituí-las por `/api/` nos arquivos encontrados.

Em seguida, continuarei com as próximas substituições.


```typescriptreact
// ... existing code ...
  const response = await fetch('/api/get-medico-profile', {
// ... existing code ...
  const response = await fetch(`/api/get-onboarding-history?sessionId=${encodeURIComponent(user.id)}`, {
// ... existing code ...
  const response = await fetch('/api/onboarding-chat', {
// ... existing code ...
  const response = await fetch('/api/limpar-historico-onboarding', {
// ... existing code ...
```

```typescriptreact
// ... existing code ...
  let url = '/api/agenda-crud-events';
// ... existing code ...
  const response = await fetch('/api/agenda-crud-events', {
// ... existing code ...
  const response = await fetch(`/api/agenda-crud-events/${eventId}`, {
// ... existing code ...
  const response = await fetch(`/api/agenda-crud-events/${eventId}`, {
// ... existing code ...
  const response = await fetch('/api/secretaria-ia-agendamento/contact-patient', {
// ... existing code ...
```

```typescriptreact
// ... existing code ...
  const response = await fetch('/api/create-medico-admin', {
// ... existing code ...
```

As substituições para `/api/v1/` foram aplicadas. Agora, vou procurar por todas as ocorrências de `/api/edge/v1/` e substituí-las por `/api/`.


Não foram encontradas ocorrências de `/api/edge/v1/`.

Agora, vou procurar por todas as ocorrências de `/api/edge/` e substituí-las por `/api/`.


Não foram encontradas ocorrências de `/api/edge/`.

Agora, vou procurar por todas as ocorrências de `/edge/v1/` e substituí-las por `/api/`.


Encontrei ocorrências de `/edge/v1/`. Vou substituí-las por `/api/` nos arquivos encontrados.


```javascript
// ... existing code ...
    source: '/api/:path*',
// ... existing code ...
```

```typescriptreact
// ... existing code ...
    const response = await fetch(`/api/get-feedback-history?medico_id=${user.id}`, {
// ... existing code ...
    const response = await fetch('/api/limpar-memoria-feedback', {
// ... existing code ...
    const response = await fetch('/api/feedback-chat', {
// ... existing code ...
```

```typescriptreact
// ... existing code ...
    const response = await fetch('/api/get-medico-profile', {
// ... existing code ...
```

```typescriptreact
// ... existing code ...
    const response = await fetch('/api/google-calendar-auth-status', {
// ... existing code ...
    const connectUrl = '/api/google-calendar-auth-connect';
// ... existing code ...
    const response = await fetch('/api/google-calendar-auth-disconnect', { // Endpoint a ser criado
// ... existing code ...
```

```typescriptreact
// ... existing code ...
    const response = await fetch('/api/get-medico-profile', {
// ... existing code ...
    const response = await fetch('/api/update-medico-profile', {
// ... existing code ...
```

As substituições para `/edge/v1/` foram aplicadas.

Agora, vou procurar por chamadas `fetch` que contenham `process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL` e reescrevê-las para usar o caminho relativo `/api/` seguido pelo nome da função.


Não foram encontradas chamadas `fetch` com `process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL`.

Por fim, vou procurar por chamadas `fetch` que contenham `erutqtbknunsjfnkeevt.supabase.co` e reescrevê-las para usar o caminho relativo `/api/` seguido pelo nome da função.


Todas as substituições foram realizadas conforme o plano. As chamadas de API no frontend agora devem estar padronizadas para usar o prefixo `/api/`.

**Resumo das ações realizadas:**

*   **Padronização de prefixos de API:**
    *   Todas as ocorrências de `/api/v1/` foram substituídas por `/api/` nos seguintes arquivos:
        *   `frontend/app/(app)/onboarding/page.tsx`
        *   `frontend/app/(app)/agenda/page.tsx`
        *   `frontend/app/(app)/admin/create-doctor/page.tsx`
    *   Não foram encontradas ocorrências de `/api/edge/v1/`.
    *   Não foram encontradas ocorrências de `/api/edge/`.
    *   Todas as ocorrências de `/edge/v1/` foram substituídas por `/api/` nos seguintes arquivos:
        *   `frontend/next.config.js`
        *   `frontend/components/ui/FeedbackModal.tsx`
        *   `frontend/app/(app)/layout.tsx`
        *   `frontend/app/(app)/settings/connections/page.tsx`
        *   `frontend/app/(app)/settings/profile/page.tsx`
*   **Eliminação de variáveis de ambiente e URLs diretas:**
    *   Não foram encontradas chamadas `fetch` utilizando `process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL`.
    *   Não foram encontradas chamadas `fetch` utilizando `erutqtbknunsjfnkeevt.supabase.co`.

Com essas alterações, todas as chamadas `fetch` para as Edge Functions no frontend devem seguir o padrão `/api/` seguido diretamente pelo nome da função, conforme solicitado.

