import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Function crm-pacientes-management loaded');

// Extrair a rota do URL
function extractRoute(url: string): { route: string; id?: string; action?: string } {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  
  console.log('Original pathname:', pathname);
  
  let cleanPath = '';
  
  if (pathname.includes('crm-pacientes-management')) {
    const parts = pathname.split('crm-pacientes-management');
    cleanPath = parts[1] || '';
  } else {
    cleanPath = pathname;
  }
  
  console.log('Clean path:', cleanPath);
  
  if (cleanPath === '' || cleanPath === '/') {
    return { route: 'list' };
  }
  
  const parts = cleanPath.split('/').filter(p => p);
  console.log('URL parts:', parts);
  
  if (parts.length === 1) {
    return { route: 'single', id: parts[0] };
  }
  
  if (parts.length === 2) {
    // /pacientes/{id}/status
    return { route: 'action', id: parts[0], action: parts[1] };
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
    const { route, id, action } = extractRoute(req.url);
    console.log('Route extracted:', { route, id, action });

    // Roteamento baseado no método e rota
    switch (route) {
      case 'list':
        if (req.method === 'GET') {
          return await listPacientes(medico_id, req);
        }
        if (req.method === 'POST') {
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

      case 'action':
        if (action === 'status' && req.method === 'PATCH') {
          return await updatePacienteStatus(medico_id, id!, req);
        }
        break;
    }

    return new Response(JSON.stringify({ error: 'Rota não encontrada' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    });

  } catch (error) {
    console.error('Erro na Edge Function crm-pacientes-management:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Listar pacientes do médico
async function listPacientes(medico_id: string, req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    console.log('Query params:', { search, status, page, limit, offset });

    let query = supabaseAdmin
      .from('pacientes')
      .select('*')
      .eq('medico_id', medico_id);

    // Aplicar filtros
    if (search.trim()) {
      query = query.or(`nome_completo.ilike.%${search.trim()}%,cpf.ilike.%${search.trim()}%,telefone_principal.ilike.%${search.trim()}%,email_paciente.ilike.%${search.trim()}%`);
    }

    if (status.trim()) {
      query = query.eq('status_paciente', status);
    }

    const { data, error, count } = await query
      .order('data_cadastro_paciente', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erro ao listar pacientes:', error);
      return new Response(JSON.stringify({ error: 'Erro ao buscar pacientes', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log(`Found ${(data || []).length} pacientes`);

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

    // Se veio de um lead, buscar informações do lead original
    if (data.lead_origem_id) {
      const { data: leadOrigem } = await supabaseAdmin
        .from('leads')
        .select('nome_lead, origem_lead, created_at as data_lead')
        .eq('id', data.lead_origem_id)
        .single();
      
      if (leadOrigem) {
        data.lead_origem_info = leadOrigem;
      }
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
    const pacienteData = await req.json();

    // Validar dados obrigatórios
    if (!pacienteData.nome_completo) {
      return new Response(JSON.stringify({ 
        error: 'Dados obrigatórios ausentes',
        details: 'nome_completo é obrigatório'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Validar e limpar CPF se fornecido
    if (pacienteData.cpf) {
      const cpfLimpo = pacienteData.cpf.replace(/\D/g, '');
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

      pacienteData.cpf = cpfLimpo;
    }

    // Preparar dados para inserção
    const insertData = {
      medico_id,
      nome_completo: pacienteData.nome_completo?.trim(),
      cpf: pacienteData.cpf || null,
      email_paciente: pacienteData.email_paciente?.trim() || null,
      telefone_principal: pacienteData.telefone_principal?.trim() || null,
      data_nascimento: pacienteData.data_nascimento || null,
      sexo: pacienteData.sexo || null,
      endereco_completo_json: pacienteData.endereco_completo_json || null,
      status_paciente: pacienteData.status_paciente || 'Paciente Ativo',
      notas_gerais_paciente: pacienteData.notas_gerais_paciente?.trim() || null,
      data_cadastro_paciente: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Limpar campos vazios
    Object.keys(insertData).forEach(key => {
      if (insertData[key] === '') {
        insertData[key] = null;
      }
    });

    const { data: novoPaciente, error } = await supabaseAdmin
      .from('pacientes')
      .insert(insertData)
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
    delete updateData.lead_origem_id;

    // Adicionar timestamp de atualização
    updateData.updated_at = new Date().toISOString();

    // Validar e limpar CPF se fornecido
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

      // Verificar se já existe outro paciente com mesmo CPF para este médico
      const { data: existingPaciente } = await supabaseAdmin
        .from('pacientes')
        .select('id')
        .eq('medico_id', medico_id)
        .eq('cpf', cpfLimpo)
        .neq('id', paciente_id)
        .single();

      if (existingPaciente) {
        return new Response(JSON.stringify({ 
          error: 'CPF já cadastrado',
          details: 'Outro paciente já possui este CPF'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409,
        });
      }

      updateData.cpf = cpfLimpo;
    }

    // Limpar strings
    if (updateData.nome_completo) updateData.nome_completo = updateData.nome_completo.trim();
    if (updateData.email_paciente) updateData.email_paciente = updateData.email_paciente.trim();
    if (updateData.telefone_principal) updateData.telefone_principal = updateData.telefone_principal.trim();
    if (updateData.notas_gerais_paciente) updateData.notas_gerais_paciente = updateData.notas_gerais_paciente.trim();

    // Limpar campos vazios
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '') {
        updateData[key] = null;
      }
    });

    const { data, error } = await supabaseAdmin
      .from('pacientes')
      .update(updateData)
      .eq('id', paciente_id)
      .eq('medico_id', medico_id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar paciente:', error);
      return new Response(JSON.stringify({ error: 'Erro ao atualizar paciente', details: error.message }), {
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

// Atualizar status do paciente
async function updatePacienteStatus(medico_id: string, paciente_id: string, req: Request) {
  try {
    const { status_paciente } = await req.json();

    if (!status_paciente) {
      return new Response(JSON.stringify({ 
        error: 'Status obrigatório',
        details: 'status_paciente é obrigatório'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const updateData = {
      status_paciente,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('pacientes')
      .update(updateData)
      .eq('id', paciente_id)
      .eq('medico_id', medico_id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar status do paciente:', error);
      return new Response(JSON.stringify({ error: 'Erro ao atualizar status', details: error.message }), {
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
    console.error('Erro em updatePacienteStatus:', error);
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

    // Verificar se existem documentos anexados para este paciente
    const { data: documentos, error: documentosError } = await supabaseAdmin
      .from('documentos_contato')
      .select('id')
      .eq('paciente_id', paciente_id)
      .eq('medico_id', medico_id)
      .limit(1);

    if (documentosError) {
      console.error('Erro ao verificar documentos:', documentosError);
      return new Response(JSON.stringify({ error: 'Erro ao verificar dependências' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (documentos && documentos.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Não é possível excluir paciente',
        details: 'Paciente possui documentos anexados. Remova os documentos primeiro.'
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
      return new Response(JSON.stringify({ error: 'Erro ao excluir paciente', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Paciente excluído com sucesso' }), {
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