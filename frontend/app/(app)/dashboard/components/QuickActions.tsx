'use client';

import Link from 'next/link';
import { 
  PlusIcon, 
  UserPlusIcon, 
  DocumentPlusIcon, 
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    title: 'Novo Lead',
    description: 'Adicionar novo lead ao CRM',
    href: '/crm?tab=leads&action=new',
    icon: <UserPlusIcon className="h-6 w-6" />,
    color: 'from-blue-500 to-blue-600',
  },
  {
    title: 'Novo Paciente',
    description: 'Cadastrar novo paciente',
    href: '/crm?tab=pacientes&action=new',
    icon: <PlusIcon className="h-6 w-6" />,
    color: 'from-green-500 to-green-600',
  },
  {
    title: 'Novo Prontuário',
    description: 'Criar prontuário inteligente',
    href: '/prontuarios?action=new',
    icon: <DocumentPlusIcon className="h-6 w-6" />,
    color: 'from-purple-500 to-purple-600',
  },
  {
    title: 'Secretária IA',
    description: 'Conversar com a IA',
    href: '/playground',
    icon: <ChatBubbleLeftRightIcon className="h-6 w-6" />,
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    title: 'Configurações',
    description: 'Ajustar perfil e preferências',
    href: '/settings/profile',
    icon: <Cog6ToothIcon className="h-6 w-6" />,
    color: 'from-gray-500 to-gray-600',
  },
  {
    title: 'Relatórios',
    description: 'Ver métricas detalhadas',
    href: '/crm?tab=relatorios',
    icon: <ChartBarIcon className="h-6 w-6" />,
    color: 'from-orange-500 to-orange-600',
  },
];

export function QuickActions() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className="group relative overflow-hidden rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className={`h-12 w-12 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200`}>
                {action.icon}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">{action.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{action.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 