import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Function dashboard-analytics-management loaded');

// Extrair a rota do URL
function extractRoute(url: string): { route: string; type?: string } {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  
  console.log('Original pathname:', pathname);
  
  let cleanPath = '';
  
  if (pathname.includes('dashboard-analytics-management')) {
    const parts = pathname.split('dashboard-analytics-management');
    cleanPath = parts[1] || '';
  } else {
    cleanPath = pathname;
  }
  
  console.log('Clean path:', cleanPath);
  
  const parts = cleanPath.split('/').filter(p => p);
  console.log('URL parts:', parts);
  
  if (parts.length === 0) {
    return { route: 'summary' }; // Default para um resumo geral
  }

  if (parts.length === 1) {
    if (parts[0] === 'estoque' || parts[0] === 'financeiro' || parts[0] === 'pacientes') {
      return { route: 'report', type: parts[0] };
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
    const { route, type } = extractRoute(req.url);
    console.log('Route extracted:', { route, type });

    // Roteamento baseado no método e rota
    switch (route) {
      case 'summary':
        if (req.method === 'GET') {
          return await getOverallSummary(medico_id);
        }
        break;
      case 'report':
        if (req.method === 'GET') {
          if (type === 'estoque') return await getEstoqueReport(medico_id, req);
          if (type === 'financeiro') return await getFinanceiroReport(medico_id, req);
          if (type === 'pacientes') return await getPacientesReport(medico_id, req);
        }
        break;
    }

    return new Response(JSON.stringify({ error: 'Rota não encontrada' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    });

  } catch (error) {
    console.error('Erro na Edge Function dashboard-analytics-management:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Funções de Relatórios
async function getOverallSummary(medico_id: string) {
  try {
    // Exemplo: Contagem de produtos, total de cobranças pendentes, etc.
    const { count: totalProdutos, error: produtosError } = await supabaseAdmin
      .from('produtos')
      .select('id', { count: 'exact', head: true })
      .eq('medico_id', medico_id);

    const { count: cobrancasPendentes, error: cobrancasError } = await supabaseAdmin
      .from('cobrancas')
      .select('id', { count: 'exact', head: true })
      .eq('medico_id', medico_id)
      .eq('status_cobranca', 'PENDENTE');

    if (produtosError || cobrancasError) {
      console.error('Erro ao buscar resumo geral:', produtosError || cobrancasError);
      throw new Error('Erro ao buscar resumo geral.');
    }

    return new Response(JSON.stringify({
      total_produtos: totalProdutos || 0,
      cobrancas_pendentes: cobrancasPendentes || 0,
      // Adicionar mais métricas aqui
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em getOverallSummary:', error);
    return new Response(JSON.stringify({ error: 'Erro interno', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function getEstoqueReport(medico_id: string, req: Request) {
  try {
    // Exemplo: Produtos com estoque baixo
    const { data: produtosBaixoEstoque, error } = await supabaseAdmin
      .from('produtos')
      .select('nome_produto, estoque_atual, estoque_minimo')
      .eq('medico_id', medico_id)
      .lt('estoque_atual', supabaseAdmin.ref('estoque_minimo'));

    if (error) {
      console.error('Erro ao buscar relatório de estoque:', error);
      throw new Error('Erro ao buscar relatório de estoque.');
    }

    // Exemplo: Valoração total do estoque
    const { data: valorEstoqueData, error: valorEstoqueError } = await supabaseAdmin
      .from('produtos')
      .select('sum(estoque_atual * custo_aquisicao)')
      .eq('medico_id', medico_id)
      .single();

    if (valorEstoqueError) {
      console.error('Erro ao calcular valor do estoque:', valorEstoqueError);
      throw new Error('Erro ao calcular valor do estoque.');
    }

    return new Response(JSON.stringify({
      produtos_baixo_estoque: produtosBaixoEstoque || [],
      valor_total_estoque: valorEstoqueData?.sum || 0,
      // Adicionar mais relatórios de estoque aqui
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em getEstoqueReport:', error);
    return new Response(JSON.stringify({ error: 'Erro interno', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function getFinanceiroReport(medico_id: string, req: Request) {
  try {
    const url = new URL(req.url);
    const start_date = url.searchParams.get('start_date');
    const end_date = url.searchParams.get('end_date');

    let queryReceitas = supabaseAdmin
      .from('transacoes_financeiras')
      .select('valor')
      .eq('medico_id', medico_id)
      .eq('tipo_transacao', 'RECEITA');

    let queryDespesas = supabaseAdmin
      .from('transacoes_financeiras')
      .select('valor')
      .eq('medico_id', medico_id)
      .eq('tipo_transacao', 'DESPESA');

    if (start_date && end_date) {
      queryReceitas = queryReceitas.gte('data_transacao', start_date).lte('data_transacao', end_date);
      queryDespesas = queryDespesas.gte('data_transacao', start_date).lte('data_transacao', end_date);
    }

    const { data: receitasData, error: receitasError } = await queryReceitas;
    const { data: despesasData, error: despesasError } = await queryDespesas;

    if (receitasError || despesasError) {
      console.error('Erro ao buscar relatório financeiro:', receitasError || despesasError);
      throw new Error('Erro ao buscar relatório financeiro.');
    }

    const totalReceitas = receitasData?.reduce((sum, t) => sum + parseFloat(t.valor), 0) || 0;
    const totalDespesas = despesasData?.reduce((sum, t) => sum + parseFloat(t.valor), 0) || 0;
    const lucroPrejuizo = totalReceitas - totalDespesas;

    return new Response(JSON.stringify({
      total_receitas: totalReceitas,
      total_despesas: totalDespesas,
      lucro_prejuizo: lucroPrejuizo,
      // Adicionar mais relatórios financeiros aqui
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em getFinanceiroReport:', error);
    return new Response(JSON.stringify({ error: 'Erro interno', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function getPacientesReport(medico_id: string, req: Request) {
  try {
    // Exemplo: Contagem de pacientes por status
    const { data: pacientesPorStatus, error: statusError } = await supabaseAdmin
      .from('pacientes')
      .select('status_paciente, count')
      .eq('medico_id', medico_id)
      .rollup();

    if (statusError) {
      console.error('Erro ao buscar relatório de pacientes por status:', statusError);
      throw new Error('Erro ao buscar relatório de pacientes.');
    }

    // Exemplo: Pacientes com cobranças pendentes
    const { data: pacientesComPendencia, error: pendenciaError } = await supabaseAdmin
      .from('pacientes')
      .select('nome_completo, cobrancas(valor, data_vencimento, status_cobranca)')
      .eq('medico_id', medico_id)
      .in('cobrancas.status_cobranca', ['PENDENTE', 'VENCIDO']);

    if (pendenciaError) {
      console.error('Erro ao buscar pacientes com pendência:', pendenciaError);
      throw new Error('Erro ao buscar pacientes com pendência.');
    }

    return new Response(JSON.stringify({
      pacientes_por_status: pacientesPorStatus || [],
      pacientes_com_pendencia: pacientesComPendencia || [],
      // Adicionar mais relatórios de pacientes aqui
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em getPacientesReport:', error);
    return new Response(JSON.stringify({ error: 'Erro interno', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}
