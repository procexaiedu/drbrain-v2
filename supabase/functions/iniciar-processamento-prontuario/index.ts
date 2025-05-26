import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Function iniciar-processamento-prontuario loaded');

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

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método não permitido' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      });
    }

    console.log('Processing form data...');
    
    // Parse multipart form data
    const formData = await req.formData();
    const audioFile = formData.get('audioFile') as File;
    const paciente_id = formData.get('paciente_id') as string;
    const data_consulta = formData.get('data_consulta') as string;
    const audio_original_filename = formData.get('audio_original_filename') as string;

    console.log('Form data parsed:', { 
      hasAudioFile: !!audioFile, 
      paciente_id, 
      data_consulta, 
      audio_original_filename 
    });

    // Validar dados obrigatórios
    if (!audioFile || !paciente_id || !data_consulta || !audio_original_filename) {
      return new Response(JSON.stringify({ 
        error: 'Dados obrigatórios ausentes',
        details: 'audioFile, paciente_id, data_consulta e audio_original_filename são obrigatórios'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log('Validating patient ownership...');
    
    // Verificar se o paciente pertence ao médico
    const { data: paciente, error: pacienteError } = await supabaseAdmin
      .from('pacientes')
      .select('id')
      .eq('id', paciente_id)
      .eq('medico_id', medico_id)
      .single();

    if (pacienteError || !paciente) {
      console.error('Patient validation failed:', pacienteError);
      return new Response(JSON.stringify({ error: 'Paciente não encontrado ou não autorizado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    console.log('Creating prontuario record...');
    
    // Criar registro do prontuário
    const { data: prontuario, error: prontuarioError } = await supabaseAdmin
      .from('prontuarios')
      .insert({
        medico_id,
        paciente_id,
        data_consulta,
        status_prontuario: 'PENDENTE_UPLOAD_STORAGE',
        audio_original_filename,
        data_criacao: new Date().toISOString(),
        data_ultima_modificacao: new Date().toISOString()
      })
      .select()
      .single();

    if (prontuarioError) {
      console.error('Erro ao criar prontuário:', prontuarioError);
      return new Response(JSON.stringify({ 
        error: 'Erro ao criar prontuário',
        details: prontuarioError.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('Prontuario created:', prontuario.id);
    console.log('Uploading audio file to storage...');
    
    // Fazer upload do arquivo para o Storage
    const fileName = `${medico_id}/${prontuario.id}_${audio_original_filename}`;
    const fileBuffer = await audioFile.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from('consultas-audio')
      .upload(fileName, fileBuffer, {
        contentType: audioFile.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      
      // Excluir prontuário se o upload falhou
      await supabaseAdmin
        .from('prontuarios')
        .delete()
        .eq('id', prontuario.id);

      return new Response(JSON.stringify({ 
        error: 'Erro no upload do arquivo',
        details: uploadError.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('Audio file uploaded successfully. Updating prontuario status...');
    
    // Atualizar status para aguardando processamento
    const { error: updateError } = await supabaseAdmin
      .from('prontuarios')
      .update({
        status_prontuario: 'AGUARDANDO_PROCESSAMENTO_N8N',
        audio_storage_path: fileName,
        data_ultima_modificacao: new Date().toISOString()
      })
      .eq('id', prontuario.id);

    if (updateError) {
      console.error('Erro ao atualizar prontuário:', updateError);
    }

    console.log(`Prontuário ${prontuario.id} criado e arquivo enviado para storage`);

    return new Response(JSON.stringify({ 
      success: true,
      prontuario_id: prontuario.id,
      message: 'Prontuário criado e arquivo enviado para processamento'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro na Edge Function iniciar-processamento-prontuario:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 