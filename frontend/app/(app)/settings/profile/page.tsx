'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient'; // Para pegar o token de sessão

// Tipagem para os dados do perfil do médico
interface MedicoProfile {
  id?: string;
  nome_completo: string;
  email?: string; // Apenas visualização
  telefone: string;
  especialidade_principal: string;
  registro_conselho: string;
  nome_clinica: string;
  endereco_clinica: string;
  nome_secretaria_ia: string;
  // onboarding_concluido?: boolean; // Pode ser útil depois
}

const initialProfileState: MedicoProfile = {
  nome_completo: '',
  email: '',
  telefone: '',
  especialidade_principal: '',
  registro_conselho: '',
  nome_clinica: '',
  endereco_clinica: '',
  nome_secretaria_ia: '',
};

// Função para buscar o perfil
const fetchMedicoProfile = async (): Promise<MedicoProfile> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Usuário não autenticado para buscar perfil.");

  const response = await fetch('/edge/v1/get-medico-profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `Erro ao buscar perfil: ${response.status}`);
  }
  return response.json();
};

// Função para atualizar o perfil
const updateMedicoProfile = async (profileData: Partial<MedicoProfile>): Promise<MedicoProfile> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Usuário não autenticado para atualizar perfil.");

  const response = await fetch('/edge/v1/update-medico-profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `Erro ao atualizar perfil: ${response.status}`);
  }
  return response.json();
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { setPageTitle, setPageSubtitle, setBreadcrumbs } = useApp();
  const queryClient = useQueryClient();
  const [profileFormData, setProfileFormData] = useState<MedicoProfile>(initialProfileState);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Configurar título da página
  useEffect(() => {
    setPageTitle('Configurações de Perfil');
    setPageSubtitle('Gerencie suas informações pessoais e profissionais');
    setBreadcrumbs([
      { label: 'Configurações', href: '/settings' },
      { label: 'Perfil' }
    ]);
  }, [setPageTitle, setPageSubtitle, setBreadcrumbs]);

  const {
    data: fetchedProfile,
    isLoading: isFetchingProfile,
    error: fetchError,
  } = useQuery<MedicoProfile, Error>({
    queryKey: ['medicoProfile', user?.id], // Chave de query depende do user.id
    queryFn: fetchMedicoProfile,
    enabled: !!user, // Só executa a query se o usuário estiver carregado
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  useEffect(() => {
    if (fetchedProfile) {
      setProfileFormData({
        ...initialProfileState, // Garante que todos os campos estão presentes
        ...fetchedProfile,
        email: user?.email || fetchedProfile.email || '', // Prioriza email do user auth
      });
    }
  }, [fetchedProfile, user]);

  const mutation = useMutation<MedicoProfile, Error, Partial<MedicoProfile>>({
    mutationFn: updateMedicoProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['medicoProfile', user?.id], data); // Atualiza o cache imediatamente
      // queryClient.invalidateQueries({ queryKey: ['medicoProfile', user?.id] }); // Ou invalida para refetch
      setFormSuccessMessage("Perfil atualizado com sucesso!");
      setFormError(null);
       if (data) {
        setProfileFormData(prev => ({...prev, ...data, email: user?.email || data.email || ''}));
      }
    },
    onError: (error) => {
      setFormError(error.message || "Falha ao atualizar o perfil. Tente novamente.");
      setFormSuccessMessage(null);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Remover o campo de email do payload de atualização, pois é read-only e gerenciado pelo auth
    const { email, ...updatePayload } = profileFormData;
    mutation.mutate(updatePayload);
  };

  if (isFetchingProfile) {
    return (
      <div className="flex justify-center items-center h-full p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-3 text-indigo-700">Carregando perfil...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-6 bg-gray-50 min-h-full text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Erro ao Carregar Perfil</h1>
        <p className="text-red-500">{fetchError.message}</p>
        <button 
          onClick={() => queryClient.refetchQueries({ queryKey: ['medicoProfile', user?.id]})}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Meu Perfil</h1>
      
      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-8 space-y-6 max-w-3xl mx-auto">
        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Informações Pessoais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="nome_completo" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input type="text" name="nome_completo" id="nome_completo" value={profileFormData.nome_completo} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email (Login)</label>
              <input type="email" name="email" id="email" value={profileFormData.email} readOnly className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-not-allowed" />
            </div>
            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input type="tel" name="telefone" id="telefone" value={profileFormData.telefone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="especialidade_principal" className="block text-sm font-medium text-gray-700 mb-1">Especialidade Principal</label>
              <input type="text" name="especialidade_principal" id="especialidade_principal" value={profileFormData.especialidade_principal} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
             <div>
              <label htmlFor="registro_conselho" className="block text-sm font-medium text-gray-700 mb-1">Registro Conselho (CRM/CRO/etc)</label>
              <input type="text" name="registro_conselho" id="registro_conselho" value={profileFormData.registro_conselho} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Informações da Clínica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="nome_clinica" className="block text-sm font-medium text-gray-700 mb-1">Nome da Clínica</label>
              <input type="text" name="nome_clinica" id="nome_clinica" value={profileFormData.nome_clinica} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="endereco_clinica" className="block text-sm font-medium text-gray-700 mb-1">Endereço da Clínica</label>
              <input type="text" name="endereco_clinica" id="endereco_clinica" value={profileFormData.endereco_clinica} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
          </div>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Configurações da Secretária IA</h2>
           <div>
              <label htmlFor="nome_secretaria_ia" className="block text-sm font-medium text-gray-700 mb-1">Nome da Secretária IA</label>
              <input type="text" name="nome_secretaria_ia" id="nome_secretaria_ia" value={profileFormData.nome_secretaria_ia} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
        </section>

        {formError && (
          <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{formError}</p>
        )}
        {formSuccessMessage && (
          <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md">{formSuccessMessage}</p>
        )}

        <div className="pt-6 text-right">
          <button 
            type="submit"
            disabled={mutation.isPending || isFetchingProfile}
            className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {mutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
} 