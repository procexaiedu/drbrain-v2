import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ATENÇÃO: Estas variáveis de ambiente precisam ser configuradas nos Secrets do Supabase para esta Edge Function.
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is not set in environment variables.");
}
if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    // Configurações de autenticação para o cliente admin, se necessário.
    // Geralmente, a service_role key bypassa o RLS e outras verificações de auth.
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

console.log('Supabase admin client initialized.'); 