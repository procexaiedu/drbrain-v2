import React, { useState, useEffect, useRef } from 'react';
import { 
  MagnifyingGlassIcon, 
  ChevronDownIcon,
  PlusIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabaseClient';

interface Patient {
  id: string;
  nome_completo: string;
  cpf: string;
  data_cadastro_paciente: string;
}

interface PatientSelectProps {
  selectedPatient: Patient | null;
  onPatientSelect: (patient: Patient) => void;
  onNewPatient: () => void;
  disabled?: boolean;
}

const PatientSelect: React.FC<PatientSelectProps> = ({
  selectedPatient,
  onPatientSelect,
  onNewPatient,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar pacientes
  const searchPatients = async (search: string = '') => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      const basePath = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || '/api/edge';
      const url = `${basePath}/v1/crm-pacientes?search=${encodeURIComponent(search)}&limit=50`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar pacientes');
      }

      const data = await response.json();
      console.log('PatientSelect - API Response Data:', data); // Log para depuração
      console.log('PatientSelect - Pacientes da API:', data?.pacientes); // Log para depuração
      setPatients(data?.pacientes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // Buscar automaticamente quando search term mudar (com debounce)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (isOpen) {
        searchPatients(searchTerm);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, isOpen]);

  // Buscar pacientes quando abrir dropdown
  useEffect(() => {
    if (isOpen && patients.length === 0) {
      searchPatients();
    }
  }, [isOpen]);

  const handlePatientSelect = (patient: Patient) => {
    onPatientSelect(patient);
    setIsOpen(false);
    setSearchTerm('');
  };

  const formatCPF = (cpf: string): string => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Campo de seleção */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500'
        }`}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <UserIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
          {selectedPatient ? (
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 truncate">
                {selectedPatient.nome_completo}
              </div>
              <div className="text-sm text-gray-500">
                CPF: {formatCPF(selectedPatient.cpf)}
              </div>
            </div>
          ) : (
            <span className="text-gray-500">Selecione um paciente...</span>
          )}
        </div>
        <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
          {/* Campo de busca */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
          </div>

          {/* Botão Novo Paciente */}
          <button
            type="button"
            onClick={() => {
              onNewPatient();
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 border-b border-gray-200"
          >
            <PlusIcon className="h-4 w-4 text-indigo-600" />
            <span className="text-indigo-600 font-medium">Cadastrar novo paciente</span>
          </button>

          {/* Lista de pacientes */}
          <div className="max-h-64 overflow-y-auto">
            {loading && (
              <div className="p-3 text-center text-gray-500">
                <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Buscando pacientes...
              </div>
            )}

            {error && (
              <div className="p-3 text-center text-red-600 text-sm">
                {error}
              </div>
            )}

            {!loading && !error && patients.length === 0 && (
              <div className="p-3 text-center text-gray-500 text-sm">
                {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
              </div>
            )}

            {!loading && !error && Array.isArray(patients) && patients.map((patient) => (
              <button
                key={patient.id}
                type="button"
                onClick={() => handlePatientSelect(patient)}
                className="w-full px-3 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900 truncate">
                  {patient.nome_completo}
                </div>
                <div className="text-sm text-gray-500">
                  CPF: {formatCPF(patient.cpf)} • Cadastrado em {formatDate(patient.data_cadastro_paciente)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientSelect; 