'use client';

import AppShell from '@/components/layout/AppShell';
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname, redirect } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

// Componente de Loader simples
const FullScreenLoader = () => (
  <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
    <p className="ml-3 text-indigo-700 font-semibold">Carregando informações...</p>
  </div>
);

interface MedicoProfile {
  id?: string;
  nome_completo?: string;
  onboarding_concluido?: boolean;
  // Adicionar outros campos do perfil se necessário para o layout
}

// Função para buscar o perfil do médico
const fetchMedicoProfileForLayout = async (): Promise<MedicoProfile | null> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    // Não logar erro aqui, pois o useAuth já cuida do redirecionamento se não houver sessão
    return null; 
  }

  const response = await fetch('/edge/v1/get-medico-profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    // Se o perfil não for encontrado (404), pode ser um novo usuário que ainda não tem perfil criado pela function de signup
    // ou um erro. Para onboarding, trataremos como não concluído se o perfil não existir.
    if (response.status === 404) {
        console.warn('Perfil do médico não encontrado (404) no AppLayout. Assumindo onboarding não concluído.');
        return { onboarding_concluido: false }; // Assumir que onboarding é necessário
    }
    // Outros erros podem ser mais críticos
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    console.error('Erro ao buscar perfil no AppLayout:', errorData.message || response.status);
    // Não lançar erro aqui para não quebrar o layout, mas o onboarding pode não funcionar como esperado.
    return null; 
  }
  return response.json();
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Para evitar redirecionamento se já estiver em /onboarding

  const {
    data: medicoProfile,
    isLoading: profileIsLoading,
    error: profileError, // Para depuração, se necessário
  } = useQuery<MedicoProfile | null, Error>({ // Permite que medicoProfile seja null
    queryKey: ['medicoProfileForLayout', user?.id], // Chave depende do user.id
    queryFn: fetchMedicoProfileForLayout,
    enabled: !!user && !authIsLoading, // Só busca perfil se usuário estiver logado e auth não estiver carregando
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1, // Tentar apenas 1 vez em caso de erro para não bombardear
  });

  useEffect(() => {
    if (authIsLoading) return; // Espera autenticação carregar

    if (!user) {
      redirect('/login');
      return;
    }

    // Se o usuário está logado e o perfil já foi carregado (ou falhou e é null)
    if (!profileIsLoading && user) {
      if (medicoProfile?.onboarding_concluido === false && pathname !== '/onboarding') {
        redirect('/onboarding');
      } else if (medicoProfile?.onboarding_concluido === true && pathname === '/onboarding'){
        // Se o onboarding foi concluído e o usuário está na página de onboarding, redireciona para o dashboard
        redirect('/dashboard');
      }
      // Se medicoProfile for null devido a um erro de fetch (que não seja 404 tratado), 
      // ou onboarding_concluido for undefined, o usuário não será redirecionado para /onboarding.
      // Isso pode precisar de tratamento adicional dependendo da criticidade.
      // O caso de 404 já retorna { onboarding_concluido: false } e força o onboarding.
    }

  }, [authIsLoading, user, medicoProfile, profileIsLoading, pathname, router]);

  // Loader principal enquanto auth ou perfil estão carregando
  if (authIsLoading || (user && profileIsLoading && pathname !== '/onboarding')) {
    // Se estiver na página de onboarding, permite renderizar mesmo que o perfil ainda esteja carregando em background
    // para evitar loop de loader se o onboarding em si precisar dos dados do perfil.
    return <FullScreenLoader />;
  }

  // Se o usuário não estiver logado (verificação final, embora o useEffect deva ter redirecionado)
  if (!user) {
    return <FullScreenLoader />; // Ou redirecionar novamente, mas useEffect deve cuidar disso
  }

  // Se chegou aqui, o usuário está logado.
  // Se onboarding não está concluído e não está na página de onboarding, o useEffect acima já deve ter redirecionado.
  // Se estiver na página de onboarding, permite renderizá-la.
  // Se onboarding estiver concluído, renderiza o AppShell.
  if (medicoProfile?.onboarding_concluido === false && pathname === '/onboarding') {
    return <>{children}</>; // Permite renderizar a página de onboarding
  }
  
  if (medicoProfile?.onboarding_concluido === true || medicoProfile === null && profileError) {
     // Se onboarding concluído, ou se houve erro ao buscar perfil (e não é um 404 que força onboarding)
     // permite o acesso ao AppShell. Se medicoProfile for null e profileError existir,
     // significa que a busca falhou de forma crítica, mas ainda permitimos o acesso ao app.
     // O ideal seria ter uma página de erro mais robusta ou um estado de "perfil indisponível".
    return <AppShell>{children}</AppShell>;
  }

  // Fallback loader se nenhuma das condições acima for atendida (ex: perfil ainda não definido mas não carregando)
  // Isso ajuda a prevenir piscar de tela ou renderização indevida.
  return <FullScreenLoader />;
} 