import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ATENÇÃO: Use variáveis de ambiente para SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface HistoryMessageFromDB {
  id: number; // ID da tabela n8n_onboarding_drbrain
  session_id: string; // Embora não selecionado, bom para referência da estrutura da tabela
  message: {
    type: 'human' | 'ai' | string; // 'human' para usuário, 'ai' para agente
    content: string;
    // Outros campos possíveis dentro do JSONB, como additional_kwargs, response_metadata
    additional_kwargs?: any;
    response_metadata?: any;
  };
  timestamp: string; // Coluna timestamp (timestamptz do DB será string aqui)
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Espera-se que o medico_id (que corresponde ao session_id na tabela) seja passado como query param
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId'); // ou medicoId, conforme o frontend enviar

    if (!sessionId) {
      return new Response(JSON.stringify({ message: 'sessionId é obrigatório' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Verificar autenticação - Idealmente, esta função também deve ser protegida
    // Para simplificar, vamos assumir que o RLS no Supabase protegeria a tabela se necessário,
    // ou que o acesso à função é restrito de outra forma.
    // No entanto, para funções que usam SERVICE_ROLE_KEY, RLS é bypassado.
    // Poderíamos verificar o token JWT aqui também, se a função for chamada pelo usuário diretamente.
    // Como será chamada pelo BFF (onboarding page), podemos confiar na sessão verificada lá.

    console.log(`Buscando histórico para session_id: ${sessionId}`);

    const { data, error } = await supabaseAdmin
      .from('n8n_onboarding_drbrain') // Nome da sua tabela
      .select('id, message, timestamp') // Adicionada a coluna timestamp
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true }); // Ordenar pelo novo timestamp para garantir a ordem cronológica correta

    if (error) {
      console.error('Erro ao buscar histórico de mensagens:', error);
      throw error;
    }

    console.log('Histórico bruto do DB:', data);

    // Transformar os dados para o formato esperado pelo frontend (Message[])
    // Esta transformação pode ser feita aqui ou no frontend.
    // Fazer aqui pode ser mais eficiente se a lógica for complexa.
    const transformedMessages = data.map((dbRow: HistoryMessageFromDB) => {
      return {
        id: `db_${dbRow.id}`, // Garante um ID único prefixado
        text: dbRow.message.content,
        sender: dbRow.message.type === 'human' ? 'user' : 'agent',
        timestamp: dbRow.timestamp, // Usar o timestamp diretamente do banco de dados
        userName: dbRow.message.type === 'human' ? 'Usuário' : 'Agente de Onboarding', // Placeholder
        // avatar: definir avatares com base no sender se necessário
      };
    });

    console.log('Histórico transformado:', transformedMessages);

    return new Response(JSON.stringify(transformedMessages), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro na Edge Function get-onboarding-history:', error.message);
    return new Response(JSON.stringify({ message: error.message || 'Erro interno do servidor ao buscar histórico' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 