'use client';

import React, { useState, Fragment } from 'react';
import { useProdutos, useCreateProduto, useUpdateProduto, useDeleteProduto } from '../hooks/useProdutos';
import { Produto } from '../types';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, CubeIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function ProdutosSection() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, error } = useProdutos(search, page, limit);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduto, setCurrentProduto] = useState<Partial<Produto> | null>(null);

  const createProdutoMutation = useCreateProduto();
  const updateProdutoMutation = useUpdateProduto();
  const deleteProdutoMutation = useDeleteProduto();

  const handleNewProdutoClick = () => {
    setIsEditing(false);
    setCurrentProduto({ tipo_produto: 'Medicamento', estoque_atual: 0, estoque_minimo: 0 }); // Valores padrão
    setIsModalOpen(true);
  };

  const handleEditProdutoClick = (produto: Produto) => {
    setIsEditing(true);
    setCurrentProduto(produto);
    setIsModalOpen(true);
  };

  const handleDeleteProdutoClick = (produtoId: string) => {
    toast(`Tem certeza que deseja excluir este produto?`, {
      action: {
        label: 'Excluir',
        onClick: () => deleteProdutoMutation.mutate(produtoId),
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
    if (!currentProduto) return;

    try {
      if (isEditing) {
        await updateProdutoMutation.mutateAsync({ produtoId: currentProduto.id!, produtoData: currentProduto });
      } else {
        await createProdutoMutation.mutateAsync(currentProduto as Produto);
      }
      setIsModalOpen(false);
      setCurrentProduto(null);
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentProduto(prev => ({
      ...prev,
      [name]: name === 'preco_venda' || name === 'custo_aquisicao' || name === 'estoque_atual' || name === 'estoque_minimo' ? parseFloat(value) : value,
    }));
  };

  if (isLoading) return <div className="text-center py-8">Carregando produtos...</div>;
  if (isError) return <div className="text-center py-8 text-red-600">Erro ao carregar produtos: {error?.message}</div>;

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Produtos</h2>
        <button
          onClick={handleNewProdutoClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Novo Produto
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar produtos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {data?.data && data.data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço Venda</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.data.map((produto) => (
                <tr key={produto.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{produto.nome_produto}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{produto.tipo_produto}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{produto.estoque_atual}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {produto.preco_venda.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEditProdutoClick(produto)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDeleteProdutoClick(produto.id)} className="text-red-600 hover:text-red-900">
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
        <p className="text-center text-gray-500">Nenhum produto encontrado.</p>
      )}

      {/* Modal de Criação/Edição de Produto */}
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
                    <CubeIcon className="h-6 w-6 mr-2" />
                    {isEditing ? 'Editar Produto' : 'Novo Produto'}
                  </Dialog.Title>
                  <div className="mt-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="nome_produto" className="block text-sm font-medium text-gray-700">Nome do Produto</label>
                        <input type="text" name="nome_produto" id="nome_produto" value={currentProduto?.nome_produto || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="tipo_produto" className="block text-sm font-medium text-gray-700">Tipo</label>
                        <select name="tipo_produto" id="tipo_produto" value={currentProduto?.tipo_produto || 'Medicamento'} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                          <option value="Medicamento">Medicamento</option>
                          <option value="Insumo">Insumo</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="preco_venda" className="block text-sm font-medium text-gray-700">Preço de Venda</label>
                        <input type="text" name="preco_venda" id="preco_venda" value={currentProduto?.preco_venda || 0} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="custo_aquisicao" className="block text-sm font-medium text-gray-700">Custo de Aquisição</label>
                        <input type="text" name="custo_aquisicao" id="custo_aquisicao" value={currentProduto?.custo_aquisicao || 0} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="estoque_minimo" className="block text-sm font-medium text-gray-700">Estoque Mínimo</label>
                        <input type="text" name="estoque_minimo" id="estoque_minimo" value={currentProduto?.estoque_minimo || 0} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="codigo_barras" className="block text-sm font-medium text-gray-700">Código de Barras (Opcional)</label>
                        <input type="text" name="codigo_barras" id="codigo_barras" value={currentProduto?.codigo_barras || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="principio_ativo" className="block text-sm font-medium text-gray-700">Princípio Ativo (Opcional)</label>
                        <input type="text" name="principio_ativo" id="principio_ativo" value={currentProduto?.principio_ativo || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="categoria_regulatoria" className="block text-sm font-medium text-gray-700">Categoria Regulatória (Opcional)</label>
                        <input type="text" name="categoria_regulatoria" id="categoria_regulatoria" value={currentProduto?.categoria_regulatoria || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="numero_registro_anvisa" className="block text-sm font-medium text-gray-700">Registro ANVISA (Opcional)</label>
                        <input type="text" name="numero_registro_anvisa" id="numero_registro_anvisa" value={currentProduto?.numero_registro_anvisa || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="empresa_detentora_registro" className="block text-sm font-medium text-gray-700">Empresa Detentora Registro (Opcional)</label>
                        <input type="text" name="empresa_detentora_registro" id="empresa_detentora_registro" value={currentProduto?.empresa_detentora_registro || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="fornecedor_id" className="block text-sm font-medium text-gray-700">Fornecedor (Opcional)</label>
                        <FornecedorSelect
                          selectedFornecedorId={currentProduto?.fornecedor_id || null}
                          onSelectFornecedor={(id) => setCurrentProduto(prev => ({ ...prev, fornecedor_id: id || undefined }))}
                        />
                      </div>
                      <div>
                        <label htmlFor="localizacao_estoque" className="block text-sm font-medium text-gray-700">Localização no Estoque (Opcional)</label>
                        <input type="text" name="localizacao_estoque" id="localizacao_estoque" value={currentProduto?.localizacao_estoque || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
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
                          {isEditing ? 'Salvar Alterações' : 'Criar Produto'}
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
