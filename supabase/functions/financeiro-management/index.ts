import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getAsaasAccessToken } from '../_shared/asaasTokenManager.ts';

console.log('Function financeiro-management loaded');

// Extrair a rota do URL
function extractRoute(url: string): { route: string; id?: string; type?: string; action?: string } {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  
  console.log('Original pathname:', pathname);
  
  let cleanPath = '';
  
  if (pathname.includes('financeiro-management')) {
    const parts = pathname.split('financeiro-management');
    cleanPath = parts[1] || '';
  } else {
    cleanPath = pathname;
  }
  
  console.log('Clean path:', cleanPath);
  
  const parts = cleanPath.split('/').filter(p => p);
  console.log('URL parts:', parts);
  
  if (parts.length === 0) {
    return { route: 'list', type: 'cobrancas' }; // Default
  }

  if (parts.length === 1) {
    if (parts[0] === 'cobrancas' || parts[0] === 'transacoes' || parts[0] === 'assinaturas') {
      return { route: 'list', type: parts[0] };
    } else {
      return { route: 'single', id: parts[0] }; // Assume que é um ID
    }
  }
  
  if (parts.length === 2) {
    if (parts[0] === 'cobrancas' || parts[0] === 'transacoes' || parts[0] === 'assinaturas') {
      return { route: 'single', type: parts[0], id: parts[1] };
    }
    // Ex: /cobrancas/{id}/gerar-link
    if (parts[0] === 'cobrancas' && parts[1] === 'gerar-link') {
      return { route: 'action', type: 'cobrancas', action: 'gerar-link' };
    }
  }

  if (parts.length === 3) {
    // Ex: /cobrancas/{id}/gerar-link
    if (parts[0] === 'cobrancas' && parts[2] === 'gerar-link') {
      return { route: 'action', type: 'cobrancas', id: parts[1], action: 'gerar-link' };
    }
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
    const { route, id, type, action } = extractRoute(req.url);
    console.log('Route extracted:', { route, id, type, action });

    // Roteamento baseado no método e rota
    switch (route) {
      case 'list':
        if (req.method === 'GET') {
          if (type === 'cobrancas') return await listCobrancas(medico_id, req);
          if (type === 'transacoes') return await listTransacoes(medico_id, req);
          if (type === 'assinaturas') return await listAssinaturas(medico_id, req);
        }
        if (req.method === 'POST') {
          if (type === 'cobrancas') return await createCobranca(medico_id, req);
          if (type === 'transacoes') return await createTransacao(medico_id, req);
          if (type === 'assinaturas') return await createAssinatura(medico_id, req);
        }
        break;

      case 'single':
        if (req.method === 'GET') {
          if (type === 'cobrancas') return await getCobranca(medico_id, id!);
          if (type === 'transacoes') return await getTransacao(medico_id, id!);
          if (type === 'assinaturas') return await getAssinatura(medico_id, id!);
        }
        if (req.method === 'PUT') {
          if (type === 'cobrancas') return await updateCobranca(medico_id, id!, req);
          if (type === 'transacoes') return await updateTransacao(medico_id, id!, req);
          if (type === 'assinaturas') return await updateAssinatura(medico_id, id!, req);
        }
        if (req.method === 'DELETE') {
          if (type === 'cobrancas') return await deleteCobranca(medico_id, id!);
          if (type === 'transacoes') return await deleteTransacao(medico_id, id!);
          if (type === 'assinaturas') return await deleteAssinatura(medico_id, id!);
        }
        break;
      
      case 'action':
        if (type === 'cobrancas' && action === 'gerar-link' && req.method === 'POST') {
          return await gerarLinkCobrancaAsaas(medico_id, id!, req);
        }
        break;
    }

    return new Response(JSON.stringify({ error: 'Rota não encontrada' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    });

  } catch (error) {
    console.error('Erro na Edge Function financeiro-management:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Funções auxiliares para Asaas
async function getOrCreateAsaasCustomer(medico_id: string, paciente_id: string, asaas_token: string) {
  const { data: paciente, error: pacienteError } = await supabaseAdmin
    .from('pacientes')
    .select('nome_completo, email_paciente, telefone_principal, asaas_customer_id')
    .eq('id', paciente_id)
    .eq('medico_id', medico_id)
    .single();

  if (pacienteError || !paciente) {
    throw new Error('Paciente não encontrado.');
  }

  if (paciente.asaas_customer_id) {
    console.log('Cliente Asaas já existe para o paciente:', paciente.asaas_customer_id);
    return paciente.asaas_customer_id;
  }

  // Criar cliente no Asaas
  const customerData = {
    name: paciente.nome_completo,
    email: paciente.email_paciente,
    mobilePhone: paciente.telefone_principal, // Asaas espera mobilePhone
    externalReference: paciente_id, // Vincula o cliente Asaas ao nosso paciente_id
  };

  const asaasResponse = await fetch('https://api.asaas.com/v3/customers', {
    method: 'POST',
    headers: {
      'access_token': asaas_token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customerData),
  });

  if (!asaasResponse.ok) {
    const errorData = await asaasResponse.json().catch(() => ({ message: asaasResponse.statusText }));
    console.error('Erro ao criar cliente no Asaas:', errorData);
    throw new Error(errorData.message || 'Erro ao criar cliente no Asaas');
  }

  const asaasCustomer = await asaasResponse.json();

  // Salvar asaas_customer_id no nosso banco de dados
  const { error: updateError } = await supabaseAdmin
    .from('pacientes')
    .update({ asaas_customer_id: asaasCustomer.id })
    .eq('id', paciente_id);

  if (updateError) {
    console.error('Erro ao salvar asaas_customer_id no paciente:', updateError);
    // Não impede a operação, mas loga o erro
  }

  return asaasCustomer.id;
}

async function getMedicoConfiguracoes(medico_id: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('medico_configuracoes')
      .select('asaas_pix_key')
      .eq('medico_id', medico_id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Erro ao buscar configurações do médico:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Erro em getMedicoConfiguracoes:', error);
    return null;
  }
}

// Funções de CRUD para Cobranças
async function listCobrancas(medico_id: string, req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('cobrancas')
      .select('*, pacientes(nome_completo), servicos(nome_servico), produtos(nome_produto)', { count: 'exact' })
      .eq('medico_id', medico_id);

    if (search.trim()) {
      query = query.or(`descricao.ilike.%${search.trim()}%,pacientes.nome_completo.ilike.%${search.trim()}%`);
    }
    if (status.trim()) {
      query = query.eq('status_cobranca', status);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erro ao listar cobranças:', error);
      return new Response(JSON.stringify({ error: 'Erro ao buscar cobranças', details: error.message }), {
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
    console.error('Erro em listCobrancas:', error);
    return new Response(JSON.stringify({ error: 'Erro interno', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function createCobranca(medico_id: string, req: Request) {
  try {
    const cobrancaData = await req.json();
    const { paciente_id, valor, data_vencimento, descricao, metodo_pagamento } = cobrancaData;

    if (!paciente_id || !valor || !data_vencimento || !descricao || !metodo_pagamento) {
      return new Response(JSON.stringify({ 
        error: 'Dados obrigatórios ausentes',
        details: 'paciente_id, valor, data_vencimento, descricao e metodo_pagamento são obrigatórios'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const asaas_token = await getAsaasAccessToken(medico_id);
    if (!asaas_token) {
      return new Response(JSON.stringify({ error: 'Token Asaas não configurado para o médico.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const asaas_customer_id = await getOrCreateAsaasCustomer(medico_id, paciente_id, asaas_token);

    const asaasPayload: any = {
      customer: asaas_customer_id,
      billingType: metodo_pagamento, // PIX, BOLETO, CREDIT_CARD
      value: valor,
      dueDate: data_vencimento,
      description: descricao,
      externalReference: cobrancaData.id || '' // Usar o ID da nossa cobrança se já existir, ou deixar vazio para ser preenchido depois
    };

    // Se for PIX, adicionar a chave Pix do médico
    if (metodo_pagamento === 'PIX') {
      const medicoConfig = await getMedicoConfiguracoes(medico_id);
      if (medicoConfig?.asaas_pix_key) {
        asaasPayload.pixAddressKey = medicoConfig.asaas_pix_key;
        asaasPayload.pixAddressKeyType = 'EVP'; // Assumindo EVP (chave aleatória) ou você pode adicionar um campo para o tipo da chave
      } else {
        console.warn('Chave PIX do Asaas não configurada para o médico. Cobrança PIX pode falhar.');
      }
    }

    const asaasResponse = await fetch('https://api.asaas.com/v3/payments', {
      method: 'POST',
      headers: {
        'access_token': asaas_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(asaasPayload),
    });

    if (!asaasResponse.ok) {
      const errorData = await asaasResponse.json().catch(() => ({ message: asaasResponse.statusText }));
      console.error('Erro ao criar cobrança no Asaas:', errorData);
      throw new Error(errorData.message || 'Erro ao criar cobrança no Asaas');
    }

    const asaasPayment = await asaasResponse.json();

    const insertData = {
      medico_id,
      ...cobrancaData,
      asaas_charge_id: asaasPayment.id,
      link_pagamento: asaasPayment.invoiceUrl || asaasPayment.bankSlipUrl || (asaasPayment.pix ? asaasPayment.pix.payload : null),
      qr_code_pix_base64: asaasPayment.pix ? asaasPayment.pix.encodedImage : null,
      status_cobranca: asaasPayment.status === 'PENDING' ? 'PENDENTE' : asaasPayment.status, // Mapear status do Asaas
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: novaCobranca, error } = await supabaseAdmin
      .from('cobrancas')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar cobrança no Supabase:', error);
      // TODO: Considerar estornar a cobrança no Asaas se falhar aqui
      return new Response(JSON.stringify({ 
        error: 'Erro ao criar cobrança no sistema', 
        details: error.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify(novaCobranca), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error('Erro em createCobranca:', error);
    return new Response(JSON.stringify({ error: 'Erro interno', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function getCobranca(medico_id: string, cobranca_id: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('cobrancas')
      .select('*, pacientes(nome_completo), servicos(nome_servico), produtos(nome_produto)')
      .eq('id', cobranca_id)
      .eq('medico_id', medico_id)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Cobrança não encontrada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em getCobranca:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function updateCobranca(medico_id: string, cobranca_id: string, req: Request) {
  try {
    const updateData = await req.json();
    
    delete updateData.id;
    delete updateData.medico_id;
    delete updateData.created_at;

    const { data, error } = await supabaseAdmin
      .from('cobrancas')
      .update(updateData)
      .eq('id', cobranca_id)
      .eq('medico_id', medico_id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar cobrança:', error);
      return new Response(JSON.stringify({ error: 'Erro ao atualizar cobrança', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Cobrança não encontrada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em updateCobranca:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function deleteCobranca(medico_id: string, cobranca_id: string) {
  try {
    // TODO: Lógica para cancelar/estornar cobrança no Asaas, se necessário

    const { error } = await supabaseAdmin
      .from('cobrancas')
      .delete()
      .eq('id', cobranca_id)
      .eq('medico_id', medico_id);

    if (error) {
      console.error('Erro ao deletar cobrança:', error);
      return new Response(JSON.stringify({ error: 'Erro ao excluir cobrança', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Cobrança excluída com sucesso' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em deleteCobranca:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function gerarLinkCobrancaAsaas(medico_id: string, cobranca_id: string, req: Request) {
  try {
    const asaas_token = await getAsaasAccessToken(medico_id);
    if (!asaas_token) {
      return new Response(JSON.stringify({ error: 'Token Asaas não configurado para o médico.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const { data: cobranca, error: cobrancaError } = await supabaseAdmin
      .from('cobrancas')
      .select('*, pacientes(asaas_customer_id, nome_completo, email_paciente, telefone_principal)')
      .eq('id', cobranca_id)
      .eq('medico_id', medico_id)
      .single();

    if (cobrancaError || !cobranca) {
      return new Response(JSON.stringify({ error: 'Cobrança não encontrada.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    let asaas_customer_id = cobranca.pacientes?.asaas_customer_id;
    if (!asaas_customer_id) {
      asaas_customer_id = await getOrCreateAsaasCustomer(medico_id, cobranca.paciente_id!, asaas_token);
    }

    const asaasPayload: any = {
      customer: asaas_customer_id,
      billingType: cobranca.metodo_pagamento, 
      value: cobranca.valor,
      dueDate: cobranca.data_vencimento,
      description: cobranca.descricao,
      externalReference: cobranca.id, 
    };

    if (cobranca.metodo_pagamento === 'PIX') {
      const medicoConfig = await getMedicoConfiguracoes(medico_id);
      if (medicoConfig?.asaas_pix_key) {
        asaasPayload.pixAddressKey = medicoConfig.asaas_pix_key;
        asaasPayload.pixAddressKeyType = 'EVP'; // Assumindo EVP
      } else {
        console.warn('Chave PIX do Asaas não configurada para o médico. Geração de link PIX pode falhar.');
      }
    }

    const asaasResponse = await fetch('https://api.asaas.com/v3/payments', {
      method: 'POST',
      headers: {
        'access_token': asaas_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(asaasPayload),
    });

    if (!asaasResponse.ok) {
      const errorData = await asaasResponse.json().catch(() => ({ message: asaasResponse.statusText }));
      console.error('Erro ao gerar link/QR Code no Asaas:', errorData);
      throw new Error(errorData.message || 'Erro ao gerar link/QR Code no Asaas');
    }

    const asaasPayment = await asaasResponse.json();

    const { error: updateError } = await supabaseAdmin
      .from('cobrancas')
      .update({
        asaas_charge_id: asaasPayment.id,
        link_pagamento: asaasPayment.invoiceUrl || asaasPayment.bankSlipUrl || (asaasPayment.pix ? asaasPayment.pix.payload : null),
        qr_code_pix_base64: asaasPayment.pix ? asaasPayment.pix.encodedImage : null,
        status_cobranca: asaasPayment.status === 'PENDING' ? 'PENDENTE' : asaasPayment.status, 
        updated_at: new Date().toISOString()
      })
      .eq('id', cobranca_id);

    if (updateError) {
      console.error('Erro ao atualizar cobrança com dados do Asaas:', updateError);
    }

    return new Response(JSON.stringify({
      link_pagamento: asaasPayment.invoiceUrl || asaasPayment.bankSlipUrl || (asaasPayment.pix ? asaasPayment.pix.payload : null),
      qr_code_pix_base64: asaasPayment.pix ? asaasPayment.pix.encodedImage : null,
      message: 'Link/QR Code gerado com sucesso!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em gerarLinkCobrancaAsaas:', error);
    return new Response(JSON.stringify({ error: 'Erro interno', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Funções de CRUD para Transações Financeiras
async function listTransacoes(medico_id: string, req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const tipo = url.searchParams.get('tipo_transacao') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('transacoes_financeiras')
      .select('*', { count: 'exact' })
      .eq('medico_id', medico_id);

    if (search.trim()) {
      query = query.ilike('descricao', `%${search.trim()}%`);
    }
    if (tipo.trim()) {
      query = query.eq('tipo_transacao', tipo);
    }

    const { data, error, count } = await query
      .order('data_transacao', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erro ao listar transações:', error);
      return new Response(JSON.stringify({ error: 'Erro ao buscar transações', details: error.message }), {
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
    console.error('Erro em listTransacoes:', error);
    return new Response(JSON.stringify({ error: 'Erro interno', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function createTransacao(medico_id: string, req: Request) {
  try {
    const transacaoData = await req.json();

    if (!transacaoData.tipo_transacao || !transacaoData.descricao || !transacaoData.valor || !transacaoData.data_transacao) {
      return new Response(JSON.stringify({ 
        error: 'Dados obrigatórios ausentes',
        details: 'tipo_transacao, descricao, valor e data_transacao são obrigatórios'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const insertData = {
      medico_id,
      ...transacaoData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: novaTransacao, error } = await supabaseAdmin
      .from('transacoes_financeiras')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar transação:', error);
      return new Response(JSON.stringify({ 
        error: 'Erro ao criar transação', 
        details: error.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify(novaTransacao), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error('Erro em createTransacao:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function getTransacao(medico_id: string, transacao_id: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('transacoes_financeiras')
      .select('*')
      .eq('id', transacao_id)
      .eq('medico_id', medico_id)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Transação não encontrada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em getTransacao:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function updateTransacao(medico_id: string, transacao_id: string, req: Request) {
  try {
    const updateData = await req.json();
    
    delete updateData.id;
    delete updateData.medico_id;
    delete update.created_at;

    const { data, error } = await supabaseAdmin
      .from('transacoes_financeiras')
      .update(updateData)
      .eq('id', transacao_id)
      .eq('medico_id', medico_id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar transação:', error);
      return new Response(JSON.stringify({ error: 'Erro ao atualizar transação', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Transação não encontrada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em updateTransacao:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function deleteTransacao(medico_id: string, transacao_id: string) {
  try {
    const { error } = await supabaseAdmin
      .from('transacoes_financeiras')
      .delete()
      .eq('id', transacao_id)
      .eq('medico_id', medico_id);

    if (error) {
      console.error('Erro ao deletar transação:', error);
      return new Response(JSON.stringify({ error: 'Erro ao excluir transação', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Transação excluída com sucesso' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em deleteTransacao:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Funções de CRUD para Assinaturas Recorrentes
async function listAssinaturas(medico_id: string, req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status_assinatura') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('assinaturas_recorrentes')
      .select('*, pacientes(nome_completo), servicos(nome_servico)', { count: 'exact' })
      .eq('medico_id', medico_id);

    if (search.trim()) {
      query = query.or(`observacoes.ilike.%${search.trim()}%,pacientes.nome_completo.ilike.%${search.trim()}%`);
    }
    if (status.trim()) {
      query = query.eq('status_assinatura', status);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erro ao listar assinaturas:', error);
      return new Response(JSON.stringify({ error: 'Erro ao buscar assinaturas', details: error.message }), {
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
    console.error('Erro em listAssinaturas:', error);
    return new Response(JSON.stringify({ error: 'Erro interno', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function createAssinatura(medico_id: string, req: Request) {
  try {
    const assinaturaData = await req.json();

    if (!assinaturaData.paciente_id || !assinaturaData.servico_id || !assinaturaData.valor_recorrencia || !assinaturaData.periodo_recorrencia || !assinaturaData.data_inicio) {
      return new Response(JSON.stringify({ 
        error: 'Dados obrigatórios ausentes',
        details: 'paciente_id, servico_id, valor_recorrencia, periodo_recorrencia e data_inicio são obrigatórios'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const asaas_token = await getAsaasAccessToken(medico_id);
    if (!asaas_token) {
      return new Response(JSON.stringify({ error: 'Token Asaas não configurado para o médico.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const asaas_customer_id = await getOrCreateAsaasCustomer(medico_id, assinaturaData.paciente_id, asaas_token);

    const asaasPayload: any = {
      customer: asaas_customer_id,
      billingType: 'UNDEFINED', // Assinaturas podem ter tipo de cobrança indefinido ou específico
      value: assinaturaData.valor_recorrencia,
      nextDueDate: assinaturaData.data_inicio, // Primeira cobrança
      cycle: assinaturaData.periodo_recorrencia, // MONTHLY, WEEKLY, etc.
      description: `Assinatura: ${assinaturaData.servico_id}`,
      externalReference: assinaturaData.id || '',
    };

    const asaasResponse = await fetch('https://api.asaas.com/v3/subscriptions', {
      method: 'POST',
      headers: {
        'access_token': asaas_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(asaasPayload),
    });

    if (!asaasResponse.ok) {
      const errorData = await asaasResponse.json().catch(() => ({ message: asaasResponse.statusText }));
      console.error('Erro ao criar assinatura no Asaas:', errorData);
      throw new Error(errorData.message || 'Erro ao criar assinatura no Asaas');
    }

    const asaasSubscription = await asaasResponse.json();

    const insertData = {
      medico_id,
      ...assinaturaData,
      asaas_subscription_id: asaasSubscription.id,
      data_proxima_cobranca: asaasSubscription.nextDueDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: novaAssinatura, error } = await supabaseAdmin
      .from('assinaturas_recorrentes')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar assinatura no Supabase:', error);
      // TODO: Considerar cancelar a assinatura no Asaas se falhar aqui
      return new Response(JSON.stringify({ 
        error: 'Erro ao criar assinatura no sistema', 
        details: error.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify(novaAssinatura), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error('Erro em createAssinatura:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function getAssinatura(medico_id: string, assinatura_id: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('assinaturas_recorrentes')
      .select('*, pacientes(nome_completo), servicos(nome_servico)')
      .eq('id', assinatura_id)
      .eq('medico_id', medico_id)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Assinatura não encontrada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em getAssinatura:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function updateAssinatura(medico_id: string, assinatura_id: string, req: Request) {
  try {
    const updateData = await req.json();
    
    delete updateData.id;
    delete updateData.medico_id;
    delete updateData.created_at;

    const asaas_token = await getAsaasAccessToken(medico_id);
    if (!asaas_token) {
      return new Response(JSON.stringify({ error: 'Token Asaas não configurado para o médico.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const { data: currentAssinatura, error: fetchError } = await supabaseAdmin
      .from('assinaturas_recorrentes')
      .select('asaas_subscription_id')
      .eq('id', assinatura_id)
      .eq('medico_id', medico_id)
      .single();

    if (fetchError || !currentAssinatura || !currentAssinatura.asaas_subscription_id) {
      console.warn('Assinatura não encontrada ou sem ID Asaas para atualização externa.');
      // Prosseguir com a atualização interna se não houver ID Asaas
    }

    if (currentAssinatura?.asaas_subscription_id) {
      const asaasPayload: any = {
        // Campos que podem ser atualizados na assinatura do Asaas
        // Ex: value, nextDueDate, cycle, description
        ...(updateData.valor_recorrencia && { value: updateData.valor_recorrencia }),
        ...(updateData.data_proxima_cobranca && { nextDueDate: updateData.data_proxima_cobranca }),
        ...(updateData.periodo_recorrencia && { cycle: updateData.periodo_recorrencia }),
        ...(updateData.observacoes && { description: updateData.observacoes }),
        // Não é possível alterar o cliente ou o serviço de uma assinatura existente no Asaas
      };

      if (Object.keys(asaasPayload).length > 0) {
        const asaasResponse = await fetch(`https://api.asaas.com/v3/subscriptions/${currentAssinatura.asaas_subscription_id}`, {
          method: 'POST', // Asaas usa POST para atualizar assinaturas
          headers: {
            'access_token': asaas_token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(asaasPayload),
        });

        if (!asaasResponse.ok) {
          const errorData = await asaasResponse.json().catch(() => ({ message: asaasResponse.statusText }));
          console.error('Erro ao atualizar assinatura no Asaas:', errorData);
          // Não lançar erro fatal, apenas logar e continuar com a atualização interna
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from('assinaturas_recorrentes')
      .update(updateData)
      .eq('id', assinatura_id)
      .eq('medico_id', medico_id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar assinatura:', error);
      return new Response(JSON.stringify({ error: 'Erro ao atualizar assinatura', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Assinatura não encontrada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em updateAssinatura:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function deleteAssinatura(medico_id: string, assinatura_id: string) {
  try {
    const asaas_token = await getAsaasAccessToken(medico_id);
    if (!asaas_token) {
      console.warn('Token Asaas não configurado. Não será possível cancelar a assinatura no Asaas.');
    }

    const { data: currentAssinatura, error: fetchError } = await supabaseAdmin
      .from('assinaturas_recorrentes')
      .select('asaas_subscription_id')
      .eq('id', assinatura_id)
      .eq('medico_id', medico_id)
      .single();

    if (fetchError || !currentAssinatura || !currentAssinatura.asaas_subscription_id) {
      console.warn('Assinatura não encontrada ou sem ID Asaas para cancelamento externo.');
    }

    if (currentAssinatura?.asaas_subscription_id && asaas_token) {
      const asaasResponse = await fetch(`https://api.asaas.com/v3/subscriptions/${currentAssinatura.asaas_subscription_id}`, {
        method: 'DELETE',
        headers: {
          'access_token': asaas_token,
        },
      });

      if (!asaasResponse.ok) {
        const errorData = await asaasResponse.json().catch(() => ({ message: asaasResponse.statusText }));
        console.error('Erro ao cancelar assinatura no Asaas:', errorData);
        // Não lançar erro fatal, apenas logar e continuar com a exclusão interna
      }
    }

    const { error } = await supabaseAdmin
      .from('assinaturas_recorrentes')
      .delete()
      .eq('id', assinatura_id)
      .eq('medico_id', medico_id);

    if (error) {
      console.error('Erro ao deletar assinatura:', error);
      return new Response(JSON.stringify({ error: 'Erro ao excluir assinatura', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Assinatura excluída com sucesso' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em deleteAssinatura:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}