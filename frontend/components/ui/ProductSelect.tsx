'use client';

import React, { Fragment, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { useProdutos } from '@/app/(app)/estoque/hooks/useProdutos';
import { Produto } from '@/app/(app)/estoque/types';

interface ProductSelectProps {
  selectedProductId: string | null;
  onSelectProduct: (productId: string | null) => void;
  label?: string;
  disabled?: boolean;
}

export default function ProductSelect({
  selectedProductId,
  onSelectProduct,
  label = 'Selecionar Produto',
  disabled = false,
}: ProductSelectProps) {
  const { data, isLoading, isError } = useProdutos('', 1, 1000); // Buscar todos os produtos
  const products = data?.data || [];

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <Listbox value={selectedProductId} onChange={onSelectProduct} disabled={disabled}>
      {({ open }) => (
        <div className="relative mt-1">
          <Listbox.Label className="block text-sm font-medium text-gray-700">{label}</Listbox.Label>
          <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
            <span className="block truncate">{selectedProduct ? selectedProduct.nome_produto : 'Nenhum produto selecionado'}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </Listbox.Button>

          <Transition
            show={open}
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {isLoading && (
                <div className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-700">
                  Carregando produtos...
                </div>
              )}
              {isError && (
                <div className="relative cursor-default select-none py-2 pl-3 pr-9 text-red-700">
                  Erro ao carregar produtos.
                </div>
              )}
              {!isLoading && !isError && products.length === 0 && (
                <div className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-500">
                  Nenhum produto encontrado.
                </div>
              )}
              {!isLoading && !isError && products.length > 0 && (
                products.map((product) => (
                  <Listbox.Option
                    key={product.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-600 text-white' : 'text-gray-900'}`
                    }
                    value={product.id}
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {product.nome_produto}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-indigo-600'}`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))
              )}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  );
}
