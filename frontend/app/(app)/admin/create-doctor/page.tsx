'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient'; // Para pegar o token de sessão do admin

// Variável de ambiente para o ID do admin (deve ser configurada no .env.local)
const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID;

interface CreateDoctorPayload {
  nome_completo: string;
  email: string;
  senha_provisoria: string;
}

interface CreateDoctorResponse { // Supondo que a Edge Function retorne isso
    message: string;
    userId: string;
    email: string;
}

// Função para criar médico (chamada pela mutação)
const createDoctorAdmin = async (payload: CreateDoctorPayload): Promise<CreateDoctorResponse> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Admin não autenticado para criar médico.");

  // Aqui verificamos se o usuário logado é realmente o admin, como uma dupla checagem
  // A Edge Function fará a verificação final e mais segura.
  if (session.user.id !== ADMIN_USER_ID) {
    throw new Error("Operação não permitida. Apenas administradores podem criar médicos.");
  }

  const response = await fetch('/edge/v1/create-medico-admin', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.message || responseData.error || `Erro ao criar médico: ${response.status}`);
  }
  return responseData;
};

export default function CreateDoctorPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient(); // Não usado diretamente aqui, mas bom ter se precisar invalidar algo
  
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [senhaProvisoria, setSenhaProvisoria] = useState('');
  
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      setCheckingAuth(false);
      if (user && user.id === ADMIN_USER_ID) {
        setIsAuthorized(true);
      } else if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, authLoading, router]);

  const mutation = useMutation<CreateDoctorResponse, Error, CreateDoctorPayload>({
    mutationFn: createDoctorAdmin,
    onSuccess: (data) => {
      setFormSuccessMessage(data.message || `Médico ${nomeCompleto} criado com sucesso com o email ${email}!`);
      setFormError(null);
      setNomeCompleto('');
      setEmail('');
      setSenhaProvisoria('');
      // Se você tivesse uma lista de médicos para invalidar, faria aqui:
      // queryClient.invalidateQueries({ queryKey: ['listaDeMedicosAdmin'] });
    },
    onError: (error) => {
      setFormError(error.message || "Falha ao criar médico. Verifique os dados ou tente novamente.");
      setFormSuccessMessage(null);
    },
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccessMessage(null);

    if (!nomeCompleto || !email || !senhaProvisoria) {
        setFormError("Todos os campos são obrigatórios.");
        return;
    }
    if (senhaProvisoria.length < 6) {
        setFormError("A senha provisória deve ter no mínimo 6 caracteres.");
        return;
    }
    mutation.mutate({ nome_completo: nomeCompleto, email, senha_provisoria: senhaProvisoria });
  };

  if (checkingAuth || authLoading) { // Continua mostrando loader enquanto verifica autorização
    return (
      <div className="flex justify-center items-center h-full p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-3 text-indigo-700">Verificando autorização...</p>
      </div>
    );
  }

  if (!isAuthorized) { // Se terminou de checar e não está autorizado
    return (
        <div className="flex flex-col justify-center items-center h-full p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
            <p className="text-gray-700">Você não tem permissão para acessar esta página.</p>
            <button onClick={() => router.push('/dashboard')} className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                Voltar ao Dashboard
            </button>
        </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Criar Novo Médico</h1>
      
      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-8 space-y-6 max-w-xl mx-auto">
        <div>
          <label htmlFor="nomeCompleto" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo do Médico</label>
          <input 
            type="text" 
            name="nomeCompleto" 
            id="nomeCompleto" 
            value={nomeCompleto} 
            onChange={(e) => setNomeCompleto(e.target.value)} 
            required 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email do Médico (para login)</label>
          <input 
            type="email" 
            name="email" 
            id="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
          />
        </div>
        <div>
          <label htmlFor="senhaProvisoria" className="block text-sm font-medium text-gray-700 mb-1">Senha Provisória</label>
          <input 
            type="password" 
            name="senhaProvisoria" 
            id="senhaProvisoria" 
            value={senhaProvisoria} 
            onChange={(e) => setSenhaProvisoria(e.target.value)} 
            required 
            minLength={6}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
          />
        </div>

        {formError && (
          <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{formError}</p>
        )}
        {formSuccessMessage && (
          <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md">{formSuccessMessage}</p>
        )}

        <div className="pt-6 text-right">
          <button 
            type="submit"
            disabled={mutation.isPending || authLoading}
            className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {mutation.isPending ? 'Criando Médico...' : 'Criar Médico'}
          </button>
        </div>
      </form>
    </div>
  );
} 