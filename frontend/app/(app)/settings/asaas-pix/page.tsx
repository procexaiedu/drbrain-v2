'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

export default function AsaasPixSettingsPage() {
  const { setPageTitle, setPageSubtitle, setBreadcrumbs } = useApp();
  const [asaasPixKey, setAsaasPixKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPageTitle('Configurações Asaas PIX');
    setPageSubtitle('Gerencie sua chave PIX para recebimento de pagamentos.');
    setBreadcrumbs([
      { name: 'Configurações', href: '/settings' },
      { name: 'Asaas PIX', href: '/settings/asaas-pix' },
    ]);

    fetchAsaasPixKey();
  }, [setPageTitle, setPageSubtitle, setBreadcrumbs]);

  const fetchAsaasPixKey = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado.');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('medico_configuracoes')
        .select('asaas_pix_key')
        .eq('medico_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      if (data) {
        setAsaasPixKey(data.asaas_pix_key || '');
      }
    } catch (error: any) {
      console.error('Erro ao buscar chave PIX do Asaas:', error.message);
      toast.error(`Erro ao carregar chave PIX: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado.');
        setIsSaving(false);
        return;
      }

      const { error } = await supabase
        .from('medico_configuracoes')
        .upsert(
          { medico_id: user.id, asaas_pix_key: asaasPixKey },
          { onConflict: 'medico_id' }
        );

      if (error) {
        throw error;
      }

      toast.success('Chave PIX do Asaas salva com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar chave PIX do Asaas:', error.message);
      toast.error(`Erro ao salvar chave PIX: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center mb-4">
            <CurrencyDollarIcon className="h-7 w-7 mr-2 text-indigo-600" />
            Configurar Chave PIX Asaas
          </h2>
          <p className="text-gray-600 mb-6">
            Insira sua chave PIX do Asaas para que as cobranças geradas pelo sistema possam ser pagas diretamente para sua conta.
          </p>

          {isLoading ? (
            <div className="text-center py-8">Carregando configurações...</div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label htmlFor="asaasPixKey" className="block text-sm font-medium text-gray-700">
                  Sua Chave PIX Asaas
                </label>
                <input
                  type="text"
                  name="asaasPixKey"
                  id="asaasPixKey"
                  value={asaasPixKey}
                  onChange={(e) => setAsaasPixKey(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Ex: 00.000.000/0001-00 ou seuemail@email.com"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Esta é a chave que o Asaas usará para identificar sua conta PIX. Pode ser CPF/CNPJ, e-mail, telefone ou chave aleatória.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  disabled={isSaving}
                >
                  {isSaving ? 'Salvando...' : 'Salvar Chave PIX'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
