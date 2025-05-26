// Conteúdo inicial para a configuração do cliente Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Variável de ambiente NEXT_PUBLIC_SUPABASE_URL não encontrada.");
}
if (!supabaseAnonKey) {
  throw new Error("Variável de ambiente NEXT_PUBLIC_SUPABASE_ANON_KEY não encontrada.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 