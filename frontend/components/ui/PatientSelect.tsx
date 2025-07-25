'use client';

import React, { Fragment, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { usePacientes } from '@/app/(app)/crm/hooks/usePacientes';
import { Paciente } from '@/app/(app)/crm/types';

interface PatientSelectProps {
  selectedPatientId: string | null;
  onSelectPatient: (patientId: string | null) => void;
  label?: string;
  disabled?: boolean;
}

export default function PatientSelect({
  selectedPatientId,
  onSelectPatient,
  label = 'Selecionar Paciente',
  disabled = false,
}: PatientSelectProps) {
  const { data, isLoading, isError } = usePacientes('', undefined, 1, 1000); // Buscar todos os pacientes
  const patients = data?.data || [];

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <Listbox value={selectedPatientId} onChange={onSelectPatient} disabled={disabled}>
      {({ open }) => (
        <div className="relative mt-1">
          <Listbox.Label className="block text-sm font-medium text-gray-700">{label}</Listbox.Label>
          <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
            <span className="block truncate">{selectedPatient ? selectedPatient.nome_completo : 'Nenhum paciente selecionado'}</span>
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
                  Carregando pacientes...
                </div>
              )}
              {isError && (
                <div className="relative cursor-default select-none py-2 pl-3 pr-9 text-red-700">
                  Erro ao carregar pacientes.
                </div>
              )}
              {!isLoading && !isError && patients.length === 0 && (
                <div className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-500">
                  Nenhum paciente encontrado.
                </div>
              )}
              {!isLoading && !isError && patients.length > 0 && (
                patients.map((patient) => (
                  <Listbox.Option
                    key={patient.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-600 text-white' : 'text-gray-900'}`
                    }
                    value={patient.id}
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {patient.nome_completo}
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