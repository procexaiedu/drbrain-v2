import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Function update-medico-profile called');

// Interface para os campos atualizáveis do perfil
interface ProfileUpdatePayload {
  nome_completo?: string;
  telefone?: string;
  especialidade_principal?: string;
  registro_conselho?: string;
  nome_clinica?: string;
  endereco_clinica?: string;
  nome_secretaria_ia?: string;
  // onboarding_concluido?: boolean; // Adicionar se for editável
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(req.headers.get('Authorization')!.replace('Bearer ', ''));

    if (userError || !user) {
      console.error('Error getting user or no user:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized', details: userError?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    console.log('User authenticated for update:', user.id);

    const payload: ProfileUpdatePayload = await req.json();
    console.log('Update payload received:', payload);

    // Validar e limpar o payload (remover campos não permitidos ou undefined)
    const allowedFields: (keyof ProfileUpdatePayload)[] = [
      'nome_completo',
      'telefone',
      'especialidade_principal',
      'registro_conselho',
      'nome_clinica',
      'endereco_clinica',
      'nome_secretaria_ia',
    ];
    const updateData: Partial<ProfileUpdatePayload> = {};
    for (const key of allowedFields) {
      if (payload[key] !== undefined) {
        (updateData as any)[key] = payload[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return new Response(JSON.stringify({ error: 'No valid fields provided for update' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log('Attempting to update profile with data:', updateData);
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('medico_profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update profile', details: updateError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    
    console.log('Profile updated successfully:', updatedProfile);
    return new Response(JSON.stringify(updatedProfile), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Unhandled error in update-medico-profile:', error);
    // Verifica se o erro é de parsing de JSON (corpo da requisição inválido)
    if (error instanceof SyntaxError) {
        return new Response(JSON.stringify({ error: 'Invalid JSON in request body', details: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

/*
Para testar localmente:
supabase functions serve --no-verify-jwt

curl -i --location --request PUT 'http://localhost:54321/functions/v1/update-medico-profile' \
--header 'Authorization: Bearer SEU_TOKEN_JWT_AQUI' \
--header 'Content-Type: application/json' \
--data '{
  "nome_completo": "Dr. Nome Atualizado",
  "telefone": "(11) 99876-5432"
}'
*/ 