import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Function estoque-movimentacoes-lotes-management loaded');

// Extrair a rota do URL
function extractRoute(url: string): { route: string; id?: string; type?: string } {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  
  console.log('Original pathname:', pathname);
  
  let cleanPath = '';
  
  if (pathname.includes('estoque-movimentacoes-lotes-management')) {
    const parts = pathname.split('estoque-movimentacoes-lotes-management');
    cleanPath = parts[1] || '';
  } else {
    cleanPath = pathname;
  }
  
  console.log('Clean path:', cleanPath);
  
  const parts = cleanPath.split('/').filter(p => p);
  console.log('URL parts:', parts);
  
  if (parts.length === 0) {
    return { route: 'list', type: 'movimentacoes' }; // Default
  }

  if (parts.length === 1) {
    if (parts[0] === 'lotes' || parts[0] === 'movimentacoes') {
      return { route: 'list', type: parts[0] };
    } else {
      return { route: 'single', id: parts[0] }; // Assume que é um ID de movimentação/lote
    }
  }
  
  if (parts.length === 2) {
    if (parts[0] === 'lotes' || parts[0] === 'movimentacoes') {
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
    const { route, id, type } = extractRoute(req.url);
    console.log('Route extracted:', { route, id, type });

    // Roteamento baseado no método e rota
    switch (route) {
      case 'list':
        if (req.method === 'GET') {
          if (type === 'lotes') return await listLotes(medico_id, req);
          if (type === 'movimentacoes') return await listMovimentacoes(medico_id, req);
        }
        if (req.method === 'POST') {
          if (type === 'lotes') return await createLote(medico_id, req);
          if (type === 'movimentacoes') return await createMovimentacao(medico_id, req);
        }
        break;

      case 'single':
        if (req.method === 'GET') {
          if (type === 'lotes') return await getLote(medico_id, id!);
          if (type === 'movimentacoes') return await getMovimentacao(medico_id, id!);
        }
        if (req.method === 'PUT') {
          if (type === 'lotes') return await updateLote(medico_id, id!, req);
          // Movimentações não devem ser atualizadas, apenas criadas
        }
        if (req.method === 'DELETE') {
          if (type === 'lotes') return await deleteLote(medico_id, id!);
          // Movimentações não devem ser deletadas, apenas estornadas com nova movimentação
        }
        break;
    }

    return new Response(JSON.stringify({ error: 'Rota não encontrada' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    });

  } catch (error) {
    console.error('Erro na Edge Function estoque-movimentacoes-lotes-management:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Funções de CRUD para Lotes de Produtos
async function listLotes(medico_id: string, req: Request) {
  try {
    const url = new URL(req.url);
    const produto_id = url.searchParams.get('produto_id') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('lotes_produtos')
      .select('*, produtos(nome_produto)', { count: 'exact' })
      .eq('medico_id', medico_id);

    if (produto_id) {
      query = query.eq('produto_id', produto_id);
    }

    const { data, error, count } = await query
      .order('data_validade', { ascending: true }) // Lotes mais antigos primeiro
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erro ao listar lotes:', error);
      return new Response(JSON.stringify({ error: 'Erro ao buscar lotes', details: error.message }), {
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
    console.error('Erro em listLotes:', error);
    return new Response(JSON.stringify({ error: 'Erro interno', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function createLote(medico_id: string, req: Request) {
  try {
    const loteData = await req.json();

    if (!loteData.produto_id || !loteData.data_validade || !loteData.quantidade_lote) {
      return new Response(JSON.stringify({ 
        error: 'Dados obrigatórios ausentes',
        details: 'produto_id, data_validade e quantidade_lote são obrigatórios'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const insertData = {
      medico_id,
      ...loteData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: novoLote, error } = await supabaseAdmin
      .from('lotes_produtos')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar lote:', error);
      return new Response(JSON.stringify({ 
        error: 'Erro ao criar lote', 
        details: error.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Atualizar estoque_atual na tabela produtos
    const { error: updateError } = await supabaseAdmin
      .from('produtos')
      .update({ estoque_atual: supabaseAdmin.raw('estoque_atual + ?', loteData.quantidade_lote) })
      .eq('id', loteData.produto_id)
      .eq('medico_id', medico_id);

    if (updateError) {
      console.error('Erro ao atualizar estoque do produto após criação de lote:', updateError);
      // Considerar rollback ou log de erro crítico
    }

    return new Response(JSON.stringify(novoLote), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error('Erro em createLote:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function getLote(medico_id: string, lote_id: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('lotes_produtos')
      .select('*, produtos(nome_produto)')
      .eq('id', lote_id)
      .eq('medico_id', medico_id)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Lote não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em getLote:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function updateLote(medico_id: string, lote_id: string, req: Request) {
  try {
    const updateData = await req.json();
    
    delete updateData.id;
    delete updateData.medico_id;
    delete updateData.created_at;
    delete updateData.produto_id; // Não deve ser alterado

    const { data: oldLote, error: oldLoteError } = await supabaseAdmin
      .from('lotes_produtos')
      .select('quantidade_lote, produto_id')
      .eq('id', lote_id)
      .eq('medico_id', medico_id)
      .single();

    if (oldLoteError || !oldLote) {
      return new Response(JSON.stringify({ error: 'Lote não encontrado para atualização' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const { data, error } = await supabaseAdmin
      .from('lotes_produtos')
      .update(updateData)
      .eq('id', lote_id)
      .eq('medico_id', medico_id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar lote:', error);
      return new Response(JSON.stringify({ error: 'Erro ao atualizar lote', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Lote não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Se a quantidade do lote foi alterada, ajustar o estoque do produto
    if (updateData.quantidade_lote !== undefined && updateData.quantidade_lote !== oldLote.quantidade_lote) {
      const diff = updateData.quantidade_lote - oldLote.quantidade_lote;
      const { error: updateEstoqueError } = await supabaseAdmin
        .from('produtos')
        .update({ estoque_atual: supabaseAdmin.raw('estoque_atual + ?', diff) })
        .eq('id', oldLote.produto_id)
        .eq('medico_id', medico_id);

      if (updateEstoqueError) {
        console.error('Erro ao ajustar estoque do produto após atualização de lote:', updateEstoqueError);
      }
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em updateLote:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function deleteLote(medico_id: string, lote_id: string) {
  try {
    // Obter quantidade do lote antes de deletar para ajustar o estoque do produto
    const { data: loteToDelete, error: fetchError } = await supabaseAdmin
      .from('lotes_produtos')
      .select('quantidade_lote, produto_id')
      .eq('id', lote_id)
      .eq('medico_id', medico_id)
      .single();

    if (fetchError || !loteToDelete) {
      return new Response(JSON.stringify({ error: 'Lote não encontrado para exclusão' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const { error } = await supabaseAdmin
      .from('lotes_produtos')
      .delete()
      .eq('id', lote_id)
      .eq('medico_id', medico_id);

    if (error) {
      console.error('Erro ao deletar lote:', error);
      return new Response(JSON.stringify({ error: 'Erro ao excluir lote', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Ajustar estoque_atual na tabela produtos
    const { error: updateError } = await supabaseAdmin
      .from('produtos')
      .update({ estoque_atual: supabaseAdmin.raw('estoque_atual - ?', loteToDelete.quantidade_lote) })
      .eq('id', loteToDelete.produto_id)
      .eq('medico_id', medico_id);

    if (updateError) {
      console.error('Erro ao ajustar estoque do produto após exclusão de lote:', updateError);
    }

    return new Response(JSON.stringify({ success: true, message: 'Lote excluído com sucesso' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em deleteLote:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Funções de CRUD para Movimentações de Estoque
async function listMovimentacoes(medico_id: string, req: Request) {
  try {
    const url = new URL(req.url);
    const produto_id = url.searchParams.get('produto_id') || '';
    const tipo_movimentacao = url.searchParams.get('tipo_movimentacao') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('movimentacoes_estoque')
      .select('*, produtos(nome_produto), lotes_produtos(numero_lote)', { count: 'exact' })
      .eq('medico_id', medico_id);

    if (produto_id) {
      query = query.eq('produto_id', produto_id);
    }
    if (tipo_movimentacao) {
      query = query.eq('tipo_movimentacao', tipo_movimentacao);
    }

    const { data, error, count } = await query
      .order('data_movimentacao', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erro ao listar movimentações:', error);
      return new Response(JSON.stringify({ error: 'Erro ao buscar movimentações', details: error.message }), {
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
    console.error('Erro em listMovimentacoes:', error);
    return new Response(JSON.stringify({ error: 'Erro interno', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function createMovimentacao(medico_id: string, req: Request) {
  try {
    const movimentacaoData = await req.json();

    if (!movimentacaoData.produto_id || !movimentacaoData.tipo_movimentacao || !movimentacaoData.quantidade) {
      return new Response(JSON.stringify({ 
        error: 'Dados obrigatórios ausentes',
        details: 'produto_id, tipo_movimentacao e quantidade são obrigatórios'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { produto_id, tipo_movimentacao, quantidade, lote_id } = movimentacaoData;

    // 1. Registrar a movimentação
    const insertData = {
      medico_id,
      ...movimentacaoData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: novaMovimentacao, error } = await supabaseAdmin
      .from('movimentacoes_estoque')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar movimentação:', error);
      return new Response(JSON.stringify({ 
        error: 'Erro ao criar movimentação', 
        details: error.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // 2. Atualizar estoque_atual na tabela produtos
    let quantidade_ajuste = quantidade;
    if (tipo_movimentacao === 'SAIDA') {
      quantidade_ajuste = -quantidade;
    }

    const { error: updateProdutoError } = await supabaseAdmin
      .from('produtos')
      .update({ estoque_atual: supabaseAdmin.raw('estoque_atual + ?', quantidade_ajuste) })
      .eq('id', produto_id)
      .eq('medico_id', medico_id);

    if (updateProdutoError) {
      console.error('Erro ao atualizar estoque do produto após movimentação:', updateProdutoError);
      // Logar erro, mas não reverter a movimentação para manter o histórico
    }

    // 3. Se for SAIDA e houver lote_id, ajustar quantidade no lote
    if (tipo_movimentacao === 'SAIDA' && lote_id) {
      const { error: updateLoteError } = await supabaseAdmin
        .from('lotes_produtos')
        .update({ quantidade_lote: supabaseAdmin.raw('quantidade_lote - ?', quantidade) })
        .eq('id', lote_id)
        .eq('medico_id', medico_id);

      if (updateLoteError) {
        console.error('Erro ao atualizar quantidade do lote após movimentação de saída:', updateLoteError);
      }
    }

    return new Response(JSON.stringify(novaMovimentacao), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error('Erro em createMovimentacao:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function getMovimentacao(medico_id: string, movimentacao_id: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('movimentacoes_estoque')
      .select('*, produtos(nome_produto), lotes_produtos(numero_lote)')
      .eq('id', movimentacao_id)
      .eq('medico_id', medico_id)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Movimentação não encontrada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em getMovimentacao:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}
