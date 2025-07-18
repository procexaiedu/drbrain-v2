'use client';

import React, { useState, Fragment } from 'react';
import { useLotes, useCreateLote, useUpdateLote, useDeleteLote } from '../hooks/useLotes';
import { LoteProduto } from '../types';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon, PencilIcon, TrashIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format } from 'date-fns';
import ProductSelect from '@/components/ui/ProductSelect';

export default function LotesSection() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [produtoIdFilter, setProdutoIdFilter] = useState<string | undefined>(undefined);
  const { data, isLoading, isError, error } = useLotes(search, produtoIdFilter, page, limit);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLote, setCurrentLote] = useState<Partial<LoteProduto> | null>(null);

  const createLoteMutation = useCreateLote();
  const updateLoteMutation = useUpdateLote();
  const deleteLoteMutation = useDeleteLote();

  const handleNewLoteClick = () => {
    setIsEditing(false);
    setCurrentLote({ quantidade_lote: 0, data_validade: format(new Date(), 'yyyy-MM-dd'), data_entrada: format(new Date(), 'yyyy-MM-dd') }); // Valores padrão
    setIsModalOpen(true);
  };

  const handleEditLoteClick = (lote: LoteProduto) => {
    setIsEditing(true);
    setCurrentLote(lote);
    setIsModalOpen(true);
  };

  const handleDeleteLoteClick = (loteId: string) => {
    toast(`Tem certeza que deseja excluir este lote?`, {
      action: {
        label: 'Excluir',
        onClick: () => deleteLoteMutation.mutate(loteId),
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {},
      },
      duration: Infinity,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLote) return;

    try {
      if (isEditing) {
        await updateLoteMutation.mutateAsync({ loteId: currentLote.id!, loteData: currentLote });
      } else {
        await createLoteMutation.mutateAsync(currentLote as Omit<LoteProduto, 'id' | 'medico_id' | 'created_at' | 'updated_at'>);
      }
      setIsModalOpen(false);
      setCurrentLote(null);
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentLote(prev => ({
      ...prev,
      [name]: name === 'quantidade_lote' ? parseInt(value) : value,
    }));
  };

  if (isLoading) return <div className="text-center py-8">Carregando lotes...</div>;
  if (isError) return <div className="text-center py-8 text-red-600">Erro ao carregar lotes: {error?.message}</div>;

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Lotes de Produtos</h2>
        <button
          onClick={handleNewLoteClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Novo Lote
        </button>
      </div>

      <div className="mb-4 flex space-x-4">
        <input
          type="text"
          placeholder="Buscar lotes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
        <ProductSelect
          selectedProductId={produtoIdFilter || null}
          onSelectProduct={(id) => setProdutoIdFilter(id || undefined)}
          label="Filtrar por Produto"
        />
      </div>

      {data?.data && data.data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número do Lote</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validade</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.data.map((lote) => (
                <tr key={lote.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lote.produtos?.nome_produto || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lote.numero_lote || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lote.quantidade_lote}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(lote.data_validade), 'dd/MM/yyyy')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEditLoteClick(lote)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDeleteLoteClick(lote.id)} className="text-red-600 hover:text-red-900">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Controles de Paginação */}
          <nav
            className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6"
            aria-label="Pagination"
          >
            <div className="flex flex-1 justify-between sm:justify-end">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!data?.hasMore}
                className="relative ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          </nav>
        </div>
      ) : (
        <p className="text-center text-gray-500">Nenhum lote encontrado.</p>
      )}

      {/* Modal de Criação/Edição de Lote */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                    <ArchiveBoxIcon className="h-6 w-6 mr-2" />
                    {isEditing ? 'Editar Lote' : 'Novo Lote'}
                  </Dialog.Title>
                  <div className="mt-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="produto_id" className="block text-sm font-medium text-gray-700">Produto</label>
                        <ProductSelect
                          selectedProductId={currentLote?.produto_id || null}
                          onSelectProduct={(id) => setCurrentLote(prev => ({ ...prev, produto_id: id || undefined }))}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="numero_lote" className="block text-sm font-medium text-gray-700">Número do Lote (Opcional)</label>
                        <input type="text" name="numero_lote" id="numero_lote" value={currentLote?.numero_lote || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="quantidade_lote" className="block text-sm font-medium text-gray-700">Quantidade no Lote</label>
                        <input type="number" name="quantidade_lote" id="quantidade_lote" value={currentLote?.quantidade_lote || 0} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="data_validade" className="block text-sm font-medium text-gray-700">Data de Validade</label>
                        <input type="date" name="data_validade" id="data_validade" value={currentLote?.data_validade ? format(new Date(currentLote.data_validade), 'yyyy-MM-dd') : ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="data_entrada" className="block text-sm font-medium text-gray-700">Data de Entrada (Opcional)</label>
                        <input type="date" name="data_entrada" id="data_entrada" value={currentLote?.data_entrada ? format(new Date(currentLote.data_entrada), 'yyyy-MM-dd') : ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div className="mt-4 flex justify-end space-x-3">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          onClick={() => setIsModalOpen(false)}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          {isEditing ? 'Salvar Alterações' : 'Criar Lote'}
                        </button>
                      </div>
                    </form>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
