import { decode } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

export interface UserData {
  aud: string;
  exp: number;
  sub: string;
  email: string;
  phone: string;
  app_metadata: {
    provider: string;
    providers: string[];
  };
  user_metadata: {
    [key: string]: any; // Pode variar, mas esperamos medico_id aqui
    medico_id?: string; 
    // Adicionar outros campos relevantes que podem estar no user_metadata
    nome_completo?: string;
    profile_image_url?: string;
  };
  role: string;
  aal: string;
  amr: Array<{ method: string; timestamp: number }>;
  session_id: string;
  is_anonymous: boolean;
}

export async function getUserDataFromJWT(req: Request): Promise<UserData | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('No Authorization header or Bearer token found');
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const [header, payload, signature] = decode(token);
    
    // Aqui, 'payload' é o objeto UserData.
    // A biblioteca djwt já faz o JSON.parse internamente.
    const userData = payload as unknown as UserData;

    // Validação básica do payload
    if (!userData || !userData.sub || !userData.user_metadata || !userData.user_metadata.medico_id) {
      console.warn('Token JWT inválido ou medico_id ausente no user_metadata.');
      throw new Error('Token JWT inválido ou medico_id ausente no user_metadata.');
    }
    
    // Você pode querer verificar a expiração do token aqui também,
    // embora o gateway da Supabase geralmente já faça isso.
    // if (userData.exp * 1000 < Date.now()) {
    //   console.warn('Token JWT expirado.');
    //   throw new Error('Token JWT expirado.');
    // }

    return userData;
  } catch (error) {
    console.error('Erro ao decodificar ou validar JWT:', error.message);
    // Lançar o erro para que a função chamadora possa tratá-lo (ex: retornando 401)
    throw new Error(`Authentication error: ${error.message}`);
  }
}

// Função auxiliar para obter medico_id diretamente, se preferir
export async function getMedicoIdFromJWT(req: Request): Promise<string | null> {
    const userData = await getUserDataFromJWT(req);
    return userData?.user_metadata?.medico_id || null;
} 