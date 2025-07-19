import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Function get-medico-profile called');

Deno.serve(async (req: Request) => {
  // This is needed if you're planning to invoke your function from a browser.
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
    console.log('User authenticated:', user.id);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('medico_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      // Distinguish between "not found" and other errors
      if (profileError.code === 'PGRST116') { // PGRST116: "Standard error: query returned no rows"
        return new Response(JSON.stringify({ error: 'Profile not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }
      return new Response(JSON.stringify({ error: 'Failed to fetch profile', details: profileError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!profile) {
        console.log('Profile not found for user:', user.id);
        return new Response(JSON.stringify({ error: 'Profile not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
    }
    
    console.log('Profile fetched successfully:', profile);
    return new Response(JSON.stringify(profile), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Unhandled error in get-medico-profile:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

/* 
Para testar localmente (após supabase start e ter um usuário e token válidos):

supabase functions serve --no-verify-jwt

curl -i --location --request GET 'http://localhost:54321/functions/v1/get-medico-profile' \
--header 'Authorization: Bearer SEU_TOKEN_JWT_AQUI' \
--header 'Content-Type: application/json'

*/ 