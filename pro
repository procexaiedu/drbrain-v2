TS index.ts supabase\functions\update-prompt-laboratorio
 Cannot find name 'Deno'. ts(2304) [Ln 6, Col 1]

TS index.ts supabase\functions\whatsapp-manager
 Cannot find type definition file for 'https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts'. ts(2688) [Ln 1, Col 23]
 Cannot find name 'Deno'. ts(2304) [Ln 6, Col 27]
 Cannot find name 'Deno'. ts(2304) [Ln 7, Col 27]
 Cannot find name 'Deno'. ts(2304) [Ln 8, Col 25]
 Cannot find name 'Deno'. ts(2304) [Ln 11, Col 1]
 Cannot find name 'handleConnect'. ts(2304) [Ln 48, Col 22]
 Cannot find name 'handleStatus'. ts(2304) [Ln 50, Col 22]
 Cannot find name 'handleSendMessage'. ts(2304) [Ln 52, Col 22]
Esses erros indicam principalmente dois problemas:

Ambiente Deno não reconhecido: O TypeScript está reclamando que não encontra o nome Deno, ou seja, o ambiente em que você está rodando não tem suporte aos tipos globais do Deno.

Importação de tipos via ESM (Edge Runtime): A linha Cannot find type definition file for 'https://esm.sh/... mostra que o projeto está tentando importar tipos remotos e falha por não conseguir resolver ou carregar isso corretamente.

Funções não definidas no escopo: As funções handleConnect, handleStatus, handleSendMessage não estão definidas no escopo em que estão sendo usadas.