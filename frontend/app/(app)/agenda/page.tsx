'use client';

import React, { useEffect, useState, useCallback, Fragment, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { EventInput, EventSourceInput, EventSourceFuncArg, EventApi, EventClickArg } from '@fullcalendar/core';
import { useApp } from '@/context/AppContext';
import { useQuery, QueryClient, QueryClientProvider, useMutation, useQueryClient as useTanstackQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Dialog, Transition } from '@headlessui/react';
import { format, parseISO } from 'date-fns';
import { Toaster, toast } from 'sonner';
import { PlusIcon, UserPlusIcon, PencilIcon, TrashIcon, XMarkIcon, CalendarDaysIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import PatientSelect from '@/components/ui/PatientSelect';

// --- Interfaces --- 
interface CalendarEvent extends EventInput {
  id?: string;
  description?: string;
  location?: string; // Adicionado para videoconferência
  gmeetLink?: string; // Adicionado para link do Google Meet
  extendedProps?: {
    description?: string;
    location?: string;
    gmeetLink?: string;
  };
}

interface EventFormData {
  summary: string;
  start: string;
  end: string;
  description?: string;
  addGoogleMeet?: boolean;
  location?: string; // Para o link da videoconferência
}

interface ContactFormData {
  patientId: string;
  reason: string;
}

interface PatientForSelect {
  id: string;
  nome_completo: string;
  cpf: string;
  data_cadastro_paciente: string;
}

// --- Configurações Globais --- 
const queryClientInstance = new QueryClient();

// --- Funções de API (sem alterações de lógica, apenas ajustes menores se necessário) --- 
const fetchAgendaEvents = async (fetchInfoInput?: { startStr: string, endStr: string }): Promise<CalendarEvent[]> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    toast.error('Sessão inválida. Por favor, faça login novamente.');
    throw new Error('Usuário não autenticado.');
  }

  let effectiveFetchInfo: { startStr: string, endStr: string };

  if (fetchInfoInput) {
    effectiveFetchInfo = fetchInfoInput;
  } else {
    // Se fetchInfoInput não for fornecido, define um intervalo padrão (mês atual)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // Último dia do mês às 23:59:59
    effectiveFetchInfo = {
      startStr: startOfMonth.toISOString(),
      endStr: endOfMonth.toISOString()
    };
    console.log('fetchAgendaEvents: Usando intervalo padrão (mês atual):', effectiveFetchInfo);
  }

  let url = '/edge/v1/agenda-crud-events';
  url += `?start_date=${encodeURIComponent(effectiveFetchInfo.startStr)}&end_date=${encodeURIComponent(effectiveFetchInfo.endStr)}`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${session.access_token}` }
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({ message: 'Falha ao buscar eventos' }));
    throw new Error(errData.message || 'Falha ao buscar eventos');
  }
  const data = await response.json();
  return (data || []).map((event: any) => ({
    id: event.id,
    title: event.summary || event.title || 'Evento sem título',
    start: event.start?.dateTime || event.start?.date || event.start,
    end: event.end?.dateTime || event.end?.date || event.end,
    allDay: !!event.start?.date && !event.start?.dateTime,
    description: event.description,
    location: event.location, // Mapeando location para a videoconferência
    gmeetLink: event.hangoutLink, // Assumindo que o link do Meet venha como hangoutLink
    extendedProps: {
      description: event.description,
      location: event.location,
      gmeetLink: event.hangoutLink
    }
  }));
};

const createAgendaEventAPI = async (newEventData: EventFormData): Promise<any> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) throw new Error('Usuário não autenticado.');
  const payload: any = {
    summary: newEventData.summary,
    description: newEventData.description,
    start: { dateTime: new Date(newEventData.start).toISOString() },
    end: { dateTime: new Date(newEventData.end).toISOString() },
  };
  if (newEventData.addGoogleMeet) {
    // A lógica de adicionar conferência será tratada pela Edge Function
    payload.conferenceData = { createRequest: { requestId: `drbrain-meet-${Date.now()}` } };
  }
  const response = await fetch('/edge/v1/agenda-crud-events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({ message: 'Falha ao criar evento' }));
    throw new Error(errData.message || 'Falha ao criar evento');
  }
  return response.json();
};

const updateAgendaEventAPI = async ({ eventId, eventData }: { eventId: string, eventData: Partial<EventFormData> }): Promise<any> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) throw new Error('Usuário não autenticado.');
  
  const payload: any = { ...eventData };
  if (eventData.start) payload.start = { dateTime: new Date(eventData.start).toISOString() };
  if (eventData.end) payload.end = { dateTime: new Date(eventData.end).toISOString() };

  const response = await fetch(`/edge/v1/agenda-crud-events/${eventId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({ message: 'Falha ao atualizar evento'}));
    throw new Error(errData.message || 'Falha ao atualizar evento');
  }
  return response.json();
};

