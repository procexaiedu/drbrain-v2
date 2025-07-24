'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  CogIcon, 
  ArrowLeftOnRectangleIcon, 
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  BeakerIcon,
  HeartIcon,
  UsersIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid, 
  DocumentTextIcon as DocumentTextIconSolid, 
  CogIcon as CogIconSolid, 
  BeakerIcon as BeakerIconSolid,
  UsersIcon as UsersIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid
} from '@heroicons/react/24/solid';

// Logo moderno e elegante
const LogoComponent = ({ collapsed }: { collapsed: boolean }) => (
  <div className={`transition-all duration-300 ease-in-out ${collapsed ? 'w-12' : 'w-full'}`}>
    {collapsed ? (
      <div className="flex items-center justify-center h-12 w-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
        <span className="text-white font-bold text-lg">🧠</span>
      </div>
    ) : (
      <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg">
        <div className="flex-shrink-0">
          <span className="text-2xl">🧠</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-white font-bold text-lg leading-none">Dr.Brain</h1>
          <p className="text-indigo-200 text-xs leading-none">IA Médica</p>
        </div>
      </div>
    )}
  </div>
);

const navItems = [
  { 
    href: '/dashboard', 
    label: 'Dashboard', 
    icon: HomeIcon, 
    iconSolid: HomeIconSolid,
    description: 'Visão geral do sistema'
  },
  {
    href: '/agenda',
    label: 'Agenda',
    icon: CalendarDaysIcon,
    iconSolid: CalendarDaysIconSolid,
    description: 'Sua agenda de compromissos'
  },
  {
    href: '/whatsapp',
    label: 'WhatsApp Business',
    icon: ChatBubbleLeftRightIcon,
    iconSolid: ChatBubbleLeftRightIconSolid,
    description: 'Secretaria IA no WhatsApp'
  },
  { 
    href: '/playground', 
    label: 'Playground IA', 
    icon: BeakerIcon, 
    iconSolid: BeakerIconSolid,
    description: 'Configure sua Secretária IA'
  },
  { 
    href: '/prontuarios', 
    label: 'Prontuários', 
    icon: DocumentTextIcon, 
    iconSolid: DocumentTextIconSolid,
    description: 'Prontuários Inteligentes'
  },
  { 
    href: '/crm', 
    label: 'Pacientes (CRM)', 
    icon: UsersIcon, 
    iconSolid: UsersIconSolid,
    description: 'Gestão de Leads e Pacientes'
  },
  { 
    href: '/settings',
    label: 'Configurações', 
    icon: CogIcon, 
    iconSolid: CogIconSolid,
    description: 'Ajustes e conexões da conta'
  },
];

// Componente Tooltip
const Tooltip = ({ children, content, show }: { children: React.ReactNode; content: string; show: boolean }) => {
  if (!show) return <>{children}</>;
  
  return (
    <div className="relative group">
      {children}
      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
        {content}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
      </div>
    </div>
  );
};

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { signOut, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  if (!user) return null;

  return (
    <aside className={`bg-gradient-to-b from-gray-800 to-gray-900 text-gray-100 flex flex-col transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-20' : 'w-72'} shadow-2xl border-r border-gray-700`}>
      {/* Header com Logo e Toggle */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <LogoComponent collapsed={isCollapsed} />
          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="p-2 rounded-xl hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 group"
              title="Recolher sidebar"
            >
              <ChevronDoubleLeftIcon className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
            </button>
          )}
        </div>
        
        {/* Botão de expansão quando colapsada */}
        {isCollapsed && (
          <div className="flex justify-center">
            <button
              onClick={toggleCollapse}
              className="p-2 rounded-xl hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 group"
              title="Expandir sidebar"
            >
              <ChevronDoubleRightIcon className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        )}
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 space-y-2">
        {navItems.map((item) => {
          const isActive = isActiveRoute(item.href);
          const IconComponent = isActive ? item.iconSolid : item.icon;
          
          const linkContent = (
            <Link 
              href={item.href} 
              className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden ${
                isActive 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105' 
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:scale-105'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              {/* Indicador visual ativo */}
              {isActive && !isCollapsed && (
                <div className="absolute left-0 top-0 h-full w-1 bg-white rounded-r-full"></div>
              )}
              
              <IconComponent className={`flex-shrink-0 h-6 w-6 transition-all duration-200 ${isCollapsed ? 'mr-0' : 'mr-3'} ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
              
              {!isCollapsed && (
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="truncate">{item.label}</span>
                  <span className={`text-xs truncate transition-colors duration-200 ${isActive ? 'text-indigo-200' : 'text-gray-500 group-hover:text-gray-400'}`}>
                    {item.description}
                  </span>
                </div>
              )}
              
              {/* Efeito de brilho no hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </Link>
          );

          return (
            <Tooltip key={item.label} content={item.label} show={isCollapsed}>
              {linkContent}
            </Tooltip>
          );
        })}
      </nav>

      {/* Seção do usuário */}
      <div className="p-3 mt-auto border-t border-gray-700">
        {/* Info do usuário */}
        {!isCollapsed && user && (
          <div className="mb-3 p-3 bg-gray-700/30 rounded-xl border border-gray-600/50">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.email?.charAt(0).toUpperCase() || 'Dr'}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  Dr. {user.user_metadata?.nome_completo?.split(' ')[0] || 'Médico'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botão de logout */}
        <Tooltip content="Sair do sistema" show={isCollapsed}>
          <button
            onClick={handleSignOut}
            className={`group flex items-center w-full px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 text-red-300 hover:bg-red-600/20 hover:text-red-200 border border-transparent hover:border-red-500/30 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <ArrowLeftOnRectangleIcon className={`flex-shrink-0 h-6 w-6 transition-all duration-200 ${isCollapsed ? 'mr-0' : 'mr-3'}`} />
            {!isCollapsed && <span>Sair do Sistema</span>}
          </button>
        </Tooltip>
      </div>

      {/* Versão info (apenas quando expandida) */}
      {!isCollapsed && (
        <div className="px-3 pb-3">
          <div className="text-center text-xs text-gray-500 flex items-center justify-center space-x-1">
            <HeartIcon className="h-3 w-3 text-red-400" />
            <span>Dr.Brain v1.0</span>
          </div>
        </div>
      )}
    </aside>
  );
} 