import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Function formularios-pre-consulta-management loaded');

// Extrair a rota do URL
function extractRoute(url: string): { route: string; id?: string; action?: string } {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  
  console.log('Original pathname:', pathname);
  
  let cleanPath = '';
  
  if (pathname.includes('formularios-pre-consulta-management')) {
    const parts = pathname.split('formularios-pre-consulta-management');
    cleanPath = parts[1] || '';
  } else {
    cleanPath = pathname;
  }
  
  console.log('Clean path:', cleanPath);
  
  const parts = cleanPath.split('/').filter(p => p);
  console.log('URL parts:', parts);
  
  if (parts.length === 0) {
    return { route: 'list' };
  }

  if (parts.length === 1) {
    return { route: 'single', id: parts[0] };
  }
  
  return { route: 'unknown' };
}

Deno.serve(async (req: Request) => {
  console.log(`${req.method} ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
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
    const { route, id } = extractRoute(req.url);
    console.log('Route extracted:', { route, id });

    // Roteamento baseado no método e rota
    switch (route) {
      case 'list':
        if (req.method === 'GET') {
          return await listFormularios(medico_id, req);
        }
        if (req.method === 'POST') {
          return await createFormulario(medico_id, req);
        }
        break;

      case 'single':
        if (req.method === 'GET') {
          return await getFormulario(medico_id, id!);
        }
        if (req.method === 'PUT') {
          return await updateFormulario(medico_id, id!, req);
        }
        break;
    }

    return new Response(JSON.stringify({ error: 'Rota não encontrada' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    });

  } catch (error) {
    console.error('Erro na Edge Function formularios-pre-consulta-management:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Funções de CRUD para Formulários de Pré-Consulta
async function listFormularios(medico_id: string, req: Request) {
  try {
    const url = new URL(req.url);
    const paciente_id = url.searchParams.get('paciente_id') || '';
    const status = url.searchParams.get('status') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('formularios_pre_consulta')
      .select('*, pacientes(nome_completo)', { count: 'exact' })
      .eq('medico_id', medico_id);

    if (paciente_id) {
      query = query.eq('paciente_id', paciente_id);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query
      .order('data_consulta', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erro ao listar formulários:', error);
      return new Response(JSON.stringify({ error: 'Erro ao buscar formulários', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ 
      data: data || [], 
      page, 
      limit,
      total: count || 0,
      hasMore: (data || []).length === limit 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em listFormularios:', error);
    return new Response(JSON.stringify({ error: 'Erro interno', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function createFormulario(medico_id: string, req: Request) {
  try {
    const formularioData = await req.json();

    if (!formularioData.paciente_id || !formularioData.data_consulta || !formularioData.conteudo_json) {
      return new Response(JSON.stringify({ 
        error: 'Dados obrigatórios ausentes',
        details: 'paciente_id, data_consulta e conteudo_json são obrigatórios'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const insertData = {
      medico_id,
      ...formularioData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: novoFormulario, error } = await supabaseAdmin
      .from('formularios_pre_consulta')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar formulário:', error);
      return new Response(JSON.stringify({ 
        error: 'Erro ao criar formulário', 
        details: error.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify(novoFormulario), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error('Erro em createFormulario:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function getFormulario(medico_id: string, formulario_id: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('formularios_pre_consulta')
      .select('*, pacientes(nome_completo)')
      .eq('id', formulario_id)
      .eq('medico_id', medico_id)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Formulário não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em getFormulario:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function updateFormulario(medico_id: string, formulario_id: string, req: Request) {
  try {
    const updateData = await req.json();
    
    delete updateData.id;
    delete updateData.medico_id;
    delete updateData.created_at;

    const { data, error } = await supabaseAdmin
      .from('formularios_pre_consulta')
      .update(updateData)
      .eq('id', formulario_id)
      .eq('medico_id', medico_id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar formulário:', error);
      return new Response(JSON.stringify({ error: 'Erro ao atualizar formulário', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Formulário não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em updateFormulario:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}