const deleteAgendaEventAPI = async (eventId: string): Promise<void> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) throw new Error('Usuário não autenticado.');
  
  const response = await fetch(`/edge/v1/agenda-crud-events/${eventId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${session.access_token}` }
  });
  if (!response.ok) {
    if (response.status === 204) return; 
    const errData = await response.json().catch(() => ({ message: 'Falha ao excluir evento'}));
    throw new Error(errData.message || 'Falha ao excluir evento');
  }
  if(response.status === 204) return;
};

// API para solicitar contato com paciente
const requestPatientContactAPI = async (contactData: ContactFormData): Promise<any> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) throw new Error('Usuário não autenticado.');
  const response = await fetch('/edge/v1/secretaria-ia-agendamento/contact-patient', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(contactData) // Incluindo patientId
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({ message: 'Falha ao solicitar contato' }));
    throw new Error(errData.message || 'Falha ao solicitar contato');
  }
  return response.json();
};

// --- Componente Principal da Agenda --- 
const AgendaPageContent = () => {
  const { setPageTitle } = useApp();
  const tanstackQueryClient = useTanstackQueryClient();
  const calendarRef = useRef<FullCalendar>(null);

  // Estados dos Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewEditModalOpen, setIsViewEditModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  
  // Estado para Formulários e Evento Selecionado
  const [newEventForm, setNewEventForm] = useState<EventFormData>({ summary: '', start: '', end: '', description: '', addGoogleMeet: false });
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editEventForm, setEditEventForm] = useState<EventFormData | null>(null);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [contactFormData, setContactFormData] = useState<ContactFormData>({ patientId: '', reason: '' });
  const [selectedPatientForContact, setSelectedPatientForContact] = useState<PatientForSelect | null>(null);

  const [isSubmittingModal, setIsSubmittingModal] = useState(false);

  useEffect(() => { setPageTitle('Minha Agenda'); }, [setPageTitle]);

  // --- TanStack Queries e Mutations --- 
  const { data: initialEvents, isLoading: isLoadingEvents, error: eventsError, refetch: refetchCalendarEvents } = useQuery<CalendarEvent[], Error>({
    queryKey: ['initialAgendaEvents'],
    queryFn: () => fetchAgendaEvents(),
  });

  const eventSourceFunc: EventSourceInput = useCallback(async (
    fetchInfo: EventSourceFuncArg, 
    successCallback: (events: EventInput[]) => void, 
    failureCallback: (error: Error) => void
  ) => {
    try {
      const fetchedEvents = await fetchAgendaEvents({ startStr: fetchInfo.startStr, endStr: fetchInfo.endStr });
      successCallback(fetchedEvents);
    } catch (error: any) {
      toast.error(`Erro ao carregar eventos: ${error.message}`);
      failureCallback(error as Error);
    }
  }, []);

  const createEventMutation = useMutation<any, Error, EventFormData>({
    mutationFn: createAgendaEventAPI,
    onSuccess: (data) => {
      toast.success('Evento criado com sucesso!');
      tanstackQueryClient.invalidateQueries({ queryKey: ['initialAgendaEvents'] });
      calendarRef.current?.getApi().refetchEvents();
      setIsCreateModalOpen(false);
      setNewEventForm({ summary: '', start: '', end: '', description: '', addGoogleMeet: false });
    },
    onError: (error) => {
      toast.error(`Falha ao criar evento: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmittingModal(false);
    }
  });
  
  const updateEventMutation = useMutation<any, Error, { eventId: string, eventData: Partial<EventFormData> }>({
    mutationFn: updateAgendaEventAPI,
    onSuccess: (data, variables) => {
      toast.success('Evento atualizado com sucesso!');
      tanstackQueryClient.invalidateQueries({ queryKey: ['initialAgendaEvents'] });
      calendarRef.current?.getApi().refetchEvents();
      setIsViewEditModalOpen(false);
      setIsEditingEvent(false);
    },
    onError: (error) => {
      toast.error(`Falha ao atualizar evento: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmittingModal(false);
    }
  });

  const deleteEventMutation = useMutation<void, Error, string>({
    mutationFn: deleteAgendaEventAPI,
    onSuccess: () => {
      toast.success('Evento excluído com sucesso!');
      tanstackQueryClient.invalidateQueries({ queryKey: ['initialAgendaEvents'] });
      calendarRef.current?.getApi().refetchEvents();
      setIsViewEditModalOpen(false);
      setSelectedEvent(null);
    },
    onError: (error) => {
      toast.error(`Falha ao excluir evento: ${error.message}`);
    }
  });

  const requestContactMutation = useMutation<any, Error, ContactFormData>({
    mutationFn: requestPatientContactAPI,
    onSuccess: (data) => {
      toast.success(data?.message || 'Solicitação de contato enviada com sucesso!');
      setIsContactModalOpen(false);
      setContactFormData({ patientId: '', reason: '' });
    },
    onError: (error) => {
      toast.error(`Falha ao solicitar contato: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmittingModal(false);
    }
  });

  // --- Handlers de Interação do Calendário e Modais --- 
  const handleDateClick = (arg: DateClickArg) => {
    const defaultStartTime = format(arg.date, 'yyyy-MM-dd\'T\'HH:mm');
    const defaultEndTime = format(new Date(arg.date.getTime() + 60 * 60 * 1000), 'yyyy-MM-dd\'T\'HH:mm');
    setNewEventForm({ 
        summary: '', 
        start: defaultStartTime, 
        end: defaultEndTime, 
        description: '', 
        addGoogleMeet: false 
    });
    setIsCreateModalOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      allDay: event.allDay,
      description: event.extendedProps.description,
      location: event.extendedProps.location, 
      gmeetLink: event.extendedProps.gmeetLink,
      extendedProps: event.extendedProps
    });
    setEditEventForm({
      summary: event.title,
      start: format(parseISO(event.startStr), "yyyy-MM-dd'T'HH:mm"),
      end: event.endStr ? format(parseISO(event.endStr), "yyyy-MM-dd'T'HH:mm") : '',
      description: event.extendedProps.description || '',
      addGoogleMeet: !!event.extendedProps.gmeetLink,
      location: event.extendedProps.location
    });
    setIsEditingEvent(false);
    setIsViewEditModalOpen(true);
  };
  
  // Handlers para eventDrop e eventResize (arrastar e redimensionar)
  const handleEventDropOrResize = async (changeInfo: { event: EventApi, oldEvent: EventApi, revert: () => void }) => {
    const { event } = changeInfo;
    if (!event.id) {
        toast.error("ID do evento não encontrado para atualização.");
        changeInfo.revert();
        return;
    }
    const updatedEventData: Partial<EventFormData> = {
        summary: event.title,
        start: event.startStr,
        end: event.endStr,
    };
    try {
        setIsSubmittingModal(true);
        await updateEventMutation.mutateAsync({ eventId: event.id, eventData: updatedEventData });
    } catch (error: any) {
        toast.error(`Falha ao mover/redimensionar evento: ${error.message}`);
        changeInfo.revert();
    } finally {
        setIsSubmittingModal(false);
    }
  };

  // --- Handlers de Formulário --- 
  const handleNewEventFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setNewEventForm(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };
  const handleEditEventFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setEditEventForm(prev => prev ? ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }) : null);
  };
  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setContactFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePatientSelectedForContact = (patient: PatientForSelect) => {
    setSelectedPatientForContact(patient);
    setContactFormData(prev => ({ ...prev, patientId: patient.id }));
  };

  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventForm.summary || !newEventForm.start || !newEventForm.end) {
      toast('Título, Início e Fim são obrigatórios.', {
        action: { label: 'Ok', onClick: () => {} },
      });
      return;
    }
    if (new Date(newEventForm.start) >= new Date(newEventForm.end)) {
      toast('A data de término deve ser posterior à data de início.', {
        action: { label: 'Ok', onClick: () => {} },
      });
      return;
    }
    setIsSubmittingModal(true);
    createEventMutation.mutate(newEventForm);
  };

  const handleUpdateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent?.id || !editEventForm) {
      toast.error('Erro interno: Evento não selecionado ou formulário inválido.');
      return;
    }
    if (!editEventForm.summary || !editEventForm.start || !editEventForm.end) {
      toast('Título, Início e Fim são obrigatórios.', {
        action: { label: 'Ok', onClick: () => {} },
      });
      return;
    }
    if (new Date(editEventForm.start) >= new Date(editEventForm.end)) {
      toast('A data de término deve ser posterior à data de início.', {
        action: { label: 'Ok', onClick: () => {} },
      });
      return;
    }
    setIsSubmittingModal(true);
    updateEventMutation.mutate({ eventId: selectedEvent.id, eventData: editEventForm });
  };

  const handleDeleteCurrentEvent = () => {
    if (!selectedEvent || typeof selectedEvent.id !== 'string') {
      toast.error('Nenhum evento selecionado ou ID do evento inválido para excluir.');
      return;
    }

    const eventId = selectedEvent.id;
    const eventTitle = selectedEvent.title || "Evento sem título";

    toast(`Tem certeza que deseja excluir o evento "${eventTitle}"?`, {
      action: {
        label: 'Excluir',
        onClick: () => deleteEventMutation.mutate(eventId),
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {},
      },
      duration: Infinity,
    });
  };

  const handleRequestContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactFormData.patientId || !contactFormData.reason) {
      toast.error('Paciente e Motivo do contato são obrigatórios.');
      return;
    }
    setIsSubmittingModal(true);
    requestContactMutation.mutate(contactFormData);
  };
  
  const closeViewEditModal = () => {
    setIsViewEditModalOpen(false);
    setSelectedEvent(null);
    setEditEventForm(null);
    setIsEditingEvent(false);
  };

  // --- Renderização do Conteúdo do Evento no Calendário (Exemplo) --- 
  const renderEventContent = (eventInfo: any) => {
    const isPastEvent = eventInfo.event.end && new Date(eventInfo.event.end) < new Date();
    const opacityClass = isPastEvent ? 'opacity-60' : '';

    return (
      <div className={`p-1.5 rounded-md h-full flex flex-col justify-center ${opacityClass} transition-colors duration-150 ease-in-out group hover:bg-indigo-50 dark:hover:bg-gray-700`}>
        <div className="flex items-center justify-between">
          <b className={`text-xs font-semibold truncate ${isPastEvent ? 'text-gray-500 dark:text-gray-400' : 'text-indigo-700 dark:text-indigo-300'} group-hover:text-indigo-800 dark:group-hover:text-indigo-200`}>
            {eventInfo.timeText}
          </b>
          {eventInfo.event.extendedProps.gmeetLink && (
            <VideoCameraIcon className={`w-3.5 h-3.5 ${isPastEvent ? 'text-gray-400 dark:text-gray-500' : 'text-blue-500 dark:text-blue-400'} group-hover:text-blue-600 dark:group-hover:text-blue-300`} />
          )}
        </div>
        <p className={`mt-0.5 text-xs leading-tight truncate ${isPastEvent ? 'text-gray-600 dark:text-gray-300' : 'text-gray-700 dark:text-gray-200'} group-hover:text-gray-800 dark:group-hover:text-gray-100`}>
          {eventInfo.event.title}
        </p>
        {eventInfo.event.extendedProps.description && (
          <p className={`mt-0.5 text-[11px] leading-tight text-gray-500 dark:text-gray-400 truncate group-hover:text-gray-600 dark:group-hover:text-gray-300`}>
            {eventInfo.event.extendedProps.description}
          </p>
        )}
      </div>
    );
  };

  // --- JSX Principal --- 
  return (
    <>
      <Toaster richColors position="top-right" />
      <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col bg-gray-50 dark:bg-gray-900">
        <header className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mt-4 sm:mt-0 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setIsContactModalOpen(true)}
                disabled={isSubmittingModal} 
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition ease-in-out duration-150"
              >
                <UserPlusIcon className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
                Contatar Paciente
              </button>
              <button
                type="button"
                onClick={() => {
                  const todayStr = format(new Date(), 'yyyy-MM-dd');
                  setNewEventForm({ 
                    summary: '', 
                    start: `${todayStr}T09:00`, 
                    end: `${todayStr}T10:00`, 
                    description: '', 
                    addGoogleMeet: false 
                  });
                  setIsCreateModalOpen(true);
                }}
                disabled={isSubmittingModal}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition ease-in-out duration-150"
              >
                <PlusIcon className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
                Novo Evento
              </button>
            </div>
          </div>
        </header>

        <main className="flex-grow min-h-0 bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden p-1 sm:p-2 md:p-4">
          {isLoadingEvents && !initialEvents && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500"></div>
              <p className="ml-4 text-gray-500 dark:text-gray-400 text-lg">Carregando agenda...</p>
            </div>
          )}
          {eventsError && (
            <div className="flex flex-col items-center justify-center h-full p-4 bg-red-50 dark:bg-red-900/20 rounded-md text-center">
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Ops! Algo deu errado.</h3>
              <p className="text-red-600 dark:text-red-400 mt-1">Não foi possível carregar os eventos da agenda: {eventsError.message}</p>
              <button 
                onClick={() => refetchCalendarEvents()} 
                className="mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Tentar Novamente
              </button>
            </div>
          )}
          {(!isLoadingEvents || initialEvents) && !eventsError && (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              buttonText={{ today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia' }}
              locale='pt-br'
              initialView="timeGridWeek"
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              events={eventSourceFunc}
              height="100%"
              contentHeight="auto"
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              eventDrop={handleEventDropOrResize}
              eventResize={handleEventDropOrResize}
              eventContent={renderEventContent}
              viewClassNames="bg-white dark:bg-gray-800 rounded-lg shadow-md"
              eventClassNames="border-none rounded-lg shadow-sm cursor-pointer hover:bg-indigo-50 dark:hover:bg-gray-700"
              buttonHints={{
                prev: 'Mês anterior',
                next: 'Próximo mês',
                today: 'Hoje',
                month: 'Visualizar mês',
                week: 'Visualizar semana',
                day: 'Visualizar dia'
              }}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                omitZeroMinute: false,
                meridiem: false,
                hour12: false
              }}
              dayHeaderFormat={{ weekday: 'long' }}
            />
          )}
        </main>

        {/* --- Modais --- */}
        {/* Modal de Criação de Evento */}
        <Transition appear show={isCreateModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-30" onClose={() => setIsCreateModalOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
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
                  <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                    {/* Header do Modal */}
                    <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                      <Dialog.Title
                        as="h3"
                        className="text-xl font-semibold leading-6 text-gray-900 dark:text-gray-100 flex items-center"
                      >
                        <CalendarDaysIcon className="h-6 w-6 mr-3 text-indigo-600 dark:text-indigo-400" />
                        Criar Novo Agendamento
                      </Dialog.Title>
                      <button 
                          onClick={() => setIsCreateModalOpen(false)} 
                          className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                          aria-label="Fechar modal"
                      >
                          <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                    
                    <form onSubmit={handleCreateEventSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="summary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Título do Evento</label>
                        <input
                          type="text"
                          name="summary"
                          id="summary"
                          value={newEventForm.summary}
                          onChange={handleNewEventFormChange}
                          required
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                          placeholder="Ex: Reunião com Paciente X"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                        <div>
                          <label htmlFor="start" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Início</label>
                          <input
                            type="datetime-local"
                            name="start"
                            id="start"
                            value={newEventForm.start}
                            onChange={handleNewEventFormChange}
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm transition-colors"
                          />
                        </div>
                        <div>
                          <label htmlFor="end" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fim</label>
                          <input
                            type="datetime-local"
                            name="end"
                            id="end"
                            value={newEventForm.end}
                            onChange={handleNewEventFormChange}
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm transition-colors"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descrição (Opcional)</label>
                        <textarea
                          name="description"
                          id="description"
                          rows={3}
                          value={newEventForm.description}
                          onChange={handleNewEventFormChange}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                          placeholder="Detalhes adicionais sobre o evento..."
                        />
                      </div>
                      
                      <div className="flex items-center pt-2">
                        <label htmlFor="addGoogleMeetCreateToggle" className="flex items-center cursor-pointer select-none">
                          <div className="relative">
                            <input 
                              type="checkbox" 
                              id="addGoogleMeetCreateToggle" 
                              name="addGoogleMeet" 
                              checked={newEventForm.addGoogleMeet}
                              onChange={handleNewEventFormChange}
                              className="sr-only peer"
                            />
                            <div className="block w-11 h-6 rounded-full bg-gray-300 dark:bg-gray-600 peer-checked:bg-indigo-600 transition-colors"></div>
                            <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-full"></div>
                          </div>
                          <div className="ml-3 text-sm text-gray-700 dark:text-gray-300 peer-checked:text-indigo-700 dark:peer-checked:text-indigo-300">
                            Adicionar videoconferência Google Meet
                          </div>
                        </label>
                      </div>

                      <div className="pt-8 mt-2 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-2 space-y-reverse sm:space-y-0">
                         <button 
                            type="button" 
                            onClick={() => setIsCreateModalOpen(false)} 
                            disabled={isSubmittingModal}
                            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white dark:bg-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                          >
                            Cancelar
                          </button>
                         <button 
                            type="submit" 
                            disabled={isSubmittingModal}
                            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                           {isSubmittingModal ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2.5 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Criando...
                            </>
                          ) : 'Criar Evento'}
                         </button>
                      </div>
                    </form>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Modal de Visualização/Edição de Evento */}
        <Transition appear show={isViewEditModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-30" onClose={closeViewEditModal}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
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
                  <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                    <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                      <Dialog.Title
                        as="h3"
                        className="text-xl font-semibold leading-6 text-gray-900 dark:text-gray-100 flex items-center"
                      >
                        {isEditingEvent ? (
                           <><PencilIcon className="h-6 w-6 mr-3 text-indigo-600 dark:text-indigo-400" /> Editar Agendamento</>
                        ) : (
                           <><CalendarDaysIcon className="h-6 w-6 mr-3 text-indigo-600 dark:text-indigo-400" /> Detalhes do Agendamento</>
                        )}
                      </Dialog.Title>
                       <button 
                          onClick={closeViewEditModal} 
                          className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                          aria-label="Fechar modal"
                      >
                          <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>

                    {selectedEvent && (
                      isEditingEvent && editEventForm ? (
                        // --- MODO DE EDIÇÃO ---
                        <form onSubmit={handleUpdateEventSubmit} className="space-y-6">
                          <div>
                            <label htmlFor="edit-summary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Título do Evento</label>
                            <input
                              type="text"
                              name="summary"
                              id="edit-summary"
                              value={editEventForm.summary}
                              onChange={handleEditEventFormChange}
                              required
                              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                            <div>
                              <label htmlFor="edit-start" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Início</label>
                              <input
                                type="datetime-local"
                                name="start"
                                id="edit-start"
                                value={editEventForm.start}
                                onChange={handleEditEventFormChange}
                                required
                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm transition-colors"
                              />
                            </div>
                            <div>
                              <label htmlFor="edit-end" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fim</label>
                              <input
                                type="datetime-local"
                                name="end"
                                id="edit-end"
                                value={editEventForm.end}
                                onChange={handleEditEventFormChange}
                                required
                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm transition-colors"
                              />
                            </div>
                          </div>
                          <div>
                            <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descrição (Opcional)</label>
                            <textarea
                              name="description"
                              id="edit-description"
                              rows={3}
                              value={editEventForm.description}
                              onChange={handleEditEventFormChange}
                              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                            />
                          </div>
                          <div className="flex items-center pt-2">
                            <label htmlFor="addGoogleMeetEditToggle" className="flex items-center cursor-pointer select-none">
                              <div className="relative">
                                <input 
                                  type="checkbox" 
                                  id="addGoogleMeetEditToggle" 
                                  name="addGoogleMeet" 
                                  checked={editEventForm.addGoogleMeet}
                                  onChange={handleEditEventFormChange}
                                  className="sr-only peer"
                                />
                                <div className={`block w-11 h-6 rounded-full bg-gray-300 dark:bg-gray-600 peer-checked:bg-indigo-600 transition-colors`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-full`}></div>
                              </div>
                              <div className="ml-3 text-sm text-gray-700 dark:text-gray-300 peer-checked:text-indigo-700 dark:peer-checked:text-indigo-300">
                                Adicionar/Manter videoconferência Google Meet
                              </div>
                            </label>
                          </div>
                          <div className="pt-8 mt-2 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-2 space-y-reverse sm:space-y-0">
                            <button
                              type="button"
                              onClick={() => setIsEditingEvent(false)} 
                              disabled={isSubmittingModal}
                              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white dark:bg-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                              Cancelar Edição
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmittingModal}
                              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {isSubmittingModal ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2.5 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Salvando...
                                </> 
                              ) : 'Salvar Alterações'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        // --- MODO DE VISUALIZAÇÃO ---
                        <div className="space-y-5">
                          <dl className="space-y-4 divide-y divide-gray-200 dark:divide-gray-700">
                            <div className="pt-4 first:pt-0">
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Título</dt>
                              <dd className="mt-1 text-md font-semibold text-gray-900 dark:text-gray-100">{selectedEvent.title}</dd>
                            </div>
                            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                              <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Início</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                  {selectedEvent.start ? format(parseISO(selectedEvent.start.toString()), "dd/MM/yyyy 'às' HH:mm") : 'N/A'}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Fim</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                  {selectedEvent.end ? format(parseISO(selectedEvent.end.toString()), "dd/MM/yyyy 'às' HH:mm") : 'N/A'}
                                </dd>
                              </div>
                            </div>
                            {selectedEvent.description && (
                              <div className="pt-4">
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Descrição</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">{selectedEvent.description}</dd>
                              </div>
                            )}
                            {selectedEvent.gmeetLink && (
                              <div className="pt-4">
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Videoconferência</dt>
                                <dd className="mt-1 text-sm">
                                  <a href={selectedEvent.gmeetLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-x-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline font-medium">
                                    <VideoCameraIcon className="h-5 w-5"/>
                                    Entrar na chamada Google Meet
                                  </a>
                                </dd>
                              </div>
                            )}
                             {selectedEvent.location && !selectedEvent.gmeetLink && (
                              <div className="pt-4">
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Local/Link Adicional</dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">{selectedEvent.location}</dd>
                              </div>
                            )}
                          </dl>
                          <div className="pt-6 mt-5 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                            <button
                              type="button"
                              onClick={handleDeleteCurrentEvent}
                              disabled={isSubmittingModal || deleteEventMutation.isPending}
                              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {deleteEventMutation.isPending ? (
                                <>
                                 <svg className="animate-spin -ml-1 mr-2.5 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Excluindo...
                                </> 
                              ) : <><TrashIcon className="-ml-0.5 mr-1.5 h-5 w-5" />Excluir</>}
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditingEvent(true)}
                              disabled={isSubmittingModal}
                              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                              <PencilIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                              Editar
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Modal de Contatar Paciente */}
        {isContactModalOpen && (
          <Transition appear show={isContactModalOpen} as={Fragment}>
            <Dialog as="div" className="relative z-30" onClose={() => setIsContactModalOpen(false)}>
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
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
                    <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                      {/* Header do Modal */}
                      <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                        <Dialog.Title
                          as="h3"
                          className="text-xl font-semibold leading-6 text-gray-900 dark:text-gray-100 flex items-center"
                        >
                          <UserPlusIcon className="h-6 w-6 mr-3 text-blue-600 dark:text-blue-400" />
                          Solicitar Contato com Paciente/Lead
                        </Dialog.Title>
                        <button 
                            onClick={() => setIsContactModalOpen(false)} 
                            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                            aria-label="Fechar modal"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>
                      
                      {/* Formulário */}
                      <form onSubmit={handleRequestContactSubmit} className="space-y-6">
                        <div>
                          <label htmlFor="patientIdSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Paciente/Lead
                          </label>
                          <PatientSelect 
                            selectedPatient={selectedPatientForContact}
                            onPatientSelect={(patient) => handlePatientSelectedForContact(patient as PatientForSelect)}
                            onNewPatient={() => {
                              toast.info('Funcionalidade "Novo Paciente" a ser implementada.');
                            }}
                            disabled={isSubmittingModal}
                          />
                        </div>
                       
                        <div>
                          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Motivo do Contato</label>
                          <textarea
                            name="reason"
                            id="reason"
                            rows={4}
                            value={contactFormData.reason}
                            onChange={handleContactFormChange}
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                            placeholder="Ex: Confirmar consulta, reagendar, novo paciente interessado..."
                          />
                        </div>

                        {/* Footer do Modal */}
                        <div className="pt-8 mt-2 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-2 space-y-reverse sm:space-y-0">
                          <button
                            type="button"
                            onClick={() => setIsContactModalOpen(false)}
                            disabled={isSubmittingModal}
                            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white dark:bg-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingModal || requestContactMutation.isPending}
                            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {requestContactMutation.isPending ? (
                               <>
                                <svg className="animate-spin -ml-1 mr-2.5 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Solicitando...
                              </> 
                            ) : 'Solicitar Contato'}
                          </button>
                        </div>
                      </form>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>
        )}
      </div>
      <GlobalCalendarStyles />
    </>
  );
};

