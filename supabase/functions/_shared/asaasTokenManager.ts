import { supabaseAdmin } from './supabaseAdmin.ts';
import { decrypt } from './cryptoUtils.ts';

export async function getAsaasAccessToken(medico_id: string): Promise<string | null> {
  console.log(`getAsaasAccessToken: Buscando token para medico_id: ${medico_id}`);
  const { data: tokenData, error: fetchError } = await supabaseAdmin
    .from('medico_oauth_tokens')
    .select('access_token')
    .eq('medico_id', medico_id)
    .eq('provider', 'asaas')
    .single();

  if (fetchError || !tokenData) {
    console.error(`getAsaasAccessToken: Token Asaas não encontrado para ${medico_id}:`, fetchError);
    return null;
  }

  try {
    const decryptedToken = await decrypt(tokenData.access_token);
    console.log(`getAsaasAccessToken: Token Asaas desencriptado para ${medico_id}`);
    return decryptedToken;
  } catch (e) {
    console.error(`getAsaasAccessToken: Erro ao desencriptar token Asaas para ${medico_id}:`, e);
    return null;
  }
}

export async function saveAsaasAccessToken(medico_id: string, asaas_token: string): Promise<boolean> {
  try {
    const encryptedToken = await encrypt(asaas_token);
    const { error } = await supabaseAdmin
      .from('medico_oauth_tokens')
      .upsert({
        medico_id: medico_id,
        provider: 'asaas',
        access_token: encryptedToken,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'medico_id,provider' });

    if (error) {
      console.error(`saveAsaasAccessToken: Erro ao salvar token Asaas para ${medico_id}:`, error);
      return false;
    }
    console.log(`saveAsaasAccessToken: Token Asaas salvo/atualizado para ${medico_id}`);
    return true;
  } catch (e) {
    console.error(`saveAsaasAccessToken: Erro ao encriptar e salvar token Asaas para ${medico_id}:`, e);
    return false;
  }
}
