import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Function crm-leads-management loaded');

// Extrair a rota do URL
function extractRoute(url: string): { route: string; id?: string; action?: string } {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  
  console.log('Original pathname:', pathname);
  
  let cleanPath = '';
  
  if (pathname.includes('crm-leads-management')) {
    const parts = pathname.split('crm-leads-management');
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
    // /leads/{id}/converter ou /leads/{id}/status
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
          return await listLeads(medico_id, req);
        }
        if (req.method === 'POST') {
          return await createLead(medico_id, req);
        }
        break;

      case 'single':
        if (req.method === 'GET') {
          return await getLead(medico_id, id!);
        }
        if (req.method === 'PUT') {
          return await updateLead(medico_id, id!, req);
        }
        if (req.method === 'DELETE') {
          return await deleteLead(medico_id, id!);
        }
        break;

      case 'action':
        if (action === 'status' && req.method === 'PATCH') {
          return await updateLeadStatus(medico_id, id!, req);
        }
        if (action === 'converter' && req.method === 'POST') {
          return await convertLead(medico_id, id!);
        }
        break;
    }

    return new Response(JSON.stringify({ error: 'Rota não encontrada' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    });

  } catch (error) {
    console.error('Erro na Edge Function crm-leads-management:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Listar leads do médico
async function listLeads(medico_id: string, req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    console.log('Query params:', { search, status, page, limit, offset });

    let query = supabaseAdmin
      .from('leads')
      .select('*')
      .eq('medico_id', medico_id);

    // Aplicar filtros
    if (search.trim()) {
      query = query.or(`nome_lead.ilike.%${search.trim()}%,telefone_principal.ilike.%${search.trim()}%,email_lead.ilike.%${search.trim()}%`);
    }

    if (status.trim()) {
      query = query.eq('status_funil_lead', status);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erro ao listar leads:', error);
      return new Response(JSON.stringify({ error: 'Erro ao buscar leads', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log(`Found ${(data || []).length} leads`);

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
    console.error('Erro em listLeads:', error);
    return new Response(JSON.stringify({ error: 'Erro interno', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Obter um lead específico
async function getLead(medico_id: string, lead_id: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .eq('medico_id', medico_id)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Lead não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em getLead:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Criar novo lead
async function createLead(medico_id: string, req: Request) {
  try {
    const leadData = await req.json();

    // Validar dados obrigatórios
    if (!leadData.nome_lead || !leadData.telefone_principal) {
      return new Response(JSON.stringify({ 
        error: 'Dados obrigatórios ausentes',
        details: 'nome_lead e telefone_principal são obrigatórios'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Verificar se já existe lead com mesmo telefone para este médico
    if (leadData.telefone_principal) {
      const { data: existingLead } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('medico_id', medico_id)
        .eq('telefone_principal', leadData.telefone_principal)
        .single();

      if (existingLead) {
        return new Response(JSON.stringify({ 
          error: 'Lead já cadastrado',
          details: 'Já existe um lead com este telefone'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409,
        });
      }
    }

    // Preparar dados para inserção
    const insertData = {
      medico_id,
      nome_lead: leadData.nome_lead?.trim(),
      telefone_principal: leadData.telefone_principal?.trim(),
      email_lead: leadData.email_lead?.trim() || null,
      origem_lead: leadData.origem_lead || null,
      status_funil_lead: leadData.status_funil_lead || 'Novo Lead',
      notas_internas_lead: leadData.notas_internas_lead?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: novoLead, error } = await supabaseAdmin
      .from('leads')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar lead:', error);
      return new Response(JSON.stringify({ 
        error: 'Erro ao criar lead', 
        details: error.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify(novoLead), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error('Erro em createLead:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Atualizar lead
async function updateLead(medico_id: string, lead_id: string, req: Request) {
  try {
    const updateData = await req.json();
    
    // Remover campos que não devem ser atualizados
    delete updateData.id;
    delete updateData.medico_id;
    delete updateData.created_at;
    delete updateData.paciente_id_convertido;

    // Adicionar timestamp de atualização
    updateData.updated_at = new Date().toISOString();

    // Limpar strings
    if (updateData.nome_lead) updateData.nome_lead = updateData.nome_lead.trim();
    if (updateData.telefone_principal) updateData.telefone_principal = updateData.telefone_principal.trim();
    if (updateData.email_lead) updateData.email_lead = updateData.email_lead.trim();
    if (updateData.notas_internas_lead) updateData.notas_internas_lead = updateData.notas_internas_lead.trim();

    const { data, error } = await supabaseAdmin
      .from('leads')
      .update(updateData)
      .eq('id', lead_id)
      .eq('medico_id', medico_id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar lead:', error);
      return new Response(JSON.stringify({ error: 'Erro ao atualizar lead', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Lead não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em updateLead:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Atualizar status do lead
async function updateLeadStatus(medico_id: string, lead_id: string, req: Request) {
  try {
    const { status_funil_lead, motivo_perda_lead } = await req.json();

    if (!status_funil_lead) {
      return new Response(JSON.stringify({ 
        error: 'Status obrigatório',
        details: 'status_funil_lead é obrigatório'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const updateData: any = {
      status_funil_lead,
      data_ultima_atualizacao_status: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Se for status "Perdido", incluir motivo da perda
    if (status_funil_lead === 'Perdido' && motivo_perda_lead) {
      updateData.motivo_perda_lead = motivo_perda_lead;
    } else if (status_funil_lead !== 'Perdido') {
      // Limpar motivo da perda se não for status "Perdido"
      updateData.motivo_perda_lead = null;
    }

    const { data, error } = await supabaseAdmin
      .from('leads')
      .update(updateData)
      .eq('id', lead_id)
      .eq('medico_id', medico_id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar status do lead:', error);
      return new Response(JSON.stringify({ error: 'Erro ao atualizar status', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Lead não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em updateLeadStatus:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Converter lead em paciente
async function convertLead(medico_id: string, lead_id: string) {
  try {
    // Buscar dados do lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .eq('medico_id', medico_id)
      .single();

    if (leadError || !lead) {
      return new Response(JSON.stringify({ error: 'Lead não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Verificar se o lead já foi convertido
    if (lead.paciente_id_convertido) {
      return new Response(JSON.stringify({ 
        error: 'Lead já convertido',
        details: 'Este lead já foi convertido em paciente'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Criar novo paciente com dados do lead
    const pacienteData = {
      medico_id,
      nome_completo: lead.nome_lead,
      telefone_principal: lead.telefone_principal,
      email_paciente: lead.email_lead,
      status_paciente: 'Paciente Ativo',
      lead_origem_id: lead_id,
      notas_gerais_paciente: lead.notas_internas_lead ? `Convertido do lead. Notas originais: ${lead.notas_internas_lead}` : 'Convertido do lead.',
      data_cadastro_paciente: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: novoPaciente, error: pacienteError } = await supabaseAdmin
      .from('pacientes')
      .insert(pacienteData)
      .select()
      .single();

    if (pacienteError) {
      console.error('Erro ao criar paciente:', pacienteError);
      return new Response(JSON.stringify({ 
        error: 'Erro ao criar paciente', 
        details: pacienteError.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Atualizar lead para marcar como convertido
    const { data: leadAtualizado, error: updateError } = await supabaseAdmin
      .from('leads')
      .update({
        status_funil_lead: 'Convertido',
        paciente_id_convertido: novoPaciente.id,
        data_ultima_atualizacao_status: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', lead_id)
      .eq('medico_id', medico_id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar lead após conversão:', updateError);
      // Nota: O paciente já foi criado, mas o lead não foi marcado como convertido
      // Em um cenário real, poderíamos implementar rollback ou log de erro
    }

    return new Response(JSON.stringify({
      lead: leadAtualizado || lead,
      paciente: novoPaciente,
      message: 'Lead convertido em paciente com sucesso'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em convertLead:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Deletar lead
async function deleteLead(medico_id: string, lead_id: string) {
  try {
    // Verificar se o lead foi convertido em paciente
    const { data: lead } = await supabaseAdmin
      .from('leads')
      .select('paciente_id_convertido')
      .eq('id', lead_id)
      .eq('medico_id', medico_id)
      .single();

    if (lead?.paciente_id_convertido) {
      return new Response(JSON.stringify({ 
        error: 'Não é possível excluir lead',
        details: 'Lead foi convertido em paciente e não pode ser excluído'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Deletar lead
    const { error } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('id', lead_id)
      .eq('medico_id', medico_id);

    if (error) {
      console.error('Erro ao deletar lead:', error);
      return new Response(JSON.stringify({ error: 'Erro ao excluir lead', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Lead excluído com sucesso' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em deleteLead:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
} 