const AgendaPage = () => {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AgendaPageContent />
    </QueryClientProvider>
  );
};

export default AgendaPage;

const GlobalCalendarStyles = () => (
  <style jsx global>{`
    /* Custom FullCalendar Styles using Tailwind análogo */

    /* Toolbar Title */
    .fc .fc-toolbar-title {
      font-size: 1.5rem; /* Equivale a text-2xl */
      font-weight: 600; /* Equivale a font-semibold */
      color: #1f2937; /* gray-800 */
    }
    .dark .fc .fc-toolbar-title {
      color: #f9fafb; /* gray-50, mais claro para melhor visibilidade no dark mode */
    }

    /* Toolbar Buttons General */
    .fc .fc-button {
      background-color: #e5e7eb; /* gray-200 */
      color: #374151; /* gray-700 */
      border: 1px solid #d1d5db; /* gray-300 */
      padding: 0.5rem 0.75rem; /* py-2 px-3 */
      border-radius: 0.5rem; /* rounded-lg */
      text-transform: capitalize;
      font-weight: 500; /* medium */
      transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
    }
    .dark .fc .fc-button {
      background-color: #4b5563; /* gray-600 */
      color: #f3f4f6; /* gray-100 */
      border-color: #6b7280; /* gray-500 */
    }

    .fc .fc-button:hover {
      background-color: #d1d5db; /* gray-300 */
      border-color: #9ca3af; /* gray-400 */
    }
    .dark .fc .fc-button:hover {
      background-color: #6b7280; /* gray-500 */
      border-color: #9ca3af; /* gray-400 */
    }

    .fc .fc-button:disabled {
      background-color: #f3f4f6; /* gray-100 */
      color: #9ca3af; /* gray-400 */
      border-color: #e5e7eb; /* gray-200 */
    }
    .dark .fc .fc-button:disabled {
      background-color: #374151; /* gray-700 */
      color: #6b7280; /* gray-500 */
      border-color: #4b5563; /* gray-600 */
    }
    
    /* Active/Selected View Button */
    .fc .fc-button-primary:not(:disabled).fc-button-active,
    .fc .fc-button-primary:not(:disabled):active {
      background-color: #4f46e5; /* indigo-600 */
      color: white;
      border-color: #4f46e5; /* indigo-600 */
    }
    .dark .fc .fc-button-primary:not(:disabled).fc-button-active,
    .dark .fc .fc-button-primary:not(:disabled):active {
      background-color: #6366f1; /* indigo-500 */
      color: white;
      border-color: #6366f1; /* indigo-500 */
    }

    /* Estilo para botões de visualização INATIVOS no modo escuro */
    .dark .fc .fc-button-primary:not(.fc-button-active) {
      background-color: #374151; /* gray-700 */
      color: #d1d5db; /* gray-300 */
      border-color: #4b5563; /* gray-600 */
    }
    .dark .fc .fc-button-primary:not(.fc-button-active):hover {
      background-color: #4b5563; /* gray-600 */
      border-color: #6b7280; /* gray-500 */
    }

    /* Today Button - make it stand out a bit */
    .fc .fc-today-button {
      background-color: #c7d2fe; /* indigo-200 */
      color: #3730a3; /* indigo-800 */
      border-color: #a5b4fc; /* indigo-300 */
    }
    .dark .fc .fc-today-button {
      background-color: #4338ca; /* indigo-700 */
      color: #e0e7ff; /* indigo-100 */
      border-color: #5c5ae5; /* indigo-600 */
    }
    .fc .fc-today-button:hover {
      background-color: #a5b4fc; /* indigo-300 */
      border-color: #818cf8; /* indigo-400 */
    }
    .dark .fc .fc-today-button:hover {
      background-color: #5c5ae5; /* indigo-600 */
      border-color: #4338ca; /* indigo-700 */
    }
    .fc .fc-today-button:disabled {
        /* Use general disabled style */
    }
    .dark .fc .fc-today-button:disabled {
        /* Use general disabled style */
    }

    /* Adjust spacing between button groups in toolbar */
    .fc .fc-toolbar.fc-header-toolbar {
      margin-bottom: 1.5rem; /* mb-6 */
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem; /* space-x-3 or space-y-3, applied with gap */
    }
    .fc .fc-toolbar-chunk {
      display: flex;
      align-items: center;
      gap: 0.5rem; /* space-x-2 or space-y-2 */
    }

    /* Calendar general border and background (viewClassNames also used) */
    .fc {
      border-radius: 0.5rem; /* rounded-lg */
      overflow: hidden; /* to make border-radius work with internal elements */
    }

    /* Day headers */
    .fc .fc-col-header-cell-cushion {
      padding-top: 0.75rem; /* py-3 */
      padding-bottom: 0.75rem;
      font-size: 0.875rem; /* text-sm */
      font-weight: 500; /* font-medium */
      color: #6b7280; /* gray-500 */
    }
    .dark .fc .fc-col-header-cell-cushion {
      color: #9ca3af; /* gray-400 */
    }

    /* Timegrid slot labels (e.g., 10:00 AM) */
    .fc .fc-timegrid-slot-label-cushion {
      font-size: 0.75rem; /* text-xs */
      color: #6b7280; /* gray-500 */
    }
    .dark .fc .fc-timegrid-slot-label-cushion {
      color: #9ca3af; /* gray-400 */
    }
    
    .fc .fc-timegrid-slot {
        height: 3.5em; /* Aumenta a altura dos slots de horário */
    }

    .fc .fc-timegrid-slot-lane {
        border-color: #e5e7eb; /* gray-200 */
    }
    .dark .fc .fc-timegrid-slot-lane {
        border-color: #374151; /* gray-700 */
    }

    /* DayGrid day numbers */
    .fc .fc-daygrid-day-number {
      font-size: 0.875rem; /* text-sm */
      color: #374151; /* gray-700 */
      padding: 0.25rem 0.375rem; /* similar to p-1 or p-1.5 */
    }
    .dark .fc .fc-daygrid-day-number {
      color: #d1d5db; /* gray-300 */
    }
    .fc .fc-day-today .fc-daygrid-day-number {
        background-color: #c7d2fe; /* indigo-200 */
        border-radius: 9999px; /* rounded-full */
        color: #3730a3; /* indigo-800 */
        font-weight: 600;
    }
    .dark .fc .fc-day-today .fc-daygrid-day-number {
        background-color: #4f46e5; /* indigo-600 */
        color: #eef2ff; /* indigo-50 */
    }

    /* Current day styling */
    .fc .fc-day-today {
        background-color: rgba(238, 242, 255, 0.5); /* indigo-100 com opacidade no modo claro */
    }
    .dark .fc .fc-day-today {
        background-color: rgba(55, 48, 163, 0.3); /* indigo-800 com opacidade no modo escuro, mais sutil */
    }

    .fc .fc-day-today .fc-daygrid-day-number {
        background-color: #c7d2fe; /* indigo-200 */
        border-radius: 9999px; /* rounded-full */
        color: #3730a3; /* indigo-800 */
        font-weight: 600;
        padding: 0.125rem 0.375rem; /* Ajuste fino no padding */
        display: inline-block; /* Necessário para padding e border-radius corretos */
        line-height: 1.25; /* Ajuste para centralização vertical */
    }
    .dark .fc .fc-day-today .fc-daygrid-day-number {
        background-color: #4f46e5; /* indigo-600 */
        color: #eef2ff; /* indigo-50 */
    }

    /* Remove default focus outline and use Tailwind's focus rings if needed elsewhere */
    .fc .fc-button:focus {
      box-shadow: none;
    }

  `}</style>
); 