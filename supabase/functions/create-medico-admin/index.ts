import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Function create-medico-admin called');

interface CreateMedicoPayload {
  nome_completo: string;
  email: string;
  senha_provisoria: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Autenticar o chamador (deve ser o admin)
    const { data: { user: callingUser }, error: callingUserError } = await supabaseAdmin.auth.getUser(req.headers.get('Authorization')!.replace('Bearer ', ''));

    if (callingUserError || !callingUser) {
      console.error('Admin Auth Error:', callingUserError);
      return new Response(JSON.stringify({ error: 'Unauthorized: Calling user not authenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    console.log('Calling user authenticated:', callingUser.id);

    // 2. Autorizar: Verificar se o chamador é o ADMIN_USER_ID
    const adminUserId = Deno.env.get('ADMIN_USER_ID');
    if (!adminUserId) {
        console.error('ADMIN_USER_ID not configured in Edge Function secrets.');
        return new Response(JSON.stringify({ error: 'Server configuration error: Admin ID not set' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    if (callingUser.id !== adminUserId) {
      console.warn(`Forbidden: User ${callingUser.id} is not admin ${adminUserId}.`);
      return new Response(JSON.stringify({ error: 'Forbidden: Not an admin' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }
    console.log('Calling user is ADMIN.');

    // 3. Processar o payload
    const payload: CreateMedicoPayload = await req.json();
    const { nome_completo, email, senha_provisoria } = payload;

    if (!nome_completo || !email || !senha_provisoria) {
      return new Response(JSON.stringify({ error: 'Missing required fields: nome_completo, email, senha_provisoria' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    console.log('Payload received for new doctor:', { nome_completo, email });

    // 4. Criar o novo usuário médico no Supabase Auth (usando o cliente admin que tem a service_role_key)
    const { data: newUserResponse, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: senha_provisoria,
      email_confirm: true, // Alterado para true para auto-confirmar o email
      // user_metadata: { nome_completo: nome_completo } // Opcional, pode ser útil
    });

    if (createUserError) {
      console.error('Error creating user in Auth:', createUserError);
      return new Response(JSON.stringify({ error: 'Failed to create user in Auth', details: createUserError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500, // Ou 400 se for erro de validação como email já existe
      });
    }
    
    if (!newUserResponse || !newUserResponse.user) {
        console.error('No user data returned from createUser');
        return new Response(JSON.stringify({ error: 'Failed to create user: No user data returned'}), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
    const newUserId = newUserResponse.user.id;
    console.log('New user created in Auth:', newUserId);

    // 5. Inserir o perfil na tabela medico_profiles
    const { error: insertProfileError } = await supabaseAdmin
      .from('medico_profiles')
      .insert({
        id: newUserId,
        nome_completo: nome_completo,
        email: email,
        onboarding_concluido: false, // Default
        // Outros campos default podem ser adicionados aqui
      });

    if (insertProfileError) {
      console.error('Error inserting into medico_profiles:', insertProfileError);
      // TODO: Considerar deletar o usuário do Auth se a inserção no perfil falhar (para consistência)
      // await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: 'Failed to save medico profile', details: insertProfileError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    
    console.log('Medico profile inserted successfully for user:', newUserId);
    return new Response(JSON.stringify({ message: 'Médico criado com sucesso', userId: newUserId, email: email }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error('Unhandled error in create-medico-admin:', error);
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
supabase functions serve --no-verify-jwt --env-file ./supabase/.env.local (se ADMIN_USER_ID estiver lá)

curl -i --location --request POST 'http://localhost:54321/functions/v1/create-medico-admin' \
--header 'Authorization: Bearer SEU_TOKEN_JWT_DE_ADMIN_AQUI' \
--header 'Content-Type: application/json' \
--data '{
  "nome_completo": "Dr. House",
  "email": "dr.house@example.com",
  "senha_provisoria": "complexpassword123"
}'
*/ 