import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Function prontuarios-crud loaded');

// Extrair a rota do URL
function extractRoute(url: string): { route: string; id?: string; action?: string } {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  
  console.log('Original pathname:', pathname);
  
  // Para Edge Functions do Supabase, o pathname já vem limpo
  // Ex: /functions/v1/prontuarios-crud -> queremos extrair o que vem depois de prontuarios-crud
  
  let cleanPath = '';
  
  // Se o pathname contém o nome da função, extrair o que vem depois
  if (pathname.includes('prontuarios-crud')) {
    const parts = pathname.split('prontuarios-crud');
    cleanPath = parts[1] || '';
  } else {
    // Fallback: usar o pathname completo
    cleanPath = pathname;
  }
  
  console.log('Clean path:', cleanPath);
  
  if (cleanPath === '' || cleanPath === '/') {
    return { route: 'list' };
  }
  
  const parts = cleanPath.split('/').filter(p => p);
  console.log('URL parts:', parts);
  
  if (parts.length === 1) {
    // GET /prontuarios/{id} ou PUT /prontuarios/{id} ou DELETE /prontuarios/{id}
    return { route: 'single', id: parts[0] };
  }
  
  if (parts.length === 2 && parts[1] === 'audio-url') {
    // GET /prontuarios/{id}/audio-url
    return { route: 'audio-url', id: parts[0] };
  }
  
  if (parts.length === 2 && parts[1] === 'finalizar') {
    // PUT /prontuarios/{id}/finalizar
    return { route: 'finalizar', id: parts[0] };
  }
  
  return { route: 'unknown' };
}

