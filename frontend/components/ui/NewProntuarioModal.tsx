import React, { useState } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  DocumentPlusIcon, 
  XMarkIcon,
  CloudArrowUpIcon,
  MicrophoneIcon,
  ComputerDesktopIcon,
  UserPlusIcon,
  CalendarDaysIcon,
  SpeakerWaveIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
  DocumentPlusIcon as DocumentPlusIconSolid,
  SpeakerWaveIcon as SpeakerWaveIconSolid
} from '@heroicons/react/24/solid';
import { supabase } from '@/lib/supabaseClient';
import PatientSelect from './PatientSelect';
import NewPatientModal from './NewPatientModal';
import AudioRecorder from './AudioRecorder';

interface NewProntuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProntuarioCreated: (prontuarioId: string) => void;
}

interface Patient {
  id: string;
  nome_completo: string;
  cpf: string;
  data_cadastro_paciente: string;
}

const NewProntuarioModal: React.FC<NewProntuarioModalProps> = ({
  isOpen,
  onClose,
  onProntuarioCreated
}) => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [dataConsulta, setDataConsulta] = useState(new Date().toISOString().split('T')[0]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFilename, setAudioFilename] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  const tabs = [
    { 
      name: 'Carregar Arquivo', 
      icon: CloudArrowUpIcon,
      description: 'Envie um arquivo de áudio já gravado',
      emoji: '📁',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    { 
      name: 'Gravação Presencial', 
      icon: MicrophoneIcon,
      description: 'Grave diretamente do microfone',
      emoji: '🎤',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    { 
      name: 'Gravação Telemedicina', 
      icon: ComputerDesktopIcon,
      description: 'Grave áudio da tela + microfone',
      emoji: '💻',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verificar se é um arquivo de áudio
      if (!file.type.startsWith('audio/')) {
        setError('Por favor, selecione um arquivo de áudio válido');
        return;
      }

      // Verificar tamanho (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        setError('Arquivo muito grande. Máximo permitido: 100MB');
        return;
      }

      setAudioFile(file);
      setAudioFilename(file.name);
      setError(null);
    }
  };

  const handleAudioRecorded = (audioBlob: Blob, filename: string) => {
    const file = new File([audioBlob], filename, { type: audioBlob.type });
    setAudioFile(file);
    setAudioFilename(filename);
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!selectedPatient) {
      setError('Selecione um paciente');
      return false;
    }

    if (!dataConsulta) {
      setError('Data da consulta é obrigatória');
      return false;
    }

    if (!audioFile) {
      setError('Áudio é obrigatório');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão inválida');
      }

      // Preparar FormData
      const formData = new FormData();
      formData.append('audioFile', audioFile!);
      formData.append('paciente_id', selectedPatient!.id);
      formData.append('data_consulta', dataConsulta);
      formData.append('audio_original_filename', audioFilename);

      const basePath = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || '/api/edge';
      const response = await fetch(`${basePath}/v1/iniciar-processamento-prontuario`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Erro ao criar prontuário');
      }

      const result = await response.json();
      onProntuarioCreated(result.prontuario_id);
      
      // Reset form
      setSelectedPatient(null);
      setDataConsulta(new Date().toISOString().split('T')[0]);
      setAudioFile(null);
      setAudioFilename('');
      setSelectedTabIndex(0);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedPatient(null);
      setDataConsulta(new Date().toISOString().split('T')[0]);
      setAudioFile(null);
      setAudioFilename('');
      setError(null);
      setSelectedTabIndex(0);
      onClose();
    }
  };

  const handlePatientCreated = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowNewPatientModal(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40" onClose={handleClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-4xl border border-gray-100">
                  {/* Header Moderno com Gradiente */}
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                          <DocumentPlusIconSolid className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <Dialog.Title as="h3" className="text-xl font-bold text-white">
                            🏥 Novo Prontuário
                          </Dialog.Title>
                          <p className="text-indigo-100 text-sm">
                            Crie um prontuário inteligente com nossa IA médica
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={isLoading}
                        className="rounded-xl p-2 text-white/80 hover:text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white transition-all disabled:opacity-50"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white px-6 pb-6 pt-6">
                    {/* Error Message Moderno */}
                    {error && (
                      <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
                        <div className="flex items-center">
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
                          <div className="text-sm text-red-800 font-medium">{error}</div>
                        </div>
                      </div>
                    )}

                    {/* Form */}
                    <div className="space-y-8">
                      {/* Metadados com Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Card Paciente */}
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                          <div className="flex items-center mb-3">
                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                              <UserPlusIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <label className="text-sm font-semibold text-gray-900">
                              👤 Paciente *
                            </label>
                          </div>
                          <PatientSelect
                            selectedPatient={selectedPatient}
                            onPatientSelect={setSelectedPatient}
                            onNewPatient={() => setShowNewPatientModal(true)}
                            disabled={isLoading}
                          />
                          {selectedPatient && (
                            <div className="mt-3 flex items-center text-xs text-green-700 bg-green-50 rounded-lg p-2">
                              <CheckCircleIcon className="h-4 w-4 mr-2" />
                              <span>Paciente selecionado: {selectedPatient.nome_completo}</span>
                            </div>
                          )}
                        </div>

                        {/* Card Data */}
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                          <div className="flex items-center mb-3">
                            <div className="p-2 bg-green-100 rounded-lg mr-3">
                              <CalendarDaysIcon className="h-5 w-5 text-green-600" />
                            </div>
                            <label htmlFor="data_consulta" className="text-sm font-semibold text-gray-900">
                              📅 Data da Consulta *
                            </label>
                          </div>
                          <input
                            type="date"
                            id="data_consulta"
                            value={dataConsulta}
                            onChange={(e) => setDataConsulta(e.target.value)}
                            disabled={isLoading}
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 bg-white"
                          />
                        </div>
                      </div>

                      {/* Captura de Áudio com Design Premium */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center mb-6">
                          <div className="p-2 bg-purple-100 rounded-lg mr-3">
                            <SpeakerWaveIconSolid className="h-5 w-5 text-purple-600" />
                          </div>
                          <label className="text-lg font-semibold text-gray-900">
                            🎵 Captura de Áudio *
                          </label>
                        </div>
                        
                        <Tab.Group selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
                          <Tab.List className="flex space-x-2 rounded-xl bg-white p-2 shadow-sm border border-gray-200">
                            {tabs.map((tab, index) => (
                              <Tab
                                key={tab.name}
                                className={({ selected }) =>
                                  `w-full rounded-xl py-3 px-4 text-sm font-medium leading-5 transition-all ${
                                    selected
                                      ? `bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105`
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                  }`
                                }
                                disabled={isLoading}
                              >
                                <div className="flex items-center justify-center space-x-2">
                                  <span className="text-lg">{tab.emoji}</span>
                                  <span className="hidden sm:inline">{tab.name}</span>
                                </div>
                              </Tab>
                            ))}
                          </Tab.List>
                          
                          <Tab.Panels className="mt-6">
                            {/* Upload de arquivo */}
                            <Tab.Panel className="space-y-4">
                              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                <div className="flex items-center mb-2">
                                  <CloudArrowUpIcon className="h-5 w-5 text-blue-600 mr-2" />
                                  <h4 className="font-medium text-blue-900">Envio de Arquivo</h4>
                                </div>
                                <p className="text-sm text-blue-700">{tabs[0].description}</p>
                              </div>
                              
                              <div className="relative">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <CloudArrowUpIcon className="w-8 h-8 mb-3 text-gray-400" />
                                    <p className="mb-2 text-sm text-gray-500">
                                      <span className="font-semibold">Clique para enviar</span> ou arraste o arquivo
                                    </p>
                                    <p className="text-xs text-gray-500">Formatos: MP3, WAV, M4A (Max. 100MB)</p>
                                  </div>
                                  <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={handleFileUpload}
                                    disabled={isLoading}
                                    className="hidden"
                                  />
                                </label>
                                
                                {audioFile && selectedTabIndex === 0 && (
                                  <div className="mt-4 bg-green-50 rounded-xl p-4 border border-green-200">
                                    <div className="flex items-center">
                                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
                                      <div>
                                        <p className="text-sm font-medium text-green-900">
                                          Arquivo carregado com sucesso!
                                        </p>
                                        <p className="text-xs text-green-700">
                                          {audioFilename} ({formatFileSize(audioFile.size)})
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </Tab.Panel>

                            {/* Gravação presencial */}
                            <Tab.Panel className="space-y-4">
                              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                <div className="flex items-center mb-2">
                                  <MicrophoneIcon className="h-5 w-5 text-green-600 mr-2" />
                                  <h4 className="font-medium text-green-900">Gravação Presencial</h4>
                                </div>
                                <p className="text-sm text-green-700">{tabs[1].description}</p>
                              </div>
                              
                              <div className="bg-white rounded-xl p-4 border border-gray-200">
                                <AudioRecorder
                                  mode="microphone"
                                  onAudioReady={handleAudioRecorded}
                                  disabled={isLoading}
                                />
                                {audioFile && selectedTabIndex === 1 && (
                                  <div className="mt-4 bg-green-50 rounded-xl p-4 border border-green-200">
                                    <div className="flex items-center">
                                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
                                      <div>
                                        <p className="text-sm font-medium text-green-900">
                                          Áudio gravado com sucesso!
                                        </p>
                                        <p className="text-xs text-green-700">{audioFilename}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </Tab.Panel>

                            {/* Gravação telemedicina */}
                            <Tab.Panel className="space-y-4">
                              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                                <div className="flex items-center mb-2">
                                  <ComputerDesktopIcon className="h-5 w-5 text-purple-600 mr-2" />
                                  <h4 className="font-medium text-purple-900">Gravação Telemedicina</h4>
                                </div>
                                <p className="text-sm text-purple-700">{tabs[2].description}</p>
                              </div>
                              
                              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <div className="flex items-start">
                                  <div className="flex-shrink-0">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div className="ml-3">
                                    <h4 className="text-sm font-semibold text-blue-900">Instruções importantes:</h4>
                                    <div className="text-sm text-blue-800 mt-1">
                                      <ol className="list-decimal list-inside space-y-1">
                                        <li>Selecione esta aba da telemedicina</li>
                                        <li>Permita acesso ao microfone quando solicitado</li>
                                        <li>Compartilhe a tela da videoconferência</li>
                                      </ol>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-white rounded-xl p-4 border border-gray-200">
                                <AudioRecorder
                                  mode="screen_and_mic"
                                  onAudioReady={handleAudioRecorded}
                                  disabled={isLoading}
                                />
                                {audioFile && selectedTabIndex === 2 && (
                                  <div className="mt-4 bg-green-50 rounded-xl p-4 border border-green-200">
                                    <div className="flex items-center">
                                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
                                      <div>
                                        <p className="text-sm font-medium text-green-900">
                                          Gravação de telemedicina concluída!
                                        </p>
                                        <p className="text-xs text-green-700">{audioFilename}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </Tab.Panel>
                          </Tab.Panels>
                        </Tab.Group>
                      </div>
                    </div>
                  </div>

                  {/* Footer Moderno */}
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row-reverse gap-3">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isLoading || !selectedPatient || !audioFile}
                      className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processando...
                        </>
                      ) : (
                        <>
                          <DocumentPlusIconSolid className="h-5 w-5 mr-2" />
                          🚀 Enviar para IA
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isLoading}
                      className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 text-sm font-semibold rounded-xl shadow-sm border border-gray-300 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Modal de novo paciente */}
      <NewPatientModal
        isOpen={showNewPatientModal}
        onClose={() => setShowNewPatientModal(false)}
        onPatientCreated={handlePatientCreated}
      />
    </>
  );
};

export default NewProntuarioModal; 