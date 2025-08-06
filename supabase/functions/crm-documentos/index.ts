import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Function crm-documentos loaded');

// Extrair a rota do URL
function extractRoute(url: string): { route: string; id?: string; action?: string } {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  
  console.log('Original pathname:', pathname);
  
  let cleanPath = '';
  
  if (pathname.includes('crm-documentos')) {
    const parts = pathname.split('crm-documentos');
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
    if (parts[0] === 'upload') {
      return { route: 'upload' };
    }
    return { route: 'single', id: parts[0] };
  }
  
  if (parts.length === 2) {
    // /documentos/{id}/download
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
          return await listDocumentos(medico_id, req);
        }
        break;

      case 'upload':
        if (req.method === 'POST') {
          return await uploadDocumento(medico_id, req);
        }
        break;

      case 'single':
        if (req.method === 'DELETE') {
          return await deleteDocumento(medico_id, id!);
        }
        break;

      case 'action':
        if (action === 'download' && req.method === 'GET') {
          return await downloadDocumento(medico_id, id!);
        }
        break;
    }

    return new Response(JSON.stringify({ error: 'Rota não encontrada' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    });

  } catch (error) {
    console.error('Erro na Edge Function crm-documentos:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Listar documentos por lead ou paciente
async function listDocumentos(medico_id: string, req: Request) {
  try {
    const url = new URL(req.url);
    const lead_id = url.searchParams.get('lead_id');
    const paciente_id = url.searchParams.get('paciente_id');

    if (!lead_id && !paciente_id) {
      return new Response(JSON.stringify({ 
        error: 'Parâmetro obrigatório ausente',
        details: 'Forneça lead_id OU paciente_id'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    let query = supabaseAdmin
      .from('documentos_contato')
      .select('*')
      .eq('medico_id', medico_id);

    if (lead_id) {
      query = query.eq('lead_id', lead_id);
    } else if (paciente_id) {
      query = query.eq('paciente_id', paciente_id);
    }

    const { data, error } = await query
      .order('data_upload', { ascending: false });

    if (error) {
      console.error('Erro ao listar documentos:', error);
      return new Response(JSON.stringify({ error: 'Erro ao buscar documentos', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ 
      data: data || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em listDocumentos:', error);
    return new Response(JSON.stringify({ error: 'Erro interno', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Upload de documento
async function uploadDocumento(medico_id: string, req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const lead_id = formData.get('lead_id') as string;
    const paciente_id = formData.get('paciente_id') as string;
    const descricao_documento = formData.get('descricao_documento') as string;

    // Validações
    if (!file) {
      return new Response(JSON.stringify({ 
        error: 'Arquivo obrigatório',
        details: 'Forneça um arquivo para upload'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (!lead_id && !paciente_id) {
      return new Response(JSON.stringify({ 
        error: 'Associação obrigatória',
        details: 'Forneça lead_id OU paciente_id'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Validar tipo de arquivo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ 
        error: 'Tipo de arquivo não permitido',
        details: 'Tipos permitidos: PDF, imagens (JPG, PNG, GIF), Word, Excel, TXT'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Validar tamanho do arquivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ 
        error: 'Arquivo muito grande',
        details: 'Tamanho máximo permitido: 5MB'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Verificar se lead/paciente existe e pertence ao médico
    if (lead_id) {
      const { data: lead, error: leadError } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('id', lead_id)
        .eq('medico_id', medico_id)
        .single();

      if (leadError || !lead) {
        return new Response(JSON.stringify({ 
          error: 'Lead não encontrado',
          details: 'Lead não existe ou não pertence a você'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }
    }

    if (paciente_id) {
      const { data: paciente, error: pacienteError } = await supabaseAdmin
        .from('pacientes')
        .select('id')
        .eq('id', paciente_id)
        .eq('medico_id', medico_id)
        .single();

      if (pacienteError || !paciente) {
        return new Response(JSON.stringify({ 
          error: 'Paciente não encontrado',
          details: 'Paciente não existe ou não pertence a você'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }
    }

    // Gerar nome único para o arquivo
    const fileExtension = file.name.split('.').pop();
    const timestamp = Date.now();
    const uniqueFileName = `${medico_id}/${timestamp}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
    
    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('documentos-crm')
      .upload(uniqueFileName, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      return new Response(JSON.stringify({ 
        error: 'Erro no upload do arquivo',
        details: uploadError.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Salvar metadados no banco
    const documentoData = {
      medico_id,
      lead_id: lead_id || null,
      paciente_id: paciente_id || null,
      nome_arquivo_original: file.name,
      tipo_arquivo: file.type,
      tamanho_arquivo: file.size,
      storage_path: uploadData.path,
      descricao_documento: descricao_documento?.trim() || null,
      data_upload: new Date().toISOString()
    };

    const { data: novoDocumento, error: dbError } = await supabaseAdmin
      .from('documentos_contato')
      .insert(documentoData)
      .select()
      .single();

    if (dbError) {
      console.error('Erro ao salvar metadados:', dbError);
      
      // Tentar remover arquivo do storage se falhou salvar no banco
      try {
        await supabaseAdmin.storage
          .from('documentos-crm')
          .remove([uploadData.path]);
      } catch (cleanupError) {
        console.error('Erro na limpeza:', cleanupError);
      }

      return new Response(JSON.stringify({ 
        error: 'Erro ao salvar documento',
        details: dbError.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({
      message: 'Documento enviado com sucesso',
      documento: novoDocumento
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error('Erro em uploadDocumento:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Download de documento
async function downloadDocumento(medico_id: string, documento_id: string) {
  try {
    // Buscar metadados do documento
    const { data: documento, error: docError } = await supabaseAdmin
      .from('documentos_contato')
      .select('*')
      .eq('id', documento_id)
      .eq('medico_id', medico_id)
      .single();

    if (docError || !documento) {
      return new Response(JSON.stringify({ error: 'Documento não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Gerar URL de download assinada (válida por 1 hora)
    const { data: signedUrl, error: urlError } = await supabaseAdmin.storage
      .from('documentos-crm')
      .createSignedUrl(documento.storage_path, 3600); // 1 hora

    if (urlError) {
      console.error('Erro ao gerar URL:', urlError);
      return new Response(JSON.stringify({ 
        error: 'Erro ao gerar link de download',
        details: urlError.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({
      download_url: signedUrl.signedUrl,
      nome_arquivo: documento.nome_arquivo_original,
      tipo_arquivo: documento.tipo_arquivo,
      tamanho_arquivo: documento.tamanho_arquivo,
      expires_in: 3600 // segundos
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em downloadDocumento:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Deletar documento
async function deleteDocumento(medico_id: string, documento_id: string) {
  try {
    // Buscar metadados do documento
    const { data: documento, error: docError } = await supabaseAdmin
      .from('documentos_contato')
      .select('*')
      .eq('id', documento_id)
      .eq('medico_id', medico_id)
      .single();

    if (docError || !documento) {
      return new Response(JSON.stringify({ error: 'Documento não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Remover arquivo do storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('documentos-crm')
      .remove([documento.storage_path]);

    if (storageError) {
      console.error('Erro ao remover arquivo do storage:', storageError);
      // Continuar mesmo com erro no storage - o importante é remover do banco
    }

    // Remover registro do banco
    const { error: dbError } = await supabaseAdmin
      .from('documentos_contato')
      .delete()
      .eq('id', documento_id)
      .eq('medico_id', medico_id);

    if (dbError) {
      console.error('Erro ao remover do banco:', dbError);
      return new Response(JSON.stringify({ 
        error: 'Erro ao excluir documento',
        details: dbError.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Documento excluído com sucesso'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro em deleteDocumento:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
} 