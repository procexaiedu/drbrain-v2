import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Function estoque-produtos-management loaded');

// Extrair a rota do URL
function extractRoute(url: string): { route: string; id?: string; action?: string; type?: string } {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  
  console.log('Original pathname:', pathname);
  
  let cleanPath = '';
  
  if (pathname.includes('estoque-produtos-management')) {
    const parts = pathname.split('estoque-produtos-management');
    cleanPath = parts[1] || '';
  } else {
    cleanPath = pathname;
  }
  
  console.log('Clean path:', cleanPath);
  
  const parts = cleanPath.split('/').filter(p => p);
  console.log('URL parts:', parts);
  
  if (parts.length === 0) {
    return { route: 'list', type: 'produtos' }; // Default para listar produtos
  }

  if (parts.length === 1) {
    if (parts[0] === 'produtos' || parts[0] === 'servicos') {
      return { route: 'list', type: parts[0] };
    } else {
      return { route: 'single', id: parts[0] }; // Assume que é um ID de produto/serviço
    }
  }
  
  if (parts.length === 2) {
    if (parts[0] === 'produtos' || parts[0] === 'servicos') {
      return { route: 'single', type: parts[0], id: parts[1] };
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
    const { route, id, action, type } = extractRoute(req.url);
    console.log('Route extracted:', { route, id, action, type });

    // Roteamento baseado no método e rota
    switch (route) {
      case 'list':
        if (req.method === 'GET') {
          if (type === 'produtos') return await listProdutos(medico_id, req);
          if (type === 'servicos') return await listServicos(medico_id, req);
        }
        if (req.method === 'POST') {
          if (type === 'produtos') return await createProduto(medico_id, req);
          if (type === 'servicos') return await createServico(medico_id, req);
        }
        break;

      case 'single':
        if (req.method === 'GET') {
          if (type === 'produtos') return await getProduto(medico_id, id!);
          if (type === 'servicos') return await getServico(medico_id, id!);
        }
        if (req.method === 'PUT') {
          if (type === 'produtos') return await updateProduto(medico_id, id!, req);
          if (type === 'servicos') return await updateServico(medico_id, id!, req);
        }
        if (req.method === 'DELETE') {
          if (type === 'produtos') return await deleteProduto(medico_id, id!);
          if (type === 'servicos') return await deleteServico(medico_id, id!);
        }
        break;
    }

    return new Response(JSON.stringify({ error: 'Rota não encontrada' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    });

  } catch (error) {
    console.error('Erro na Edge Function estoque-produtos-management:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Funções de CRUD para Produtos
async function listProdutos(medico_id: string, req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('produtos')
      .select('*, fornecedores(nome_fornecedor)', { count: 'exact' })
      .eq('medico_id', medico_id);

    if (search.trim()) {
      query = query.or(`nome_produto.ilike.%${search.trim()}%,principio_ativo.ilike.%${search.trim()}%,codigo_barras.ilike.%${search.trim()}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erro ao listar produtos:', error);
      return new Response(JSON.stringify({ error: 'Erro ao buscar produtos', details: error.message }), {
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
    console.error('Erro em listProdutos:', error);
    return new Response(JSON.stringify({ error: 'Erro interno', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function createProduto(medico_id: string, req: Request) {
  try {
    const produtoData = await req.json();
    const { codigo_barras } = produtoData;

    // 1. Preenchimento automático via ANVISA_PRODUTOS_MASTER se houver código de barras
    if (codigo_barras) {
      const { data: anvisaData, error: anvisaError } = await supabaseAdmin
        .from('anvisa_produtos_master')
        .select('tipo_produto, nome_produto, categoria_regulatoria, numero_registro_produto, empresa_detentora_registro, principio_ativo')
        .eq('codigo_barras', codigo_barras)
        .single();

      if (anvisaError && anvisaError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Erro ao consultar ANVISA_PRODUTOS_MASTER:', anvisaError);
        // Não impede o cadastro, apenas loga o erro
      }

      if (anvisaData) {
        // Sobrescreve ou adiciona dados da ANVISA
        produtoData.tipo_produto = anvisaData.tipo_produto || produtoData.tipo_produto;
        produtoData.nome_produto = anvisaData.nome_produto || produtoData.nome_produto;
        produtoData.categoria_regulatoria = anvisaData.categoria_regulatoria || produtoData.categoria_regulatoria;
        produtoData.numero_registro_anvisa = anvisaData.numero_registro_produto || produtoData.numero_registro_anvisa;
        produtoData.empresa_detentora_registro = anvisaData.empresa_detentora_registro || produtoData.empresa_detentora_registro;
        produtoData.principio_ativo = anvisaData.principio_ativo || produtoData.principio_ativo;
      }
    }

    // 2. Validação de dados obrigatórios
    if (!produtoData.nome_produto || !produtoData.preco_venda || !produtoData.custo_aquisicao) {
      return new Response(JSON.stringify({ 
        error: 'Dados obrigatórios ausentes',
        details: 'nome_produto, preco_venda e custo_aquisicao são obrigatórios'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 3. Inserção no banco de dados
    const insertData = {
      medico_id,
      ...produtoData,
      estoque_atual: produtoData.estoque_atual || 0, // Garante valor inicial
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: novoProduto, error } = await supabaseAdmin
      .from('produtos')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar produto:', error);
      return new Response(JSON.stringify({ 
        error: 'Erro ao criar produto', 
        details: error.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify(novoProduto), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error('Erro em createProduto:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function getProduto(medico_id: string, produto_id: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('produtos')
      .select('*, fornecedores(nome_fornecedor)')
      .eq('id', produto_id)
      .eq('medico_id', medico_id)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Produto não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em getProduto:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function updateProduto(medico_id: string, produto_id: string, req: Request) {
  try {
    const updateData = await req.json();
    
    // Remover campos que não devem ser atualizados via PUT
    delete updateData.id;
    delete updateData.medico_id;
    delete updateData.created_at;
    delete updateData.estoque_atual; // Estoque é atualizado via movimentações

    const { data, error } = await supabaseAdmin
      .from('produtos')
      .update(updateData)
      .eq('id', produto_id)
      .eq('medico_id', medico_id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar produto:', error);
      return new Response(JSON.stringify({ error: 'Erro ao atualizar produto', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Produto não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em updateProduto:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function deleteProduto(medico_id: string, produto_id: string) {
  try {
    const { error } = await supabaseAdmin
      .from('produtos')
      .delete()
      .eq('id', produto_id)
      .eq('medico_id', medico_id);

    if (error) {
      console.error('Erro ao deletar produto:', error);
      return new Response(JSON.stringify({ error: 'Erro ao excluir produto', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Produto excluído com sucesso' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em deleteProduto:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Funções de CRUD para Serviços (esqueletos)
async function listServicos(medico_id: string, req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('servicos')
      .select('*', { count: 'exact' })
      .eq('medico_id', medico_id);

    if (search.trim()) {
      query = query.ilike('nome_servico', `%${search.trim()}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erro ao listar serviços:', error);
      return new Response(JSON.stringify({ error: 'Erro ao buscar serviços', details: error.message }), {
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
    console.error('Erro em listServicos:', error);
    return new Response(JSON.stringify({ error: 'Erro interno', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function createServico(medico_id: string, req: Request) {
  try {
    const servicoData = await req.json();

    if (!servicoData.nome_servico || !servicoData.preco_servico) {
      return new Response(JSON.stringify({ 
        error: 'Dados obrigatórios ausentes',
        details: 'nome_servico e preco_servico são obrigatórios'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const insertData = {
      medico_id,
      ...servicoData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: novoServico, error } = await supabaseAdmin
      .from('servicos')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar serviço:', error);
      return new Response(JSON.stringify({ 
        error: 'Erro ao criar serviço', 
        details: error.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify(novoServico), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error('Erro em createServico:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function getServico(medico_id: string, servico_id: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('servicos')
      .select('*')
      .eq('id', servico_id)
      .eq('medico_id', medico_id)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Serviço não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em getServico:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function updateServico(medico_id: string, servico_id: string, req: Request) {
  try {
    const updateData = await req.json();
    
    delete updateData.id;
    delete updateData.medico_id;
    delete updateData.created_at;

    const { data, error } = await supabaseAdmin
      .from('servicos')
      .update(updateData)
      .eq('id', servico_id)
      .eq('medico_id', medico_id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar serviço:', error);
      return new Response(JSON.stringify({ error: 'Erro ao atualizar serviço', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Serviço não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em updateServico:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function deleteServico(medico_id: string, servico_id: string) {
  try {
    const { error } = await supabaseAdmin
      .from('servicos')
      .delete()
      .eq('id', servico_id)
      .eq('medico_id', medico_id);

    if (error) {
      console.error('Erro ao deletar serviço:', error);
      return new Response(JSON.stringify({ error: 'Erro ao excluir serviço', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Serviço excluído com sucesso' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em deleteServico:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}
