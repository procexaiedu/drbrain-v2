// supabase/functions/token-issuer/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Chave secreta que apenas o seu workflow de IA deve conhecer.
// Carregue-a das variáveis de ambiente seguras do Supabase.
const WORKFLOW_API_KEY = Deno.env.get('WORKFLOW_API_KEY');
if (!WORKFLOW_API_KEY) {
  console.error('A variável de ambiente WORKFLOW_API_KEY não está definida.');
}

// Função principal que responde às requisições
Deno.serve(async (req) => {
  // Responde à requisição pre-flight OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Autenticação do Sistema de IA (o "cliente")
    const requestApiKey = req.headers.get('x-api-key');
    if (!requestApiKey || requestApiKey !== WORKFLOW_API_KEY) {
      return new Response(JSON.stringify({ error: 'Acesso não autorizado: Chave de API do serviço inválida ou ausente.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Validação da Requisição
    const { medico_id } = await req.json();
    if (!medico_id) {
      return new Response(JSON.stringify({ error: 'O campo "medico_id" é obrigatório no corpo da requisição.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Criação de um Cliente Supabase com privilégios de administrador
    //    Isto é necessário para poder gerar tokens para outros usuários.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use a chave de "service_role"
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 4. Geração do Token de Acesso para o médico
    //    Usamos a função admin.generateLink, pois ela nos dá um token de acesso direto.
    const { data: { user } , error: userError } = await supabaseAdmin.auth.admin.getUserById(medico_id);

    if (userError || !user) {
      throw new Error(`Usuário com medico_id ${medico_id} não encontrado.`);
    }

    // A propriedade "aud" precisa ser 'authenticated'
    const { data, error } = await supabaseAdmin.auth.signInWithId(user.id);

    if (error) {
        throw new Error(`Não foi possível gerar o token: ${error.message}`);
    }

    const accessToken = data.session?.access_token;
    if (!accessToken) {
      throw new Error('Falha ao extrair o token de acesso da sessão gerada.');
    }

    // 5. Retorno do Token de Acesso
    return new Response(JSON.stringify({
      accessToken: accessToken,
      expiresIn: data.session?.expires_in, // informa a validade do token em segundos
      tokenType: 'Bearer'
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