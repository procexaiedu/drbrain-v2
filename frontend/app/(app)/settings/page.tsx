'use client';

import React from 'react';
import Link from 'next/link';
import { UserCircleIcon, LinkIcon, ArrowRightIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const settingsOptions = [
  {
    name: 'Perfil do Usuário',
    description: 'Atualize suas informações pessoais e de perfil.',
    href: '/settings/profile',
    icon: UserCircleIcon,
  },
  {
    name: 'Conexões de Aplicativos',
    description: 'Gerencie suas integrações com outros serviços, como o Google Calendar.',
    href: '/settings/connections',
    icon: LinkIcon,
  },
  {
    name: 'Configurações Asaas PIX',
    description: 'Gerencie sua chave PIX para recebimento de pagamentos via Asaas.',
    href: '/settings/asaas-pix',
    icon: CurrencyDollarIcon,
  },
];

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Configurações
        </h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
          Gerencie as configurações da sua conta, perfil e integrações de aplicativos.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {settingsOptions.map((option) => (
          <Link href={option.href} key={option.name} className="group block">
            <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02] border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500 dark:bg-indigo-600 text-white">
                    <option.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {option.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>
                <div className="flex-shrink-0 self-center">
                  <ArrowRightIcon className="h-6 w-6 text-gray-400 dark:text-gray-500 transition-colors duration-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 