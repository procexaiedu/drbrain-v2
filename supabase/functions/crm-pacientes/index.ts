import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Function crm-pacientes loaded');

// Extrair a rota do URL
function extractRoute(url: string): { route: string; id?: string } {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  
  console.log('Original pathname:', pathname);
  
  // Para Edge Functions do Supabase, o pathname já vem limpo
  // Ex: /functions/v1/crm-pacientes -> queremos extrair o que vem depois de crm-pacientes
  
  let cleanPath = '';
  
  // Se o pathname contém o nome da função, extrair o que vem depois
  if (pathname.includes('crm-pacientes')) {
    const parts = pathname.split('crm-pacientes');
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
    // GET /pacientes/{id} ou PUT /pacientes/{id} ou DELETE /pacientes/{id}
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
    const { route, id } = extractRoute(req.url);
    console.log('Route extracted:', { route, id });

    // Roteamento baseado no método e rota
    switch (route) {
      case 'list':
        if (req.method === 'GET') {
          console.log('Calling listPacientes');
          return await listPacientes(medico_id, req);
        }
        if (req.method === 'POST') {
          console.log('Calling createPaciente');
          return await createPaciente(medico_id, req);
        }
        break;

      case 'single':
        if (req.method === 'GET') {
          return await getPaciente(medico_id, id!);
        }
        if (req.method === 'PUT') {
          return await updatePaciente(medico_id, id!, req);
        }
        if (req.method === 'DELETE') {
          return await deletePaciente(medico_id, id!);
        }
        break;
    }

    console.log('No matching route found for:', { method: req.method, route });
    return new Response(JSON.stringify({ error: 'Rota não encontrada' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    });

  } catch (error) {
    console.error('Erro na Edge Function crm-pacientes:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Listar pacientes do médico (com busca por nome)
async function listPacientes(medico_id: string, req: Request) {
  try {
    console.log('listPacientes called for medico_id:', medico_id);
    
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    console.log('Query params:', { search, page, limit, offset });

    let query = supabaseAdmin
      .from('pacientes')
      .select('id, nome_completo, cpf, data_cadastro_paciente')
      .eq('medico_id', medico_id);

    // Aplicar filtro de busca por nome se fornecido
    if (search.trim()) {
      query = query.ilike('nome_completo', `%${search.trim()}%`);
    }

    const { data, error } = await query
      .order('nome_completo', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erro ao listar pacientes:', error);
      return new Response(JSON.stringify({ error: 'Erro ao buscar pacientes', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log(`Found ${(data || []).length} pacientes`);

    return new Response(JSON.stringify({ pacientes: data || [], page, limit }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em listPacientes:', error);
    return new Response(JSON.stringify({ error: 'Erro interno', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Obter um paciente específico
async function getPaciente(medico_id: string, paciente_id: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('pacientes')
      .select('*')
      .eq('id', paciente_id)
      .eq('medico_id', medico_id)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Paciente não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em getPaciente:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Criar novo paciente
async function createPaciente(medico_id: string, req: Request) {
  try {
    const { nome_completo, cpf } = await req.json();

    // Validar dados obrigatórios
    if (!nome_completo || !cpf) {
      return new Response(JSON.stringify({ 
        error: 'Dados obrigatórios ausentes',
        details: 'nome_completo e cpf são obrigatórios'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Limpar e validar CPF (remover caracteres não numéricos)
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      return new Response(JSON.stringify({ 
        error: 'CPF inválido',
        details: 'CPF deve conter 11 dígitos'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Verificar se já existe paciente com mesmo CPF para este médico
    const { data: existingPaciente } = await supabaseAdmin
      .from('pacientes')
      .select('id')
      .eq('medico_id', medico_id)
      .eq('cpf', cpfLimpo)
      .single();

    if (existingPaciente) {
      return new Response(JSON.stringify({ 
        error: 'Paciente já cadastrado',
        details: 'Já existe um paciente com este CPF'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 409,
      });
    }

    // Criar novo paciente
    const { data: novoPaciente, error } = await supabaseAdmin
      .from('pacientes')
      .insert({
        medico_id,
        nome_completo: nome_completo.trim(),
        cpf: cpfLimpo,
        data_cadastro_paciente: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar paciente:', error);
      return new Response(JSON.stringify({ 
        error: 'Erro ao criar paciente', 
        details: error.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify(novoPaciente), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error('Erro em createPaciente:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Atualizar paciente
async function updatePaciente(medico_id: string, paciente_id: string, req: Request) {
  try {
    const updateData = await req.json();
    
    // Remover campos que não devem ser atualizados
    delete updateData.id;
    delete updateData.medico_id;
    delete updateData.data_cadastro_paciente;

    // Se CPF estiver sendo atualizado, validar e limpar
    if (updateData.cpf) {
      const cpfLimpo = updateData.cpf.replace(/\D/g, '');
      if (cpfLimpo.length !== 11) {
        return new Response(JSON.stringify({ 
          error: 'CPF inválido',
          details: 'CPF deve conter 11 dígitos'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
      updateData.cpf = cpfLimpo;
    }

    if (updateData.nome_completo) {
      updateData.nome_completo = updateData.nome_completo.trim();
    }

    const { data, error } = await supabaseAdmin
      .from('pacientes')
      .update(updateData)
      .eq('id', paciente_id)
      .eq('medico_id', medico_id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar paciente:', error);
      return new Response(JSON.stringify({ error: 'Erro ao atualizar paciente' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Paciente não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em updatePaciente:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Deletar paciente
async function deletePaciente(medico_id: string, paciente_id: string) {
  try {
    // Verificar se existem prontuários para este paciente
    const { data: prontuarios, error: prontuariosError } = await supabaseAdmin
      .from('prontuarios')
      .select('id')
      .eq('paciente_id', paciente_id)
      .eq('medico_id', medico_id)
      .limit(1);

    if (prontuariosError) {
      console.error('Erro ao verificar prontuários:', prontuariosError);
      return new Response(JSON.stringify({ error: 'Erro ao verificar dependências' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (prontuarios && prontuarios.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Não é possível excluir paciente',
        details: 'Paciente possui prontuários associados'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Deletar paciente
    const { error } = await supabaseAdmin
      .from('pacientes')
      .delete()
      .eq('id', paciente_id)
      .eq('medico_id', medico_id);

    if (error) {
      console.error('Erro ao deletar paciente:', error);
      return new Response(JSON.stringify({ error: 'Erro ao excluir paciente' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em deletePaciente:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
} 