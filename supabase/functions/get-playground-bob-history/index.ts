import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface HistoryMessageFromDB {
  id: number;
  session_id: string;
  message: {
    type: 'human' | 'ai' | string;
    content: string;
  };
}

// Função robusta para extrair apenas o conteúdo limpo das mensagens
function extractCleanContent(content: string): string {
  if (!content) return '';
  
  // Se for uma mensagem do usuário (human), tentar extrair da tag mensagem_cliente
  if (content.includes('<mensagem_cliente>')) {
    const match = content.match(/<mensagem_cliente>\s*"?([^"<]+)"?\s*<\/mensagem_cliente>/);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Se for mensagem do usuário em outras tags
  if (content.includes('<mensagem_paciente>')) {
    const match = content.match(/<mensagem_paciente>\s*"?([^"<]+)"?\s*<\/mensagem_paciente>/);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Para mensagens da IA, remover todas as tags XML e metadados
  let cleaned = content
    // Remover blocos de metadados
    .replace(/<data_atual>.*?<\/data_atual>/gs, '')
    .replace(/<mensagem_cliente>.*?<\/mensagem_cliente>/gs, '')
    .replace(/<mensagem_paciente>.*?<\/mensagem_paciente>/gs, '')
    .replace(/<response_metadata>.*?<\/response_metadata>/gs, '')
    .replace(/<additional_kwargs>.*?<\/additional_kwargs>/gs, '')
    // Remover outras tags XML
    .replace(/<[^>]*>/g, '')
    // Limpar quebras de linha extras e espaços
    .replace(/\n\s*\n/g, '\n')
    .trim();
  
  // Se ainda houver conteúdo válido após limpeza, retornar
  if (cleaned && cleaned.length > 0) {
    return cleaned;
  }
  
  // Fallback: retornar conteúdo original se a limpeza resultou em string vazia
  return content;
}

console.log('Function get-playground-bob-history loaded');

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const medico_id = url.searchParams.get('medico_id');

    if (!medico_id) {
      return new Response(JSON.stringify({ error: 'medico_id é obrigatório' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user || user.id !== medico_id) {
      return new Response(JSON.stringify({ error: 'Não autorizado ou medico_id não corresponde' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { data, error } = await supabaseAdmin
      .from('n8n_engenheiroprompt_drbrain') // Tabela correta para o Bob
      .select('id, session_id, message')
      .eq('session_id', medico_id)
      .order('id', { ascending: true });

    if (error) {
      console.error('Erro ao buscar histórico do Bob (Playground):', error);
      return new Response(JSON.stringify({ error: 'Falha ao buscar histórico do Bob', details: error.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
      });
    }

    const transformedMessages = data.map((dbRow: HistoryMessageFromDB) => {
      const messageContent = dbRow.message;
      return {
        id: `pg_bob_db_${dbRow.id}`,
        text: extractCleanContent(messageContent.content),
        sender: messageContent.type === 'human' ? 'user' : 'agent',
        timestamp: new Date().toISOString(), // Fallback
      };
    });

    return new Response(JSON.stringify(transformedMessages), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro na Edge Function get-playground-bob-history:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno do servidor' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 