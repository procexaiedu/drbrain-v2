import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Function get-dashboard-summary called');

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
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
      console.error('Error getting user or no user:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized', details: userError?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    console.log('User authenticated:', user.id);
    const medico_id = user.id;

    // Buscar nome do médico
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('medico_profiles')
      .select('nome_completo')
      .eq('id', medico_id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    // Buscar métricas de leads
    const { data: leadsData, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('status_funil_lead, data_criacao')
      .eq('medico_id', medico_id);

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
    }

    // Buscar métricas de pacientes
    const { data: pacientesData, error: pacientesError } = await supabaseAdmin
      .from('pacientes')
      .select('status_paciente, data_cadastro_paciente')
      .eq('medico_id', medico_id);

    if (pacientesError) {
      console.error('Error fetching pacientes:', pacientesError);
    }

    // Buscar métricas de prontuários
    const { data: prontuariosData, error: prontuariosError } = await supabaseAdmin
      .from('prontuarios')
      .select('status_prontuario, data_criacao, data_ultima_modificacao')
      .eq('medico_id', medico_id);

    if (prontuariosError) {
      console.error('Error fetching prontuarios:', prontuariosError);
    }

    // Processar dados de leads
    const leadsMetrics = processLeadsData(leadsData || []);
    
    // Processar dados de pacientes
    const pacientesMetrics = processPacientesData(pacientesData || []);
    
    // Processar dados de prontuários
    const prontuariosMetrics = processProntuariosData(prontuariosData || []);

    // Estruturar resposta
    const dashboardData = {
      saudacao_nome_medico: profile?.nome_completo || 'Doutor(a)',
      metricas_crm: {
        leads_por_status: leadsMetrics.leadsPorStatus,
        leads_ativos: leadsMetrics.leadsAtivos,
        novos_pacientes_mes: pacientesMetrics.novosPacientesMes,
        pacientes_por_status: pacientesMetrics.pacientesPorStatus,
        total_pacientes_ativos: pacientesMetrics.totalPacientesAtivos
      },
      metricas_prontuarios: {
        prontuarios_por_status: prontuariosMetrics.prontuariosPorStatus,
        prontuarios_rascunho: prontuariosMetrics.prontuariosRascunho,
        prontuarios_finalizados: prontuariosMetrics.prontuariosFinalizados,
        criados_ultimos_7_dias: prontuariosMetrics.criadosUltimos7Dias,
        finalizados_ultimos_7_dias: prontuariosMetrics.finalizadosUltimos7Dias
      },
      placeholders_agenda: {
        proximas_consultas: 3,
        consultas_hoje: 1,
        consultas_semana: 8
      },
      placeholders_financeiro: {
        receita_mes: 15000,
        consultas_pagas: 45,
        pendencias: 3
      }
    };

    console.log('Dashboard data processed successfully');
    return new Response(JSON.stringify(dashboardData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Unhandled error in get-dashboard-summary:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Função para processar dados de leads
function processLeadsData(leads: any[]) {
  const leadsPorStatus: Record<string, number> = {};
  let leadsAtivos = 0;

  leads.forEach(lead => {
    const status = lead.status_funil_lead;
    leadsPorStatus[status] = (leadsPorStatus[status] || 0) + 1;
    
    // Considerar leads ativos (não perdidos nem convertidos)
    if (status !== 'Perdido' && status !== 'Convertido') {
      leadsAtivos++;
    }
  });

  return {
    leadsPorStatus,
    leadsAtivos
  };
}

// Função para processar dados de pacientes
function processPacientesData(pacientes: any[]) {
  const pacientesPorStatus: Record<string, number> = {};
  let novosPacientesMes = 0;
  let totalPacientesAtivos = 0;

  const umMesAtras = new Date();
  umMesAtras.setMonth(umMesAtras.getMonth() - 1);

  pacientes.forEach(paciente => {
    const status = paciente.status_paciente;
    pacientesPorStatus[status] = (pacientesPorStatus[status] || 0) + 1;
    
    // Contar pacientes ativos
    if (status === 'Paciente Ativo') {
      totalPacientesAtivos++;
    }
    
    // Contar novos pacientes do mês
    const dataCadastro = new Date(paciente.data_cadastro_paciente);
    if (dataCadastro >= umMesAtras) {
      novosPacientesMes++;
    }
  });

  return {
    pacientesPorStatus,
    novosPacientesMes,
    totalPacientesAtivos
  };
}

// Função para processar dados de prontuários
function processProntuariosData(prontuarios: any[]) {
  const prontuariosPorStatus: Record<string, number> = {};
  let prontuariosRascunho = 0;
  let prontuariosFinalizados = 0;
  
  const criadosUltimos7Dias: { data: string; contagem: number }[] = [];
  const finalizadosUltimos7Dias: { data: string; contagem: number }[] = [];

  // Preparar arrays para os últimos 7 dias
  const hoje = new Date();
  const diasMap = new Map<string, { criados: number; finalizados: number }>();
  
  for (let i = 6; i >= 0; i--) {
    const data = new Date(hoje);
    data.setDate(data.getDate() - i);
    const dataStr = data.toISOString().split('T')[0];
    diasMap.set(dataStr, { criados: 0, finalizados: 0 });
  }

  prontuarios.forEach(prontuario => {
    const status = prontuario.status_prontuario;
    prontuariosPorStatus[status] = (prontuariosPorStatus[status] || 0) + 1;
    
    // Contar rascunhos e finalizados
    if (status === 'RASCUNHO_DISPONIVEL') {
      prontuariosRascunho++;
    } else if (status === 'FINALIZADO') {
      prontuariosFinalizados++;
    }
    
    // Processar dados dos últimos 7 dias
    const dataCriacao = new Date(prontuario.data_criacao);
    const dataModificacao = new Date(prontuario.data_ultima_modificacao);
    
    const dataCriacaoStr = dataCriacao.toISOString().split('T')[0];
    const dataModificacaoStr = dataModificacao.toISOString().split('T')[0];
    
    // Contar criados
    if (diasMap.has(dataCriacaoStr)) {
      const dia = diasMap.get(dataCriacaoStr)!;
      dia.criados++;
      diasMap.set(dataCriacaoStr, dia);
    }
    
    // Contar finalizados (se status for FINALIZADO)
    if (status === 'FINALIZADO' && diasMap.has(dataModificacaoStr)) {
      const dia = diasMap.get(dataModificacaoStr)!;
      dia.finalizados++;
      diasMap.set(dataModificacaoStr, dia);
    }
  });

  // Converter map para arrays
  diasMap.forEach((valores, data) => {
    criadosUltimos7Dias.push({ data, contagem: valores.criados });
    finalizadosUltimos7Dias.push({ data, contagem: valores.finalizados });
  });

  return {
    prontuariosPorStatus,
    prontuariosRascunho,
    prontuariosFinalizados,
    criadosUltimos7Dias,
    finalizadosUltimos7Dias
  };
}

/* 
Para testar localmente (após supabase start e ter um usuário e token válidos):

supabase functions serve --no-verify-jwt

curl -i --location --request GET 'http://localhost:54321/functions/v1/get-dashboard-summary' \
--header 'Authorization: Bearer SEU_TOKEN_JWT_AQUI' \
--header 'Content-Type: application/json'

*/ 