Deno.serve(async (req: Request) => {
  console.log(`${req.method} ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar autenticação - usando o mesmo padrão das funções que funcionam
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Authorization header missing');
      return new Response(JSON.stringify({ error: 'Authorization header missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      console.error('Erro de autenticação:', userError);
      return new Response(JSON.stringify({ error: 'Não autorizado', details: userError?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    console.log('User authenticated:', user.id);
    const medico_id = user.id;
    const { route, id, action } = extractRoute(req.url);
    console.log('Route extracted:', { route, id, action });

    // Roteamento baseado no método e rota
    switch (route) {
      case 'list':
        if (req.method === 'GET') {
          console.log('Calling listProntuarios');
          return await listProntuarios(medico_id, req);
        }
        break;

      case 'single':
        if (req.method === 'GET') {
          return await getProntuario(medico_id, id!);
        }
        if (req.method === 'PUT') {
          return await updateProntuario(medico_id, id!, req);
        }
        if (req.method === 'DELETE') {
          return await deleteProntuario(medico_id, id!);
        }
        break;
        
      case 'audio-url':
        if (req.method === 'GET') {
          return await getAudioUrl(medico_id, id!);
        }
        break;
        
      case 'finalizar':
        if (req.method === 'PUT') {
          return await finalizarProntuario(medico_id, id!, req);
        }
        break;
    }

    console.log('No matching route found for:', { method: req.method, route });
    return new Response(JSON.stringify({ error: 'Rota não encontrada' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    });

  } catch (error) {
    console.error('Erro na Edge Function prontuarios-crud:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Listar prontuários do médico (com busca e filtros)
async function listProntuarios(medico_id: string, req: Request) {
  try {
    console.log('listProntuarios called for medico_id:', medico_id);
    
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    console.log('Query params:', { search, status, page, limit, offset });

    let query = supabaseAdmin
      .from('prontuarios')
      .select(`
        id,
        paciente_id,
        data_consulta,
        status_prontuario,
        data_ultima_modificacao,
        pacientes!inner(nome_completo)
      `)
      .eq('medico_id', medico_id);

    // Aplicar filtro de busca por nome do paciente se fornecido
    if (search.trim()) {
      query = query.ilike('pacientes.nome_completo', `%${search.trim()}%`);
    }
    
    // Aplicar filtro de status se fornecido
    if (status.trim()) {
      query = query.eq('status_prontuario', status.trim());
    }

    const { data, error } = await query
      .order('data_ultima_modificacao', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erro ao listar prontuários:', error);
      return new Response(JSON.stringify({ error: 'Erro ao buscar prontuários', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log(`Found ${(data || []).length} prontuários`);

    // Transformar dados para incluir nome do paciente no nível raiz
    const prontuarios = (data || []).map(item => ({
      id: item.id,
      paciente_id: item.paciente_id,
      nome_paciente: item.pacientes.nome_completo,
      data_consulta: item.data_consulta,
      status_prontuario: item.status_prontuario,
      data_ultima_modificacao: item.data_ultima_modificacao
    }));

    return new Response(JSON.stringify({ prontuarios, page, limit }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em listProntuarios:', error);
    return new Response(JSON.stringify({ error: 'Erro interno', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Obter um prontuário específico
async function getProntuario(medico_id: string, prontuario_id: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('prontuarios')
      .select(`
        *,
        pacientes!inner(nome_completo, cpf)
      `)
      .eq('id', prontuario_id)
      .eq('medico_id', medico_id)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Prontuário não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Transformar dados para incluir informações do paciente no nível raiz
    const prontuario = {
      ...data,
      nome_paciente: data.pacientes.nome_completo,
      cpf_paciente: data.pacientes.cpf
    };
    
    delete prontuario.pacientes;

    return new Response(JSON.stringify(prontuario), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em getProntuario:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Atualizar prontuário (rascunho)
async function updateProntuario(medico_id: string, prontuario_id: string, req: Request) {
  try {
    const { conteudo_rascunho } = await req.json();

    if (typeof conteudo_rascunho !== 'string') {
      return new Response(JSON.stringify({ 
        error: 'Dados inválidos',
        details: 'conteudo_rascunho deve ser uma string'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { data, error } = await supabaseAdmin
      .from('prontuarios')
      .update({
        conteudo_rascunho,
        data_ultima_modificacao: new Date().toISOString()
      })
      .eq('id', prontuario_id)
      .eq('medico_id', medico_id)
      .select()
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Prontuário não encontrado ou erro ao atualizar' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em updateProntuario:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Finalizar prontuário
async function finalizarProntuario(medico_id: string, prontuario_id: string, req: Request) {
  try {
    const { conteudo_finalizado } = await req.json();

    if (!conteudo_finalizado || typeof conteudo_finalizado !== 'string') {
      return new Response(JSON.stringify({ 
        error: 'Dados inválidos',
        details: 'conteudo_finalizado é obrigatório e deve ser uma string'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { data, error } = await supabaseAdmin
      .from('prontuarios')
      .update({
        conteudo_finalizado,
        status_prontuario: 'FINALIZADO',
        data_ultima_modificacao: new Date().toISOString()
      })
      .eq('id', prontuario_id)
      .eq('medico_id', medico_id)
      .eq('status_prontuario', 'RASCUNHO_DISPONIVEL') // Só permite finalizar se está em rascunho
      .select()
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Prontuário não encontrado ou não pode ser finalizado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em finalizarProntuario:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Excluir prontuário
async function deleteProntuario(medico_id: string, prontuario_id: string) {
  try {
    // Verificar se o prontuário existe e pertence ao médico
    const { data: prontuario, error: fetchError } = await supabaseAdmin
      .from('prontuarios')
      .select('audio_storage_path')
      .eq('id', prontuario_id)
      .eq('medico_id', medico_id)
      .single();

    if (fetchError || !prontuario) {
      return new Response(JSON.stringify({ error: 'Prontuário não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Excluir arquivo do storage se existir
    if (prontuario.audio_storage_path) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('consultas-audio')
        .remove([prontuario.audio_storage_path]);
        
      if (storageError) {
        console.warn('Erro ao excluir arquivo do storage:', storageError);
        // Continua mesmo se houver erro no storage
      }
    }

    // Excluir registro do banco
    const { error: deleteError } = await supabaseAdmin
      .from('prontuarios')
      .delete()
      .eq('id', prontuario_id)
      .eq('medico_id', medico_id);

    if (deleteError) {
      console.error('Erro ao excluir prontuário:', deleteError);
      return new Response(JSON.stringify({ error: 'Erro ao excluir prontuário' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Prontuário excluído com sucesso' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em deleteProntuario:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Obter URL assinada para o áudio
async function getAudioUrl(medico_id: string, prontuario_id: string) {
  try {
    // Verificar se o prontuário existe e pertence ao médico
    const { data: prontuario, error: fetchError } = await supabaseAdmin
      .from('prontuarios')
      .select('audio_storage_path')
      .eq('id', prontuario_id)
      .eq('medico_id', medico_id)
      .single();

    if (fetchError || !prontuario) {
      return new Response(JSON.stringify({ error: 'Prontuário não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    if (!prontuario.audio_storage_path) {
      return new Response(JSON.stringify({ error: 'Áudio não disponível' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Gerar URL assinada (válida por 1 hora)
    const { data, error: signedUrlError } = await supabaseAdmin.storage
      .from('consultas-audio')
      .createSignedUrl(prontuario.audio_storage_path, 3600);

    if (signedUrlError || !data) {
      console.error('Erro ao gerar URL assinada:', signedUrlError);
      return new Response(JSON.stringify({ error: 'Erro ao gerar URL do áudio' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ audio_url: data.signedUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em getAudioUrl:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
} 