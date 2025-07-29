// supabase/functions/token-issuer/index.ts

import { create, getNumericDate, Header } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Carrega as chaves secretas do ambiente seguro do Supabase
const WORKFLOW_API_KEY = Deno.env.get('WORKFLOW_API_KEY');
const JWT_SECRET = Deno.env.get('JWT_SECRET');

if (!WORKFLOW_API_KEY || !JWT_SECRET) {
  console.error('As variáveis de ambiente WORKFLOW_API_KEY e JWT_SECRET são obrigatórias.');
}

// Função para criar uma chave de assinatura CryptoKey
async function getSigningKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

// Função principal que responde às requisições
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Apenas o método POST é permitido
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido. Utilize POST.' }), {
      status: 405, // Method Not Allowed
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Autenticação do Sistema de IA
    const requestApiKey = req.headers.get('x-api-key');
    if (requestApiKey !== WORKFLOW_API_KEY) {
      return new Response(JSON.stringify({ error: 'Acesso não autorizado: Chave de API inválida.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Validação do Corpo da Requisição
    const { medico_id } = await req.json();
    if (!medico_id) {
      return new Response(JSON.stringify({ error: 'O campo "medico_id" é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Verificação se o usuário (médico) realmente existe
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(medico_id);

    if (userError || !user) {
      throw new Error(`Usuário com medico_id ${medico_id} não encontrado ou erro ao buscar: ${userError?.message}`);
    }

    // 4. Geração Manual do Token JWT
    const key = await getSigningKey(JWT_SECRET!);
    const payload = {
      sub: medico_id, // Subject (o ID do usuário)
      role: 'authenticated', // Papel do usuário
      aud: 'authenticated', // Audience
      iat: getNumericDate(0), // Issued at (agora)
      exp: getNumericDate(60 * 60), // Expiration time (1 hora a partir de agora)
    };
    const header: Header = { alg: 'HS256', typ: 'JWT' };

    const accessToken = await create(header, payload, key);

    // 5. Retorno do Token de Acesso
    return new Response(JSON.stringify({
      accessToken: accessToken,
      tokenType: 'Bearer',
      expiresIn: 3600, // 1 hora em segundos
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('Erro na função token-issuer:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});