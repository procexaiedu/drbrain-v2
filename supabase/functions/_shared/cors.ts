// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Permitindo todos os origins para desenvolvimento e produção
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'false', // Mudando para false quando usando *
};

// Headers dinâmicos baseados no ambiente
export function getCorsHeaders(request: Request) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = [
    'http://localhost:3000',
    'https://doctorbrain.procexai.tech'
  ];
  
  const allowOrigin = allowedOrigins.includes(origin || '') ? (origin || '*') : '*';
  
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
} 